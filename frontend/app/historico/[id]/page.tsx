'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SavedReport, Section } from '../../../types';
import { useReportActions } from '../../../hooks/useReportActions';
import { useReportState } from '../../../hooks/useReportState';
import { useBrands } from '../../../hooks/useBrands';
import { useProducts } from '../../../hooks/useProducts';
import ReportForm from '../../../components/ReportForm';
import { formatCurrency } from '../../../utils/formatters';
import { generateExcel } from '../../../utils/excelExporter';
import { pdf as generatePdf } from '@react-pdf/renderer';
import { ReportPDFDocument } from '../../../components/PDFDocument';
import { savedToFrontendSections, buildPayload } from '../../../utils/historicoHelpers';
import { DeleteModal } from '../../../components/HistoricoPage/DeleteModal';
import { FieldDisplay } from '../../../components/HistoricoPage/FieldDisplay';
import {
    ArrowLeft,
    Pencil,
    Eye,
    Trash2,
    Loader2,
    X,
    ClipboardList,
    EyeIcon,
} from 'lucide-react';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Helpers & Components Imported ──────────────────────────────────────────

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    console.log(searchParams);
    const { user, loading: authLoading, isAdmin, getIdToken } = useAuth();
    const router = useRouter();

    const [report, setReport] = useState<SavedReport | null>(null);
    const [fetching, setFetching] = useState(true);
    const [fetchError, setFetchError] = useState('');
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        if (searchParams.get('edit') === '1') {
            setEditMode(true);
        }
    }, [searchParams]);

    const [showDelete, setShowDelete] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const saveStatusTimer = useRef<NodeJS.Timeout | null>(null);

    const { saveReport: _save, updateReport, deleteReport, saving, deleting } = useReportActions();
    const { state, actions, utils } = useReportState();
    const { brandNames: brands } = useBrands();
    const { products: catalogProducts } = useProducts();

    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [generatingExcel, setGeneratingExcel] = useState(false);
    const [reportTitle, setReportTitle] = useState('');

    const { especificador, contact, consultor, consultorPhone, sections, cashDiscount, loading: productLoading, clientInfo } = state;
    const {
        setEspecificador, setContact, setConsultor, setConsultorPhone, setSections,
        setCashDiscount, addSection, addProduct, updateProduct, updateSectionMargin,
        removeSection, removeProduct, updateSectionName, updateClientInfo,
    } = actions;
    const { calculateSubtotal, timers, setLoading } = utils;

    // Auth guard
    useEffect(() => {
        if (!authLoading && !user) router.push('/sign-in');
    }, [user, authLoading, router]);

    // Fetch report
    useEffect(() => {
        if (!user) return;
        (async () => {
            setFetching(true);
            setFetchError('');
            try {
                const token = await getIdToken();
                const res = await fetch(`${API}/reports/report/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    const d = await res.json();
                    throw new Error(d.error?.message || 'Relatório não encontrado');
                }
                const d = await res.json();
                const fetched: SavedReport = d.data;
                setReport(fetched);
                setReportTitle(fetched.title);
                // Pre-populate form state from saved report
                setSections(savedToFrontendSections(fetched));
                if (fetched.especificador) setEspecificador(fetched.especificador);
                if (fetched.consultor) setConsultor(fetched.consultor);
                if (fetched.consultorPhone) setConsultorPhone(fetched.consultorPhone);
                if (fetched.cash_discount != null) setCashDiscount(fetched.cash_discount);
                if (fetched.client_info) {
                    const ci = fetched.client_info;
                    (Object.keys(ci) as (keyof typeof ci)[]).forEach((k) => {
                        updateClientInfo(k, ci[k] ?? '');
                    });
                }
            } catch (e: unknown) {
                setFetchError(e instanceof Error ? e.message : 'Erro ao carregar relatório');
            } finally {
                setFetching(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, id]);

    const canEdit = !!user && (isAdmin || report?.creator_id === user.uid);

    const showSaved = (status: 'saved' | 'error') => {
        setSaveStatus(status);
        if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
        saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const subtotalBeforeCash = sections.reduce((acc, s) => acc + calculateSubtotal(s.products, s.discount), 0);
    const totalValue = subtotalBeforeCash * (1 - (cashDiscount || 0) / 100);

    const handleSave = async () => {
        if (!report) return;
        const payload = buildPayload(reportTitle || report.title, especificador, consultor, consultorPhone, cashDiscount, clientInfo, sections);
        try {
            await updateReport(report._id, payload);
            setReport(prev => prev ? { ...prev, title: payload.title, sections: payload.sections as SavedReport['sections'] } : prev);
            showSaved('saved');
            setEditMode(false);
        } catch {
            showSaved('error');
        }
    };

    const handleDelete = async () => {
        if (!report) return;
        try {
            await deleteReport(report._id);
            router.push('/historico');
        } catch {
            alert('Erro ao deletar relatório.');
        }
    };

    const handleProductCodeChange = (sectionId: string, productId: string, code: string) => {
        updateProduct(sectionId, productId, { code });
        if (timers.current[productId]) clearTimeout(timers.current[productId]);
        if (code.length >= 3) {
            timers.current[productId] = setTimeout(() => {
                setLoading(productId);
                const match = catalogProducts.find(p => p.product_code.toLowerCase() === code.toLowerCase());
                setSections((prev: Section[]) => prev.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        products: s.products.map(p => {
                            if (p.id !== productId || p.code !== code) return p;
                            if (!match) return { ...p, name: 'Produto não encontrado', priceBase: 0, image: '', dbId: undefined };
                            return { ...p, dbId: match._id, name: match.description, priceBase: match.base_price, brand: match.brand_name, image: match.imageurl ?? '' };
                        }),
                    };
                }));
                setLoading(null);
                delete timers.current[productId];
            }, 300);
        }
    };

    const handleGeneratePDF = async () => {
        setGeneratingPDF(true);
        try {
            await handleSave();
            const doc = (
                <ReportPDFDocument
                    especificador={especificador}
                    consultor={consultor}
                    consultorPhone={consultorPhone}
                    sections={sections}
                    totalValue={totalValue}
                    subtotalBeforeCash={subtotalBeforeCash}
                    cashDiscount={cashDiscount}
                    clientInfo={clientInfo}
                />
            );
            const blob = await generatePdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${(reportTitle || report?.title || 'Relatorio').replace(/\s+/g, '_')}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch { alert('Erro ao gerar PDF.'); }
        finally { setGeneratingPDF(false); }
    };

    const handleGenerateExcel = async () => {
        setGeneratingExcel(true);
        try {
            await handleSave();
            await generateExcel({ especificador, consultor, consultorPhone, sections, cashDiscount, clientInfo });
        } catch { alert('Erro ao gerar Excel.'); }
        finally { setGeneratingExcel(false); }
    };

    // ── Render guards ────────────────────────────────────────────────────────
    if (authLoading || fetching) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-primary" />
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-muted flex flex-col items-center justify-center gap-4 text-gray-400">
                <ClipboardList size={40} />
                <p className="font-black text-sm uppercase tracking-widest">{fetchError}</p>
                <Link href="/reports" className="text-primary text-xs font-black underline underline-offset-2">
                    Voltar ao histórico
                </Link>
            </div>
        );
    }

    if (!report) return null;

    return (
        <div className="min-h-screen bg-muted">
            {showDelete && (
                <DeleteModal
                    reportId={report._id}
                    reportTitle={report.title}
                    onClose={() => setShowDelete(false)}
                    onDeleted={() => {}}
                    handleDeleteExternally={handleDelete}
                    externalDeleting={deleting}
                />
            )}

            <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-in fade-in duration-700">
                {/* ── Top bar ────────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <Link
                        href="/historico"
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={14} /> Histórico
                    </Link>

                    <div className="flex items-center gap-3">
                        {/* Save status */}
                        {saveStatus === 'saved' && (
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest animate-in fade-in">
                                ✓ Salvo
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-in fade-in">
                                ✗ Erro ao salvar
                            </span>
                        )}

                        {canEdit && !editMode && (
                            <button
                                onClick={() => setEditMode(true)}
                                className="flex items-center gap-2 bg-secondary text-white font-black px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-primary transition-all"
                            >
                                <Pencil size={14} /> Editar
                            </button>
                        )}

                        {editMode && (
                            <button
                                onClick={() => {
                                    setEditMode(false);
                                    // Reset title to original
                                    setReportTitle(report.title);
                                    setSections(savedToFrontendSections(report));
                                    window.location.reload();
                                }}
                                className="flex cursor-pointer items-center gap-2 bg-gray-200 text-gray-600 font-black px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-gray-300 transition-all"
                            >
                                <EyeIcon size={14} /> Visualizar
                            </button>
                        )}

                        {canEdit && (
                            <button
                                onClick={() => setShowDelete(true)}
                                className="flex items-center gap-2 bg-red-50 text-red-500 font-black px-5 py-2.5 rounded-full text-xs uppercase tracking-widest hover:bg-red-100 transition-all"
                            >
                                <Trash2 size={14} /> Deletar
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Title field ───────────────────────────────────── */}
                {!editMode && (
                    <div className="bg-white rounded-xl border-2 border-gray-100 px-6 py-4 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <label className="text-[9px] uppercase font-black tracking-[0.35em] text-gray-400">
                                Título do Relatório
                            </label>
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-300 flex items-center gap-1">
                                <Eye size={10} />
                                Somente leitura
                            </span>
                        </div>
                        <span className="text-secondary font-black text-lg">{report.title}</span>
                        <span className="text-[10px] text-gray-300 font-medium">
                            Criado em {new Date(report.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                )}

                {/* ── View Mode: Summary ────────────────────────────── */}
                {!editMode && (
                    <div className="flex flex-col gap-6">
                        {/* Client / Especificador / Consultor summary */}
                        {(report.especificador || report.consultor || report.consultorPhone || report.client_info?.name) && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 grid grid-cols-2 md:grid-cols-4 gap-5">
                                {report.especificador && <FieldDisplay label="Especificador" value={report.especificador} />}
                                {report.consultor && <FieldDisplay label="Consultor" value={report.consultor} />}
                                {report.consultorPhone && <FieldDisplay label="Telefone Consultor" value={report.consultorPhone} />}
                                {report.client_info?.name && <FieldDisplay label="Cliente" value={report.client_info.name} />}
                                {report.client_info?.telefone && <FieldDisplay label="Telefone" value={report.client_info.telefone} />}
                            </div>
                        )}

                        {report.sections.map((section, si) => {
                            const sectionTotal = section.products.reduce((acc, p) => acc + p.total, 0) * (1 - (section.section_discount || 0) / 100);
                            return (
                                <div key={si} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                    {/* Section header */}
                                    <div className="bg-secondary px-6 py-4 flex items-center justify-between">
                                        <span className="text-white font-black text-sm uppercase tracking-widest">
                                            {section.section_name}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            {section.section_discount > 0 && (
                                                <span className="text-white/60 text-xs font-black uppercase tracking-widest">
                                                    Desconto: {section.section_discount}%
                                                </span>
                                            )}
                                            <span className="text-white font-black text-sm">
                                                {formatCurrency(sectionTotal)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Products table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-400 font-black uppercase text-[9px] tracking-[0.2em] border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-3 text-left">Produto</th>
                                                    <th className="px-6 py-3 text-left">Imagem</th>
                                                    <th className="px-6 py-3 text-center">Qtd</th>
                                                    <th className="px-6 py-3 text-right">Preço Unit.</th>
                                                    <th className="px-6 py-3 text-right">Desc.</th>
                                                    <th className="px-6 py-3 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {section.products.map((p, pi) => (
                                                    <tr key={pi} className="hover:bg-gray-50/60 transition-colors">
                                                        <td className="px-6 py-3">
                                                            <p className="font-semibold text-gray-700 break-words max-w-xs">{p.product_name}</p>
                                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{p.product_id}</span>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <Image src={p.image_url || '/placeholder.webp'} alt={p.product_name} width={40} height={40} className="w-16 h-16 object-cover" />
                                                        </td>
                                                        <td className="px-6 py-3 text-center font-medium text-gray-600">{p.quantity}</td>
                                                        <td className="px-6 py-3 text-right font-medium text-gray-600">{formatCurrency(p.price)}</td>
                                                        <td className="px-6 py-3 text-right text-gray-500">{p.discount > 0 ? `${p.discount}%` : '—'}</td>
                                                        <td className="px-6 py-3 text-right font-black text-secondary">{formatCurrency(p.total)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Total summary */}
                        <div className="bg-secondary rounded-xl px-8 py-6 flex justify-between items-center text-white">
                            <span className="font-black text-sm uppercase tracking-[0.2em] text-white/60">Total do Orçamento</span>
                            <span className="font-black text-2xl text-white">
                                {formatCurrency(report.sections.reduce((acc, s) => {
                                    const raw = s.products.reduce((a, p) => a + p.total, 0);
                                    return acc + raw * (1 - (s.section_discount || 0) / 100);
                                }, 0))}
                            </span>
                        </div>
                    </div>
                )}

                {/* ── Edit Mode: Full Form ──────────────────────────── */}
                {editMode && (
                    <div className="min-h-screen bg-muted flex flex-col pt-10 px-4 md:px-0">
                        <div className="container mx-auto">

                            <ReportForm
                                initialReportId={report._id}
                                initialTitle={reportTitle || report.title}
                                hideHeader={true}
                                initialState={{
                                    especificador: report.especificador,
                                    consultor: report.consultor,
                                    consultorPhone: report.consultorPhone,
                                    cashDiscount: report.cash_discount,
                                    clientInfo: report.client_info,
                                    sections: savedToFrontendSections(report)
                                }}
                            />
                        </div>
                    </div>

                )}
            </div>
        </div>
    );
}
