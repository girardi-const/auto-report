'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useReports } from '../../hooks/useReports';
import { useReportActions } from '../../hooks/useReportActions';
import { SavedReport } from '../../types';
import { generateExcel } from '../../utils/excelExporter';
import { pdf as generatePdf } from '@react-pdf/renderer';
import { ReportPDFDocument } from '../../components/PDFDocument';
import { formatCurrency } from '../../utils/formatters';
import { useUsers } from '../../hooks/useUsers';
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
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcReportTotal(report: SavedReport): number {
    const sectionTotal = report.sections.reduce((acc, s) => {
        const raw = s.products.reduce((a, p) => a + p.total, 0);
        return acc + raw * (1 - (s.section_discount || 0) / 100);
    }, 0);
    return sectionTotal;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────
interface DeleteModalProps {
    report: SavedReport;
    onClose: () => void;
    onDeleted: () => void;
}

function DeleteConfirmModal({ report, onClose, onDeleted }: DeleteModalProps) {
    const { deleteReport, deleting } = useReportActions();
    const [error, setError] = useState('');

    const handleDelete = async () => {
        setError('');
        try {
            await deleteReport(report._id);
            onDeleted();
            onClose();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Erro ao deletar');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
                <div className="p-6 flex flex-col gap-5">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
                        <Trash2 size={22} className="text-red-500" />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-secondary text-base">Deletar relatório?</p>
                        <p className="text-sm text-gray-400 mt-1 font-medium">{report.title}</p>
                        <p className="text-xs text-gray-300 mt-1">Esta ação não pode ser desfeita.</p>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg text-center">{error}</p>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest hover:border-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-50"
                        >
                            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            {deleting ? 'Deletando…' : 'Deletar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <tr className="border-b border-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
                <td key={i} className="px-6 py-4">
                    <div className="h-4 rounded bg-gray-100 animate-pulse" style={{ width: [200, 100, 80, 100, 80][i] }} />
                </td>
            ))}
        </tr>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
    const { user, loading: authLoading, isAdmin } = useAuth();
    const router = useRouter();
    const { users, fetchUsers } = useUsers();

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
                    image: p.image_url ?? '',
                })),
            }));

            const cashDiscount = report.cash_discount ?? 0;
            const subtotalBeforeCash = sections.reduce((acc, s) =>
                acc + s.products.reduce((a, p) => a + p.priceBase * p.units, 0) * (1 - (s.discount || 0) / 100)
                , 0);
            const totalValue = subtotalBeforeCash * (1 - cashDiscount / 100);

            const doc = (
                <ReportPDFDocument
                    especificador={report.especificador ?? ''}
                    consultor={report.consultor ?? ''}
                    consultorPhone={report.consultorPhone ?? ''}
                    sections={sections}
                    totalValue={totalValue}
                    subtotalBeforeCash={subtotalBeforeCash}
                    cashDiscount={cashDiscount}
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

    const colCount = 6; // always include actions column

    return (
        <div className="min-h-screen bg-muted">
            {/* Delete Modal */}
            {deleteTarget && (
                <DeleteConfirmModal
                    report={deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    onDeleted={refetch}
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
                {/* ── Filters ──────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 items-center flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                        <input
                            id="report-search"
                            type="text"
                            value={rawSearch}
                            onChange={handleSearchChange}
                            placeholder="Buscar por título ou cliente…"
                            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 placeholder:text-gray-300"
                        />
                    </div>

                    {/* Creator Filter (Admin) */}
                    {isAdmin && users.length > 0 && (
                        <div className="relative min-w-[200px]">
                            <select
                                value={creatorFilter}
                                onChange={(e) => { setCreatorFilter(e.target.value); setPage(1); }}
                                className="w-full px-4 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 bg-white appearance-none"
                            >
                                <option value="">Todos os usuários</option>
                                {users.map(u => (
                                    <option key={u.uid} value={u.name || (u.email ?? u.uid)}>{u.name || u.email}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Date From */}
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="pl-9 pr-3 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 bg-white"
                        />
                    </div>

                    {/* Date To */}
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="pl-9 pr-3 py-2.5 text-sm rounded-lg border-2 border-gray-100 focus:border-primary outline-none transition-all font-medium text-gray-700 bg-white"
                        />
                    </div>

                    {/* Clear */}
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors whitespace-nowrap px-2"
                        >
                            <X size={14} /> Limpar
                        </button>
                    )}
                </div>

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
                                {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}

                                {!loading && reports.length === 0 && (
                                    <tr>
                                        <td colSpan={colCount} className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-300">
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

                                {!loading && reports.map((r) => (
                                    <tr key={r._id} className="group hover:bg-gray-50/60 transition-colors">
                                        {/* Title — clickable to detail */}
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
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-all disabled:opacity-40"
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
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all disabled:opacity-40"
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
                                            const canAct = isAdmin || r.creator_id === user.uid;
                                            return (
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {canAct && (
                                                            <>
                                                                <Link
                                                                    href={`/historico/${r._id}?edit=1`}
                                                                    title="Editar relatório"
                                                                    className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                                                                >
                                                                    <Pencil size={15} />
                                                                </Link>
                                                                <button
                                                                    onClick={() => setDeleteTarget(r)}
                                                                    title="Deletar relatório"
                                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
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
                                ))}
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
