"use client";

import { useState, useRef } from "react";
import { Plus as PlusIcon } from "lucide-react";
import { generateExcel } from '../utils/excelExporter';
import { pdf as generatePdf } from '@react-pdf/renderer';
import { ReportPDFDocument } from './PDFDocument';
import PageHeader from "./PageHeader";
import { GeneralInfo } from "./Generalnfo";
import { ClientInfo } from "./ClientInfo";
import { FinalCashDiscount } from "./FinalCashDiscount";
import { useReportState } from "../hooks/useReportState";
import { useBrands } from "../hooks/useBrands";
import { useReportActions } from "../hooks/useReportActions";
import { SectionCard } from "./SectionCard";
import { FloatingActionBar } from "./FloatingActionBar";
import { formatCurrency } from "../utils/formatters";
import { Section } from "../types";

// Maps the frontend Section[] to the API payload format
function buildSectionsPayload(sections: Section[], calculateSubtotal: (prods: Section['products'], disc: number) => number) {
    return sections.map((s) => ({
        section_name: s.name,
        section_margin: s.margin_section ?? 0,
        section_discount: s.discount ?? 0,
        products: s.products.map((p) => {
            const priceWithMargin = p.priceBase * (1 + (p.margin || 0) / 100);
            const priceWithDiscount = priceWithMargin * (1 - (p.discount || 0) / 100);
            return {
                product_name: p.name,
                product_id: p.code || p.id,
                brand: p.brand || '',
                image_url: p.image ?? '',
                price: priceWithDiscount,
                margin: p.margin ?? 0,
                discount: p.discount ?? 0,
                quantity: p.units,
                total: priceWithDiscount * p.units,
            };
        }),
    }));
}

interface ReportFormProps {
    onSaveSuccess?: () => void;
    onSaveError?: () => void;
    initialReportId?: string;
    initialTitle?: string;
    hideHeader?: boolean;
    initialState?: any;
}

