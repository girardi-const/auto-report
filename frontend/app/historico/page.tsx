'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReports } from '../../hooks/useReports';
import { SavedReport } from '../../types';
import { generateExcel } from '../../utils/excelExporter';
import { pdf as generatePdf } from '@react-pdf/renderer';
import { ReportPDFDocument } from '../../components/PDFDocument';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { calcReportTotal } from '../../utils/historicoHelpers';
import { DeleteModal } from '../../components/HistoricoPage/DeleteModal';
import { BulkDeleteModal } from '../../components/HistoricoPage/BulkDeleteModal';
import { HistoricoFilters } from '../../components/HistoricoPage/HistoricoFilters';
import { useUsers } from '../../hooks/useUsers';
import { useReportActions } from '../../hooks/useReportActions';
import {
    Search,
    RefreshCcw,
    FileText,
    FileSpreadsheet,
    Pencil,
    Trash2,
    Loader2,
    X,
    ClipboardList,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Calendar,
    CheckSquare,
    Copy,
} from 'lucide-react';

// ─── Helpers & Components Imported ──────────────────────────────────────────

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const { users, fetchUsers } = useUsers();
    const { deleteManyReports, deletingMany, saveReport } = useReportActions();

    // Filters State
    const [rawSearch, setRawSearch] = useState('');
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [creatorFilter, setCreatorFilter] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Fetch dynamic reports from API
    const { reports, loading, error, refetch, pagination } = useReports({
        page,
        limit,
        search,
        creator_name: creatorFilter,
        dateFrom,
        dateTo
    });

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/sign-in');
    }, [user, authLoading, router]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setRawSearch(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(val.trim());
            setPage(1);
        }, 300);
    }, []);

    const clearFilters = useCallback(() => {
        setRawSearch(''); setSearch(''); setDateFrom(''); setDateTo(''); setCreatorFilter(''); setPage(1);
    }, []);

    const hasFilters = rawSearch !== '' || dateFrom !== '' || dateTo !== '' || creatorFilter !== '';

    // Admin Users Loader for filters
    useEffect(() => {
        if (isAdmin) fetchUsers();
    }, [isAdmin, fetchUsers]);

    // Modal state
    const [deleteTarget, setDeleteTarget] = useState<SavedReport | null>(null);

    // Download states
    const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
    const [downloadingExcel, setDownloadingExcel] = useState<string | null>(null);
    const [copyingId, setCopyingId] = useState<string | null>(null);

    // ── Selection state ────────────────────────────────────────────────────
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // IDs user is allowed to delete (owner or admin)
    const selectableIds = useMemo(() => {
        if (!user) return new Set<string>();
        return new Set(reports.filter(r => isAdmin || r.creator_id === user.uid).map(r => r._id));
    }, [reports, user, isAdmin]);

    const allSelected = selectableIds.size > 0 && [...selectableIds].every(id => selectedIds.has(id));
    const someSelected = selectedIds.size > 0;

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(selectableIds));
        }
    }, [allSelected, selectableIds]);

    // Clear selection when page/filters change
    useEffect(() => { setSelectedIds(new Set()); }, [page, search, dateFrom, dateTo, creatorFilter]);

    const handleBulkDelete = async () => {
        await deleteManyReports([...selectedIds]);
        setSelectedIds(new Set());
        setShowBulkDeleteModal(false);
        refetch();
    };

    const handleCopyReport = async (originalId: string) => {
        const report = reports.find(r => r._id === originalId);
        if (!report) return;

        setCopyingId(originalId);
        try {
            await saveReport({
                title: `Cópia_${report.title}`,
                especificador: report.especificador,
                consultor: report.consultor,
                consultorPhone: report.consultorPhone,
                cash_discount: report.cash_discount,
                delivery_value: report.delivery_value,
                client_info: report.client_info,
                sections: report.sections.map(s => ({
                    section_name: s.section_name,
                    section_discount: s.section_discount,
                    products: s.products.map(p => ({
                        product_name: p.product_name,
                        product_id: p.product_id,
                        image_url: p.image_url,
                        price: p.price,
                        margin: p.margin || 0,
                        discount: p.discount || 0,
                        quantity: p.quantity,
                        type: p.type,
                        total: p.total,
                    })),
                })),
            });
            refetch();
        } catch (error) {
            console.error('Error copying report:', error);
            alert('Erro ao copiar o relatório.');
        } finally {
            setCopyingId(null);
        }
    };

    const totalPages = pagination?.totalPages || 1;
    const safePage = Math.min(page, totalPages);

    // ── PDF Download ────────────────────────────────────────────────────────
    const handleDownloadPDF = async (report: SavedReport) => {
        setDownloadingPDF(report._id);
        try {
            // Convert saved sections → frontend Section shape.
            // p.price is already the final unit price (margin+discount applied).
            // Use it as priceBase and zero margin/discount to avoid double-applying.
            const sections = report.sections.map((s) => ({
                id: s.section_name,
                name: s.section_name,
                margin_section: 0,
                discount: s.section_discount,
                products: s.products.map((p, i) => ({
                    id: String(i),
                    code: p.product_id,
                    brand: p.brand || '',
                    name: p.product_name,
                    units: p.quantity,
                    priceBase: p.price,
                    margin: p.margin || 0,
                    discount: p.discount || 0,
                    type: p.type,
                    image: p.image_url ?? '',
                })),
            }));

            const cashDiscount = report.cash_discount ?? 0;
            const deliveryFee = report.delivery_value ?? 0;
            const subtotalBeforeCash = sections.reduce((acc, s) =>
                acc + s.products.reduce((a, p) => a + p.priceBase * p.units, 0) * (1 - (s.discount || 0) / 100)
                , 0);
            const totalValue = subtotalBeforeCash * (1 - cashDiscount / 100) + deliveryFee;

            const doc = (
                <ReportPDFDocument
                    especificador={report.especificador ?? ''}
                    consultor={report.consultor ?? ''}
                    consultorPhone={report.consultorPhone ?? ''}
                    sections={sections}
                    totalValue={totalValue}
                    subtotalBeforeCash={subtotalBeforeCash}
                    cashDiscount={cashDiscount}
                    deliveryFee={deliveryFee}
                    clientInfo={report.client_info ?? { name: '', telefone: '' }}
                />
            );

            const blob = await generatePdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${report.title.replace(/\s+/g, '_')}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('PDF error:', e);
            alert('Erro ao gerar PDF.');
        } finally {
            setDownloadingPDF(null);
        }
    };

    // ── Excel Download ──────────────────────────────────────────────────────
    const handleDownloadExcel = async (report: SavedReport) => {
        setDownloadingExcel(report._id);
        try {
            const sections = report.sections.map((s) => ({
                id: s.section_name,
                name: s.section_name,
                margin_section: 0,
                discount: s.section_discount,
                products: s.products.map((p, i) => ({
                    id: String(i),
                    code: p.product_id,
                    brand: p.brand ?? '',
                    name: p.product_name,
                    units: p.quantity,
                    priceBase: p.price,
                    margin: p.margin ?? 0,
                    discount: p.discount ?? 0,
                    image: p.image_url ?? '',
                })),
            }));

            await generateExcel({
                especificador: report.especificador ?? '',
                consultor: report.consultor ?? '',
                consultorPhone: report.consultorPhone ?? '',
                sections,
                cashDiscount: report.cash_discount ?? 0,
                deliveryFee: report.delivery_value ?? 0,
                clientInfo: report.client_info ?? { name: '', telefone: '' },
            });
        } catch (e) {
            console.error('Excel error:', e);
            alert('Erro ao gerar Excel.');
        } finally {
            setDownloadingExcel(null);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary" />
            </div>
        );
    }

    if (!user) return null;

    const colCount = 8;

    return (
        <div className="min-h-screen bg-muted">
            {/* Delete Modal */}
            {deleteTarget && (
                <DeleteModal
                    reportId={deleteTarget._id}
                    reportTitle={deleteTarget.title}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={refetch}
                />
            )}

            {showBulkDeleteModal && (
                <BulkDeleteModal
                    count={selectedIds.size}
                    deleting={deletingMany}
                    onConfirm={handleBulkDelete}
                    onClose={() => setShowBulkDeleteModal(false)}
                />
            )}

            {/* ── Page Header ───────────────────────────────────────── */}
            <div className="px-6 py-6">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-gray-800 font-black text-2xl tracking-tight uppercase">
                            Histórico de Relatórios
                        </h1>
                        <p className="text-gray-800/40 text-xs font-medium mt-0.5">
                            {loading
                                ? 'Carregando…'
                                : `${reports.length} de ${pagination?.total || reports.length} relatório${(pagination?.total || reports.length) !== 1 ? 's' : ''}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                                ⚙ Admin
                            </span>
                        )}
                        <button
                            onClick={refetch}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gray-800/10 hover:bg-gray-800/20 text-gray-800 text-xs font-black uppercase tracking-widest px-4 py-2.5 rounded-full transition-all disabled:opacity-40 border border-gray-800/10"
                        >
                            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 flex flex-col gap-5">

                {/* ── Bulk Action Bar ──────────────────────────────────────── */}
                {someSelected && (
                    <div className="flex items-center justify-between gap-4 bg-primary text-white rounded-xl px-5 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
                        <span className="text-sm font-semibold">
                            {selectedIds.size} relatório{selectedIds.size !== 1 ? 's' : ''} selecionado{selectedIds.size !== 1 ? 's' : ''}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedIds(new Set())}
                                className="text-white/70 hover:text-white text-xs font-medium uppercase tracking-widest transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => setShowBulkDeleteModal(true)}
                                className="flex items-center gap-2 bg-white text-red-600 hover:bg-red-50 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full transition-all"
                            >
                                <Trash2 size={14} />
                                Deletar selecionados
                            </button>
                        </div>
                    </div>
                )}
                {/* ── Filters ──────────────────────────────────────────── */}
                <HistoricoFilters
                    rawSearch={rawSearch}
                    setRawSearch={setRawSearch}
                    handleSearchChange={handleSearchChange}
                    creatorFilter={creatorFilter}
                    setCreatorFilter={setCreatorFilter}
                    dateFrom={dateFrom}
                    setDateFrom={setDateFrom}
                    dateTo={dateTo}
                    setDateTo={setDateTo}
                    clearFilters={clearFilters}
                    hasFilters={hasFilters}
                    isAdmin={!!isAdmin}
                    users={users}
                    setPage={setPage}
                />

                {/* ── Error ────────────────────────────────────────────── */}
                {error && (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center gap-4 text-red-600">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <div>
                            <p className="font-black text-sm">Erro ao carregar relatórios</p>
                            <p className="text-xs text-red-400 mt-0.5">{error}</p>
                        </div>
                        <button
                            onClick={refetch}
                            className="ml-auto bg-red-600 text-white text-xs font-black px-4 py-2 rounded-full hover:bg-red-700 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* ── Table ────────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-gray-100">
                                <tr>
                                    <th className="pl-5 pr-2 py-4 w-10">
                                        <button
                                            onClick={toggleSelectAll}
                                            title={allSelected ? 'Deselecionar todos' : 'Selecionar todos'}
                                            className="text-gray-300 hover:text-primary transition-colors disabled:opacity-30"
                                            disabled={selectableIds.size === 0}
                                        >
                                            <CheckSquare
                                                size={16}
                                                className={allSelected ? 'text-primary' : someSelected ? 'text-primary/50' : ''}
                                            />
                                        </button>
                                    </th>
                                    <th className="px-6 py-4">Título</th>
                                    <th className="px-6 py-4">Usuário</th>
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Seções</th>
                                    <th className="px-6 py-4 text-right">Total</th>
                                    <th className="px-6 py-4 text-center">Exportar</th>
                                    <th className="px-6 py-4 text-center w-28">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading && Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-100">
                                        <td className="pl-5 pr-2 py-4" />
                                        {Array.from({ length: 6 }).map((__, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: [200, 100, 80, 100, 80, 60][j] }} />
                                            </td>
                                        ))}
                                    </tr>
                                ))}

                                {!loading && reports.length === 0 && (
                                    <tr>
                                        <td colSpan={colCount} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center justify-center w-full gap-3 text-gray-300">
                                                <ClipboardList size={36} />
                                                <p className="font-black text-sm uppercase tracking-widest">
                                                    Nenhum relatório encontrado
                                                </p>
                                                {hasFilters && (
                                                    <button
                                                        onClick={clearFilters}
                                                        className="text-primary text-xs font-black underline underline-offset-2"
                                                    >
                                                        Limpar filtros
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {!loading && reports.map((r) => {
                                    const canAct = isAdmin || r.creator_id === user.uid;
                                    const isChecked = selectedIds.has(r._id);
                                    return (
                                        <tr key={r._id} className={`group  transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-gray-100/60'}`}>
                                            {/* Checkbox */}
                                            <td className="pl-5 pr-2 py-4">
                                                {canAct && (
                                                    <input
                                                        type="checkbox"
                                                        checked={isChecked}
                                                        onChange={() => toggleSelect(r._id)}
                                                        className={`w-3 h-3 accent-primary cursor-pointer rounded ${isChecked ? 'opacity-90' : 'opacity-30'}`}
                                                        title="Selecionar relatório"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <Link
                                                    href={`/historico/${r._id}`}
                                                    className="font-semibold text-gray-700 hover:text-primary transition-colors truncate block"
                                                >
                                                    {r.title}
                                                </Link>
                                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                                    {r.sections.reduce((a, s) => a + s.products.length, 0)} produto{r.sections.reduce((a, s) => a + s.products.length, 0) !== 1 ? 's' : ''}
                                                </span>
                                            </td>

                                            {/* User */}
                                            <td className="px-6 py-4">
                                                <span className="inline-block bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                                    {r.creator_name || 'Usuário Desconhecido'}
                                                </span>
                                            </td>

                                            {/* Date */}
                                            <td className="px-6 py-4 text-gray-500 font-medium whitespace-nowrap">
                                                {formatDate(r.timestamp)}
                                            </td>

                                            {/* Sections count */}
                                            <td className="px-6 py-4">
                                                <span className="inline-block bg-secondary/5 text-secondary text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                                                    {r.sections.length} seç{r.sections.length !== 1 ? 'ões' : 'ão'}
                                                </span>
                                            </td>

                                            {/* Total */}
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-black text-secondary text-sm">
                                                    {formatCurrency(calcReportTotal(r))}
                                                </span>
                                            </td>

                                            {/* Export */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleDownloadExcel(r)}
                                                        disabled={downloadingExcel === r._id}
                                                        title="Baixar Excel"
                                                        className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all disabled:opacity-40"
                                                    >
                                                        {downloadingExcel === r._id
                                                            ? <Loader2 size={13} className="animate-spin" />
                                                            : <FileSpreadsheet size={13} />}
                                                        <span className="text-[10px] font-black uppercase tracking-wider">Excel</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownloadPDF(r)}
                                                        disabled={downloadingPDF === r._id}
                                                        title="Baixar PDF"
                                                        className="flex items-center gap-1.5 cursor-pointer px-3 py-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-40"
                                                    >
                                                        {downloadingPDF === r._id
                                                            ? <Loader2 size={13} className="animate-spin" />
                                                            : <FileText size={13} />}
                                                        <span className="text-[10px] font-black uppercase tracking-wider">PDF</span>
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Edit + Delete (owner or admin) */}
                                            {(() => {
                                                return (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => handleCopyReport(r._id)}
                                                                disabled={copyingId === r._id}
                                                                title='Faça uma copia desse orçamento'
                                                                className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-200  cursor-pointer transition-all disabled:opacity-40"
                                                            >
                                                                {copyingId === r._id ? <Loader2 size={15} className="animate-spin" /> : <Copy size={15} />}
                                                            </button>
                                                            {canAct && (
                                                                <>
                                                                    <Link
                                                                        href={`/historico/${r._id}?edit=1`}
                                                                        title="Editar relatório"
                                                                        className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-300 transition-all"
                                                                    >
                                                                        <Pencil size={15} />
                                                                    </Link>
                                                                    <button
                                                                        onClick={() => setDeleteTarget(r)}
                                                                        title="Deletar relatório"
                                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 cursor-pointer hover:bg-red-200 transition-all"
                                                                    >
                                                                        <Trash2 size={15} />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })()}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && (pagination?.total || 0) > limit && (
                        <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between gap-4">
                            <span className="text-xs text-gray-400 font-medium">
                                Página <span className="font-black text-secondary">{safePage}</span> de{' '}
                                <span className="font-black text-secondary">{totalPages}</span>
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={safePage === 1}
                                    className="p-2 rounded-lg border border-gray-100 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={safePage === totalPages}
                                    className="p-2 rounded-lg border border-gray-100 hover:border-primary hover:text-primary transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
