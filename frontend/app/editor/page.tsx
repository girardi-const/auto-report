'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Plus, Type, Image as ImageIcon, Table as TableIcon, AlignLeft, MoveUp, MoveDown, Trash2, Download, FileDown, Layers, X, Heading, Sigma, Receipt, PlusSquare } from "lucide-react";
import { EditorDocument, EditorBlock, TextBlock, ImageBlock, TableBlock, SpacerBlock, SectionBlock, SectionTotalBlock, GeneralTotalBlock } from '@/types/editor';
import { pdf } from '@react-pdf/renderer';
import { CustomPDFDocument } from '@/components/CustomPDFDocument';
import { toast } from "sonner";
import { EditorImportModal } from '@/components/EditorImportModal';

const initialDocument: EditorDocument = {
    title: 'DOCUMENTO PERSONALIZADO',
    date: new Date().toLocaleDateString('pt-BR'),
    clientName: 'Cliente Não Informado',
    blocks: [
        {
            id: '1',
            type: 'text',
            content: 'Digite seu texto aqui...',
            style: 'p',
            align: 'left',
            bold: false
        }
    ]
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function EditorPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [doc, setDoc] = useState<EditorDocument>(initialDocument);
    const [generating, setGenerating] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Import State
    const [reports, setReports] = useState<any[]>([]);
    const [showImportModal, setShowImportModal] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) router.push('/sign-in');
    }, [user, authLoading, router]);

    // Update block
    const updateBlock = (id: string, newBlock: EditorBlock) => {
        setDoc(prev => ({
            ...prev,
            blocks: prev.blocks.map(b => b.id === id ? newBlock : b)
        }));
    };

    // Remove block
    const removeBlock = (id: string) => {
        setDoc(prev => ({
            ...prev,
            blocks: prev.blocks.filter(b => b.id !== id)
        }));
    };

    // Move block
    const moveBlock = (index: number, direction: -1 | 1) => {
        if (index + direction < 0 || index + direction >= doc.blocks.length) return;
        setDoc(prev => {
            const newBlocks = [...prev.blocks];
            const temp = newBlocks[index];
            newBlocks[index] = newBlocks[index + direction];
            newBlocks[index + direction] = temp;
            return { ...prev, blocks: newBlocks };
        });
    };

    // Add block
    const addBlock = (type: EditorBlock['type']) => {
        const id = generateId();
        let newBlock: EditorBlock;
        if (type === 'text') {
            newBlock = { id, type: 'text', content: 'Novo texto...', style: 'p', align: 'left', bold: false } as TextBlock;
        } else if (type === 'image') {
            newBlock = { id, type: 'image', src: '', width: 50, align: 'center' } as ImageBlock;
        } else if (type === 'table') {
            newBlock = {
                id,
                type: 'table',
                headers: ['QTND', 'DESCRIÇÃO', 'IMAGEM', 'VALOR UND', 'SUB TOTAL'],
                rows: Array.from({ length: 5 }, () => ['', '', '', '', '']),
                columnWidths: [6, 44, 18, 16, 16]
            } as TableBlock;
        } else if (type === 'section') {
            newBlock = { id, type: 'section', title: 'NOVA SESSÃO...' } as SectionBlock;
        } else if (type === 'section_total') {
            newBlock = { id, type: 'section_total', label: 'Total da Seção:', value: 'R$ 0,00' } as SectionTotalBlock;
        } else if (type === 'general_total') {
            newBlock = {
                id, type: 'general_total',
                items: [
                    { label: 'V. Produtos :', value: 'R$ 0,00' },
                    { label: 'Taxa de Entrega :', value: 'R$ 0,00' },
                    { label: 'V. Descontos :', value: 'R$ 0,00' },
                    { label: 'V. Total :', value: 'R$ 0,00' }
                ]
            } as GeneralTotalBlock;
        } else {
            newBlock = { id, type: 'spacer', height: 20 } as SpacerBlock;
        }
        setDoc(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    };

    // Handle pasting image anywhere or in cell
    useEffect(() => {
        const handleGlobalPaste = (e: ClipboardEvent) => {
            const activeEl = document.activeElement;
            // If we are currently typing in a textarea, let it handle its own paste, or we can hijack if it's an image.
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (!file) continue;
                    e.preventDefault(); // Prevent default if it's an image and we are handling it
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string;

                        // Check if we are inside a table cell (via dataset custom attribute)
                        if (activeEl && activeEl.hasAttribute('data-cell-id')) {
                            const [blockId, rIdxStr, cIdxStr] = activeEl.getAttribute('data-cell-id')!.split('-');
                            setDoc(prev => {
                                const newBlocks = prev.blocks.map(b => {
                                    if (b.id === blockId && b.type === 'table') {
                                        const rIdx = parseInt(rIdxStr);
                                        const cIdx = parseInt(cIdxStr);
                                        const newRows = [...b.rows];
                                        newRows[rIdx] = [...newRows[rIdx]];
                                        newRows[rIdx][cIdx] = base64; // Store base64 in the cell
                                        return { ...b, rows: newRows };
                                    }
                                    return b;
                                });
                                return { ...prev, blocks: newBlocks };
                            });
                            toast.success("Imagem colada na tabela!");
                        } else {
                            // Global paste as new block
                            const id = generateId();
                            const newBlock: ImageBlock = { id, type: 'image', src: base64, width: 50, align: 'center' };
                            setDoc(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
                            toast.success("Imagem colada com sucesso!");
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
        };

        document.addEventListener('paste', handleGlobalPaste);
        return () => document.removeEventListener('paste', handleGlobalPaste);
    }, []);

    const handleGeneratePDF = async (download: boolean = false) => {
        try {
            setGenerating(true);
            const pdfDoc = <CustomPDFDocument documentData={doc} />;
            const blob = await pdf(pdfDoc).toBlob();
            const url = URL.createObjectURL(blob);

            if (download) {
                const link = document.createElement('a');
                link.href = url;
                link.download = `Documento_${doc.clientName.replace(/\s+/g, '_')}.pdf`;
                link.click();
                URL.revokeObjectURL(url);
            } else {
                setPreviewUrl(url);
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro ao gerar PDF");
        } finally {
            setGenerating(false);
        }
    };

    if (authLoading || !user) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-12 px-1 md:px-8 font-sans">
            <div className='px-28'>
                <PageHeader
                    onClear={() => setDoc(initialDocument)}
                    title="Editor Livre de Orçamento"
                    subtitle="Crie PDFs com formatação customizada e imagens através de blocos"
                />
            </div>

            <div className="flex justify-center mx-auto items-start relative px-4 w-full mt-8">

                {/* TOOLBAR SIDEBAR - Left Side */}
                <div className="sticky top-24 mr-6 w-[180px] hidden lg:flex flex-col gap-4 flex-shrink-0">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Adicionar Bloco</h3>
                        <div className="flex flex-col gap-2">
                            <button onClick={() => addBlock('text')} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-transparent hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 rounded-xl text-xs font-semibold text-gray-600 transition-all group">
                                <Type size={14} className="text-blue-500 group-hover:scale-110 transition-transform" /> Texto
                            </button>
                            <button onClick={() => addBlock('table')} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-transparent hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 rounded-xl text-xs font-semibold text-gray-600 transition-all group">
                                <TableIcon size={14} className="text-purple-500 group-hover:scale-110 transition-transform" /> Tabela
                            </button>
                            <button onClick={() => addBlock('section')} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-transparent hover:border-green-200 hover:bg-green-50 hover:text-green-700 rounded-xl text-xs font-semibold text-gray-600 transition-all group">
                                <Heading size={14} className="text-green-500 group-hover:scale-110 transition-transform" /> Sessão
                            </button>
                            <button onClick={() => addBlock('section_total')} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-transparent hover:border-gray-300 hover:bg-gray-200 hover:text-gray-800 rounded-xl text-xs font-semibold text-gray-600 transition-all group">
                                <Sigma size={14} className="text-gray-500 group-hover:scale-110 transition-transform" /> Total Seção
                            </button>
                            <button onClick={() => addBlock('general_total')} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-transparent hover:border-blue-300 hover:bg-blue-100 hover:text-blue-800 rounded-xl text-xs font-semibold text-gray-600 transition-all group">
                                <Receipt size={14} className="text-blue-500 group-hover:scale-110 transition-transform" /> Total Geral
                            </button>
                            <button onClick={() => addBlock('image')} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-transparent hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 rounded-xl text-xs font-semibold text-gray-600 transition-all group">
                                <ImageIcon size={14} className="text-orange-500 group-hover:scale-110 transition-transform" /> Imagem
                            </button>
                            <button onClick={() => addBlock('spacer')} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 border border-transparent hover:border-gray-300 hover:bg-gray-100 hover:text-gray-900 rounded-xl text-xs font-semibold text-gray-600 transition-all group">
                                <AlignLeft size={14} className="text-gray-500 group-hover:scale-110 transition-transform" /> Espaço
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-gray-900 border border-gray-800 text-white w-full px-4 py-3 rounded-2xl text-[11px] font-bold hover:bg-black transition-all shadow-md flex flex-col items-center gap-1.5 group"
                    >
                        <Layers size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                        Importar Histórico
                    </button>
                </div>

                {/* A4 PAPER WYSIWYG CONTAINER (Centered) */}
                <div className="w-full max-w-[800px] flex-shrink-0 min-h-[1131px] bg-white shadow-2xl relative px-10 pt-8 pb-24 font-sans text-xs border border-gray-200">
                    {/* PDF HEADER */}
                    <div className="flex justify-between items-start mb-2">
                        <img src="/logo.png" alt="Girardi Logo" className="w-[260px] object-contain" />
                        <div className="text-[11px] text-right leading-relaxed mt-1 text-gray-600 font-medium">
                            <div>Av. Nereu Ramos, 138 E - Centro</div>
                            <div>Chapecó - SC, 89814-247</div>
                            <div>CNPJ: 83.298.349/0001-89 - Inscr. Estadual: 250168162</div>
                            <div>E-mail: girardicentro.drive@gmail.com</div>
                            <div>Contato: (49) 3322-2509</div>
                        </div>
                    </div>

                    <div className="flex justify-center my-3">
                        <img src="/extracted/text.png" alt="Subtitle" className="h-[30px] object-contain" />
                    </div>

                    <div className="w-full h-[1px] bg-gray-300 mb-2"></div>

                    <div className="bg-[#f2f2f2] px-2 py-1.5 mb-2 mt-2 group relative">
                        <input
                            value={doc.title}
                            onChange={e => setDoc({ ...doc, title: e.target.value })}
                            className="w-full bg-transparent text-[11px] text-black outline-none font-bold uppercase"
                            placeholder="Título do Orçamento..."
                        />
                    </div>

                    <div className="mb-4">
                        <div className="flex items-center gap-1 mb-1">
                            <span className="font-bold text-[11px] text-black">Cliente:</span>
                            <input
                                value={doc.clientName}
                                onChange={e => setDoc({ ...doc, clientName: e.target.value })}
                                className="bg-transparent text-[11px] text-black outline-none border-b border-transparent hover:border-gray-300 focus:border-gray-800 flex-1"
                                placeholder="Nome do Cliente"
                            />
                        </div>
                    </div>

                    {/* BLOCKS LIST */}
                    <div className="space-y-1">
                        {doc.blocks.length === 0 && (
                            <div className="py-12 border border-dashed border-gray-200 text-center text-gray-400 text-sm">
                                Página em branco. Adicione blocos abaixo.
                            </div>
                        )}
                        {doc.blocks.map((block, i) => (
                            <div key={block.id} className="group relative transition-all border border-transparent hover:border-blue-100 hover:bg-blue-50/20 -mx-4 px-4 py-1">
                                <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => moveBlock(i, -1)} className="p-1 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-black shadow-sm"><MoveUp size={12} /></button>
                                    <button onClick={() => moveBlock(i, 1)} className="p-1 bg-white border border-gray-200 rounded-full text-gray-400 hover:text-black shadow-sm"><MoveDown size={12} /></button>
                                    <button onClick={() => removeBlock(block.id)} className="p-1.5 mt-1 bg-red-50 text-red-500 rounded-full hover:bg-red-100 shadow-sm"><Trash2 size={12} /></button>
                                </div>

                                <div className="w-full relative">
                                    {/* TEXT BLOCK */}
                                    {block.type === 'text' && (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <select
                                                    value={block.style}
                                                    onChange={e => updateBlock(block.id, { ...block, style: e.target.value as any })}
                                                    className="text-xs border border-gray-200 rounded p-1"
                                                >
                                                    <option value="h1">Título Grande</option>
                                                    <option value="h2">Título Médio</option>
                                                    <option value="p">Parágrafo Padrão</option>
                                                    <option value="small">Texto Pequeno</option>
                                                </select>
                                                <select
                                                    value={block.align}
                                                    onChange={e => updateBlock(block.id, { ...block, align: e.target.value as any })}
                                                    className="text-xs border border-gray-200 rounded p-1"
                                                >
                                                    <option value="left">Esquerda</option>
                                                    <option value="center">Centro</option>
                                                    <option value="right">Direita</option>
                                                    <option value="justify">Justificado</option>
                                                </select>
                                                <button
                                                    onClick={() => updateBlock(block.id, { ...block, bold: !block.bold })}
                                                    className={`px-2 py-1 text-xs rounded border ${block.bold ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}
                                                >
                                                    Negrito
                                                </button>
                                            </div>
                                            <textarea
                                                value={block.content}
                                                onChange={e => updateBlock(block.id, { ...block, content: e.target.value })}
                                                className={`w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 outline-none resize-y min-h-[100px] ${block.style === 'h1' ? 'text-2xl font-bold' :
                                                    block.style === 'h2' ? 'text-lg font-bold' :
                                                        block.style === 'small' ? 'text-xs' : 'text-sm'
                                                    } ${block.bold ? 'font-bold' : ''}`}
                                                style={{ textAlign: block.align }}
                                                placeholder="Digite aqui..."
                                            />
                                        </div>
                                    )}

                                    {/* IMAGE BLOCK */}
                                    {block.type === 'image' && (
                                        <div className="space-y-3">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                <select
                                                    value={block.align}
                                                    onChange={e => updateBlock(block.id, { ...block, align: e.target.value as any })}
                                                    className="text-xs border border-gray-200 rounded p-1"
                                                >
                                                    <option value="left">Esquerda</option>
                                                    <option value="center">Centro</option>
                                                    <option value="right">Direita</option>
                                                </select>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">Largura %</span>
                                                    <input
                                                        type="number" min="10" max="100"
                                                        value={block.width}
                                                        onChange={e => updateBlock(block.id, { ...block, width: Number(e.target.value) })}
                                                        className="text-xs border border-gray-200 rounded p-1 w-16"
                                                    />
                                                </div>
                                            </div>
                                            <div className={`flex w-full ${block.align === 'center' ? 'justify-center' : block.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                                                {block.src ? (
                                                    <img src={block.src} style={{ width: `${block.width}%` }} className="border border-gray-200 rounded object-contain max-h-[300px]" alt="Colada" />
                                                ) : (
                                                    <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-300 rounded">
                                                        Dê CTRL+V aqui ou ao vivo na página para colar a imagem
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* TABLE BLOCK */}
                                    {block.type === 'table' && (
                                        <div className="space-y-4">
                                            <div className="w-full mt-1">
                                                <div className="flex items-center gap-2 float-right opacity-0 group-hover:opacity-100 transition-opacity mb-2">
                                                    <button
                                                        onClick={() => {
                                                            const newRows = [...block.rows, Array(block.headers.length).fill('')];
                                                            updateBlock(block.id, { ...block, rows: newRows });
                                                        }}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        + Linha
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const newHeaders = [...block.headers, ''];
                                                            const newRows = block.rows.map(r => [...r, '']);
                                                            updateBlock(block.id, { ...block, headers: newHeaders, rows: newRows });
                                                        }}
                                                        className="text-xs text-blue-600 hover:underline"
                                                    >
                                                        + Coluna
                                                    </button>
                                                </div>
                                                <table className="w-full text-[10px] text-left font-sans border-t-[0.5px] border-black border-b-[0.5px]">
                                                    <thead className="bg-[#f2f2f2] text-black font-bold uppercase">
                                                        <tr>
                                                            {block.headers.map((h, hidx) => (
                                                                <th key={hidx} className="px-1 py-1.5 border-r border-transparent hover:border-gray-300 last:border-r-0" style={{ width: block.columnWidths ? `${block.columnWidths[hidx]}%` : 'auto', textAlign: 'center' }}>
                                                                    <textarea
                                                                        value={h}
                                                                        onChange={e => {
                                                                            const newH = [...block.headers];
                                                                            newH[hidx] = e.target.value;
                                                                            updateBlock(block.id, { ...block, headers: newH });
                                                                        }}
                                                                        className="bg-transparent outline-none w-full resize-none h-4 overflow-hidden text-center focus:bg-white"
                                                                    />
                                                                </th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-[#f2f2f2]">
                                                        {block.rows.map((r, ridx) => (
                                                            <tr key={ridx} className="group/row hover:bg-[#f9f9f9]">
                                                                {r.map((c, cidx) => {
                                                                    const isImage = c.startsWith('data:image/') || c.startsWith('http') || c.startsWith('/api/');
                                                                    return (
                                                                        <td key={cidx} className="px-1 py-2 text-center align-middle relative" style={{ width: block.columnWidths ? `${block.columnWidths[cidx]}%` : 'auto' }}>
                                                                            {isImage ? (
                                                                                <div className="relative group/img flex justify-center">
                                                                                    <img src={c} alt="Colada" className="w-16 h-16 object-contain border border-gray-200" />
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newR = [...block.rows];
                                                                                            newR[ridx] = [...newR[ridx]];
                                                                                            newR[ridx][cidx] = '';
                                                                                            updateBlock(block.id, { ...block, rows: newR });
                                                                                        }}
                                                                                        className="absolute top-0 right-0 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover/img:opacity-100"
                                                                                    >
                                                                                        <X size={10} />
                                                                                    </button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="relative w-full h-full min-h-[40px] flex items-center justify-center">
                                                                                    {block.headers[cidx]?.toUpperCase() === 'IMAGEM' && !c && (
                                                                                        <div className="absolute inset-2 border border-dashed border-gray-300 rounded flex items-center justify-center pointer-events-none">
                                                                                            <span className="text-[9px] text-gray-400 font-bold uppercase">CTRL+V</span>
                                                                                        </div>
                                                                                    )}
                                                                                    <textarea
                                                                                        data-cell-id={`${block.id}-${ridx}-${cidx}`}
                                                                                        value={c}
                                                                                        onChange={e => {
                                                                                            const newR = [...block.rows];
                                                                                            newR[ridx] = [...newR[ridx]];
                                                                                            newR[ridx][cidx] = e.target.value;
                                                                                            updateBlock(block.id, { ...block, rows: newR });
                                                                                        }}
                                                                                        className="absolute inset-0 w-full text-center outline-none bg-transparent resize-none h-full focus:bg-white focus:ring-1 focus:ring-blue-100 z-10"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            {cidx === r.length - 1 && (
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newR = block.rows.filter((_, i) => i !== ridx);
                                                                                        updateBlock(block.id, { ...block, rows: newR });
                                                                                    }}
                                                                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity"
                                                                                >
                                                                                    <Trash2 size={12} />
                                                                                </button>
                                                                            )}
                                                                        </td>
                                                                    )
                                                                })}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* SECTION BLOCK */}
                                    {block.type === 'section' && (
                                        <div className="bg-[#f2f2f2] px-2 py-1.5 mt-2 group relative border border-transparent hover:border-green-200 transition-colors">
                                            <input
                                                value={(block as SectionBlock).title}
                                                onChange={e => updateBlock(block.id, { ...block, title: e.target.value })}
                                                className="w-full bg-transparent text-[11px] text-center text-black outline-none font-bold uppercase transition focus:bg-white"
                                            />
                                        </div>
                                    )}

                                    {/* SECTION TOTAL BLOCK */}
                                    {block.type === 'section_total' && (
                                        <div className="flex justify-end items-center gap-2 bg-[#d4d4d4] px-4 py-1.5 mt-2 border-t border-[#999999] group relative">
                                            <input
                                                value={(block as SectionTotalBlock).label}
                                                onChange={e => updateBlock(block.id, { ...block, label: e.target.value })}
                                                className="bg-transparent text-[11px] text-right text-black font-bold outline-none focus:bg-white focus:ring-1 focus:ring-blue-100"
                                            />
                                            <input
                                                value={(block as SectionTotalBlock).value}
                                                onChange={e => updateBlock(block.id, { ...block, value: e.target.value })}
                                                className="bg-transparent text-[11px] text-left text-black font-bold outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 w-24"
                                            />
                                        </div>
                                    )}

                                    {/* GENERAL TOTAL BLOCK */}
                                    {block.type === 'general_total' && (
                                        <div className="flex flex-col items-end gap-1.5 bg-[#f2f2f2] px-4 py-3 mt-4 group relative">
                                            {(block as GeneralTotalBlock).items.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 group/item relative">
                                                    <input
                                                        value={item.label}
                                                        onChange={e => {
                                                            const newItems = [...(block as GeneralTotalBlock).items];
                                                            newItems[idx].label = e.target.value;
                                                            updateBlock(block.id, { ...block, items: newItems });
                                                        }}
                                                        className="bg-transparent text-[10px] uppercase font-bold text-right text-black outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 w-36"
                                                    />
                                                    <input
                                                        value={item.value}
                                                        onChange={e => {
                                                            const newItems = [...(block as GeneralTotalBlock).items];
                                                            newItems[idx].value = e.target.value;
                                                            updateBlock(block.id, { ...block, items: newItems });
                                                        }}
                                                        className="bg-transparent text-[11px] font-bold text-right text-black outline-none focus:bg-white focus:ring-1 focus:ring-blue-100 w-24"
                                                    />
                                                    <button onClick={() => {
                                                        const newItems = (block as GeneralTotalBlock).items.filter((_, i) => i !== idx);
                                                        updateBlock(block.id, { ...block, items: newItems });
                                                    }} className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 text-red-500">
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button onClick={() => {
                                                updateBlock(block.id, { ...block, items: [...(block as GeneralTotalBlock).items, { label: 'NOVO CAMPO :', value: 'R$ 0,00' }] });
                                            }} className="opacity-0 group-hover:opacity-100 text-[10px] text-gray-500 hover:text-gray-800 flex items-center gap-1 mt-2">
                                                <PlusSquare size={12} /> Adicionar Linha
                                            </button>
                                        </div>
                                    )}

                                    {/* SPACER BLOCK */}
                                    {block.type === 'spacer' && (
                                        <div className="flex items-center gap-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                            <div className="w-full border-t border-dashed border-gray-300 relative flex justify-center">
                                                <div className="absolute -top-3 bg-white px-2 flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-gray-400">ESPAÇO</span>
                                                    <input
                                                        type="number"
                                                        value={block.height}
                                                        onChange={e => updateBlock(block.id, { ...block, height: Number(e.target.value) })}
                                                        className="w-12 text-center border-b border-gray-300 outline-none text-[10px]"
                                                    />
                                                    <span className="text-[10px] text-gray-500">px</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* PAYMENT TERMS STATIC */}
                    <div className="bg-[#efede7] py-2 flex flex-col items-center justify-center mt-6 w-full -mx-4 px-4 shadow-sm border border-gray-200/50">
                        <span className="text-[10px] font-bold text-[#333333] mb-1 text-center">*condição de pagamento à prazo em até 10x sem juros no cartão</span>
                        <span className="text-[10px] font-bold text-[#333333] text-center">*Sujeito à alterações de disponibilidade de estoque</span>
                    </div>

                    {/* PDF FOOTER ON PAPER */}
                    <div className="absolute bottom-6 left-10 right-10 flex justify-between items-end text-[10px] font-bold border-t-[0.5px] border-gray-400 pt-1">
                        <div className="w-[30%] uppercase">Cliente</div>
                        <div className="flex-1 text-center font-normal">{doc.date}</div>
                        <div className="w-[30%] uppercase text-right">Consultor de Vendas</div>
                    </div>
                </div>

                {/* RIGHT SPACER FOR PERFECT CENTERING */}
                <div className="w-[180px] ml-6 flex-shrink-0 hidden lg:block" />

            </div>

            {/* ACTION FLOATER */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white p-2 rounded-2xl shadow-xl border border-gray-200 z-40">
                <button
                    onClick={() => handleGeneratePDF(false)}
                    disabled={generating}
                    className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors min-w-[140px] justify-center"
                >
                    {generating ? 'Processando...' : <><FileDown size={20} /> Pré-Visualizar</>}
                </button>
                <button
                    onClick={() => handleGeneratePDF(true)}
                    disabled={generating}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <Download size={20} /> Baixar PDF
                </button>
            </div>

            {/* PREVIEW MODAL */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 bg-black/90 flex flex-col animate-in fade-in duration-300">
                    <div className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white border-b border-gray-800">
                        <h2 className="text-lg font-bold">Visualização do Documento</h2>
                        <button
                            onClick={() => {
                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                setPreviewUrl(null);
                            }}
                            className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-gray-600 transition-colors"
                        >
                            Fechar Preview
                        </button>
                    </div>
                    <div className="flex-1 w-full p-2 md:p-8 overflow-hidden flex justify-center items-center">
                        <iframe src={previewUrl || undefined} className="w-full h-full max-w-5xl rounded-xl bg-white shadow-2xl" />
                    </div>
                </div>
            )}

            {showImportModal && (
                <EditorImportModal
                    onClose={() => setShowImportModal(false)}
                    onImport={(importedDoc) => {
                        setDoc(importedDoc);
                        setShowImportModal(false);
                        toast.success("Relatório importado com sucesso!");
                    }}
                />
            )}
        </div>
    );
}