export default function ReportForm({ onSaveSuccess, onSaveError, initialReportId, initialTitle, hideHeader, initialState }: ReportFormProps = {}) {
    const { state, actions, utils } = useReportState(initialState);
    const { brandNames: brands } = useBrands();
    const { saveReport, updateReport, saving } = useReportActions();

    const { especificador, contact, consultor, consultorPhone, sections, cashDiscount, loading, clientInfo } = state;
    const {
        setEspecificador, setContact, setConsultor, setConsultorPhone,
        setSections, setCashDiscount, addSection, addProduct, updateProduct,
        removeSection, removeProduct, updateSectionName, updateClientInfo, clearClientInfo, updateSectionMargin
    } = actions;
    const { calculateSubtotal, timers, setLoading } = utils;

    const [generating, setGenerating] = useState(false);
    const [generatingExcel, setGeneratingExcel] = useState(false);
    const [reportTitle, setReportTitle] = useState(initialTitle || "");
    const [savedReportId, setSavedReportId] = useState<string | null>(initialReportId || null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
    const saveStatusTimer = useRef<NodeJS.Timeout | null>(null);

    const showSaveStatus = (status: 'saved' | 'error') => {
        setSaveStatus(status);
        if (saveStatusTimer.current) clearTimeout(saveStatusTimer.current);
        saveStatusTimer.current = setTimeout(() => setSaveStatus('idle'), 3000);
    };

    const getEffectiveTitle = () => {
        if (reportTitle.trim()) return reportTitle.trim();
        const name = clientInfo.name.trim();
        return name ? `Orçamento - ${name}` : `Orçamento - ${new Date().toLocaleDateString('pt-BR')}`;
    };

    const handleProductCodeChange = (sectionId: string, productId: string, code: string) => {
        updateProduct(sectionId, productId, { code });

        if (timers.current[productId]) {
            clearTimeout(timers.current[productId]);
        }

        if (code.length >= 3) {
            timers.current[productId] = setTimeout(async () => {
                setLoading(productId);

                let match = null;
                try {
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}/products/${code}`);
                    if (res.ok) {
                        const json = await res.json();
                        match = json.data;
                    }
                } catch (e) {
                    console.error("Failed to search product by code", e);
                }

                setSections((prev: Section[]) => prev.map(s => {
                    if (s.id !== sectionId) return s;
                    return {
                        ...s,
                        products: s.products.map(p => {
                            if (p.id !== productId || p.code !== code) return p;
                            if (!match) return { ...p, name: "Produto não encontrado", priceBase: 0, originalPriceBase: 0, image: "", dbId: undefined };
                            return {
                                ...p,
                                dbId: match._id,
                                name: match.description,
                                priceBase: match.base_price,
                                originalPriceBase: match.base_price,
                                brand: match.brand_name,
                                image: match.imageurl ?? "",
                            };
                        })
                    };
                }));

                setLoading(null);
                delete timers.current[productId];
            }, 300);
        }
    };

    const validSections = sections.map(s => {
        const validProducts = s.products.filter(p => p.code && p.code.trim() !== "");
        const groupedProducts = validProducts.reduce((acc, current) => {
            const existing = acc.find(p => p.code === current.code);
            if (existing) {
                existing.units += current.units;
            } else {
                acc.push({ ...current });
            }
            return acc;
        }, [] as typeof validProducts);

        return {
            ...s,
            products: groupedProducts
        };
    });

    console.log(sections)

    const subtotalBeforeCash = validSections.reduce((acc, s) => acc + calculateSubtotal(s.products, s.discount), 0);
    const totalValue = subtotalBeforeCash * (1 - (cashDiscount || 0) / 100);

    // ── Persist to backend ────────────────────────────────────────────────────
    const handleSave = async (): Promise<string | null> => {
        const payload = {
            title: getEffectiveTitle(),
            especificador,
            consultor,
            consultorPhone,
            cash_discount: cashDiscount,
            client_info: clientInfo,
            sections: buildSectionsPayload(validSections, calculateSubtotal),
        };

        try {
            if (savedReportId) {
                await updateReport(savedReportId, payload);
                showSaveStatus('saved');
                if (onSaveSuccess) onSaveSuccess();
                return savedReportId;
            } else {
                const created = await saveReport(payload);
                setSavedReportId(created._id);
                showSaveStatus('saved');
                if (onSaveSuccess) onSaveSuccess();
                return created._id;
            }
        } catch {
            showSaveStatus('error');
            if (onSaveError) onSaveError();
            return null;
        }
    };

    const handleGenerateExcel = async () => {
        try {
            setGeneratingExcel(true);
            // Auto-save before export
            await handleSave();
            await generateExcel({ especificador, consultor, consultorPhone, sections: validSections, cashDiscount, clientInfo });
        } catch (error) {
            console.error('Error generating Excel:', error);
            alert('Erro ao gerar Excel. Por favor, tente novamente.');
        } finally {
            setGeneratingExcel(false);
        }
    };

    const handleGeneratePDF = async () => {
        try {
            setGenerating(true);
            // Auto-save before export
            await handleSave();

            const doc = <ReportPDFDocument
                especificador={especificador}
                consultor={consultor}
                consultorPhone={consultorPhone}
                sections={validSections}
                totalValue={totalValue}
                subtotalBeforeCash={subtotalBeforeCash}
                cashDiscount={cashDiscount}
                clientInfo={clientInfo}
            />;

            const blob = await generatePdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Orcamento_${clientInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Erro ao gerar PDF. Por favor, tente novamente.');
        } finally {
            setGenerating(false);
        }
    };

    const handleClear = () => {
        clearClientInfo();
        setEspecificador("");
        setContact("");
        setConsultor("");
        setConsultorPhone("");
        setSections([]);
        setReportTitle("");
        setSavedReportId(null);
        setSaveStatus('idle');
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8 animate-in fade-in duration-700">
            {!hideHeader && <PageHeader onClear={handleClear} />}

            {/* Report Title */}
            <div className="bg-white rounded-xl border-2 border-gray-100 px-6 py-4 flex flex-col gap-1.5">
                <label className="text-[9px] uppercase font-black tracking-[0.35em] text-gray-400">
                    Título do Relatório
                </label>
                <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value.toUpperCase())}
                    placeholder={`Orçamento - ${clientInfo.name || 'Nome do Cliente'}`}
                    className="bg-transparent text-secondary font-semibold text-sm outline-none placeholder:text-gray-300 w-full"
                />
                {saveStatus === 'saved' && (
                    <span className="text-[10px] font-black text-green-600 uppercase tracking-widest animate-in fade-in duration-300">
                        ✓ Relatório salvo com sucesso
                    </span>
                )}
                {saveStatus === 'error' && (
                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-in fade-in duration-300">
                        ✗ Erro ao salvar relatório
                    </span>
                )}
            </div>

            <GeneralInfo data={{ especificador, consultor, consultorPhone }} onChange={{ setEspecificador, setConsultor, setConsultorPhone }} />
            <ClientInfo data={clientInfo} onChange={updateClientInfo} />

            <div className="flex flex-col gap-8">
                {sections.map((section) => (
                    <SectionCard
                        key={section.id}
                        section={section}
                        brands={brands}
                        loadingProductId={loading}
                        actions={{
                            updateSectionName,
                            removeSection,
                            updateProduct,
                            removeProduct,
                            addProduct,
                            updateSectionMargin,
                            updateSectionDiscount: (id, discount) => setSections(sections.map(s => s.id === id ? { ...s, discount } : s))
                        }}
                        utils={{ calculateSubtotal }}
                        onProductCodeChange={handleProductCodeChange}
                    />
                ))}

                <button
                    onClick={addSection}
                    className="bg-white border-2 border-dashed border-gray-200 p-12 rounded-xl flex flex-col items-center justify-center gap-4 text-gray-300 hover:border-primary hover:text-primary transition-all group hover:bg-primary/5"
                >
                    <div className="bg-gray-50 p-4 rounded-full group-hover:bg-primary/10 transition-colors shadow-inner">
                        <PlusIcon size={32} strokeWidth={1} />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="font-black text-sm uppercase tracking-[0.2em]">Criar Nova Seção</span>
                        <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest group-hover:text-primary/50 transition-colors">Agrupe seus produtos por ambiente</span>
                    </div>
                </button>
            </div>

            <FinalCashDiscount
                value={cashDiscount}
                onChange={setCashDiscount}
                economy={formatCurrency(subtotalBeforeCash * (cashDiscount / 100))}
            />

            <FloatingActionBar
                subtotalBeforeCash={subtotalBeforeCash}
                totalValue={totalValue}
                isGeneratingExcel={generatingExcel}
                isGeneratingPDF={generating}
                isSaving={saving}
                hasSections={sections.length > 0}
                onGenerateExcel={handleGenerateExcel}
                onGeneratePDF={handleGeneratePDF}
                onSave={handleSave}
            />
        </div>
    );
}
