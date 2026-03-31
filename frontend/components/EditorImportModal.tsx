import React, { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { SavedReport } from '@/types';
import { EditorDocument, EditorBlock, TextBlock, SpacerBlock, TableBlock } from '@/types/editor';
import { X, Search, Loader2 } from 'lucide-react';

interface EditorImportModalProps {
    onClose: () => void;
    onImport: (doc: EditorDocument) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function EditorImportModal({ onClose, onImport }: EditorImportModalProps) {
    const [search, setSearch] = useState('');
    const { reports, loading } = useReports({ page: 1, limit: 10, search });

    const handleSelect = (report: SavedReport) => {
        const blocks: EditorBlock[] = [];

        // Client Info Block
        blocks.push({
            id: generateId(),
            type: 'text',
            style: 'p',
            align: 'left',
            bold: true,
            content: `Cliente: ${report.client_info?.name || 'Não informado'} | Tel: ${report.client_info?.telefone || 'Não informado'}`
        } as TextBlock);

        blocks.push({
            id: generateId(),
            type: 'text',
            style: 'p',
            align: 'left',
            bold: false,
            content: `Consultor: ${report.consultor || 'N/A'} - ${report.consultorPhone || ''}`
        } as TextBlock);

        blocks.push({ id: generateId(), type: 'spacer', height: 20 } as SpacerBlock);

        // Sections
        report.sections.forEach(sec => {
            blocks.push({
                id: generateId(),
                type: 'section',
                title: sec.section_name.toUpperCase()
            } as any);

            const headers = ['QTND', 'DESCRIÇÃO', 'IMAGEM', 'VALOR UND', 'SUB TOTAL'];
            const rows = sec.products.map(p => {
                const imgUrl = p.image_url ? `/api/proxy-image?url=${encodeURIComponent(p.image_url)}` : '';
                return [
                    String(p.quantity),
                    `${p.product_name}${p.product_id ? `\nCódigo: ${p.product_id}` : ''}`,
                    imgUrl,
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price),
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price * p.quantity)
                ];
            });

            blocks.push({
                id: generateId(),
                type: 'table',
                headers,
                rows,
                columnWidths: [6, 44, 18, 16, 16] // Balanced roughly to the PDF: 6% qty, 44% desc, 18% img, 16% unit, 16% sub
            } as any);

            const sectionTotal = sec.products.reduce((a, p) => a + p.price * p.quantity, 0);
            blocks.push({
                id: generateId(),
                type: 'section_total',
                label: 'Total da Seção:',
                value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sectionTotal)
            } as any);

            blocks.push({ id: generateId(), type: 'spacer', height: 10 } as any);
        });

        // Totals
        const totalProducts = report.sections.reduce((acc, s) => acc + s.products.reduce((a, p) => a + p.price * p.quantity, 0), 0);
        const deliveryFee = report.delivery_value || 0;
        
        blocks.push({
            id: generateId(),
            type: 'general_total',
            items: [
                { label: 'V. Produtos :', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProducts) },
                { label: 'Taxa de Entrega :', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deliveryFee) },
                { label: 'V. Descontos :', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(0) },
                { label: 'V. Total :', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalProducts + deliveryFee) }
            ]
        } as any);

        onImport({
            title: `CÓPIA - ${report.title.toUpperCase()}`,
            clientName: report.client_info?.name || 'Cliente',
            date: new Date(report.timestamp).toLocaleDateString('pt-BR'),
            blocks
        });
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-bold text-gray-800">Importar Relatório Salvo</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-800 rounded-lg hover:bg-gray-200 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar relatório por título ou cliente..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                    ) : reports.length === 0 ? (
                        <div className="text-center p-8 text-gray-400 text-sm">Nenhum relatório encontrado.</div>
                    ) : (
                        <div className="space-y-2">
                            {reports.map(r => (
                                <button
                                    key={r._id}
                                    onClick={() => handleSelect(r)}
                                    className="w-full text-left p-4 rounded-xl hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all group"
                                >
                                    <div className="font-semibold text-gray-800 group-hover:text-primary">{r.title}</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Cliente: {r.client_info?.name || 'N/A'} • Seções: {r.sections.length} • {new Date(r.timestamp).toLocaleDateString('pt-BR')}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
