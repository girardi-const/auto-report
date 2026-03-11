'use client';

import { useEffect, useState, FormEvent, useRef, ChangeEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useImports, ImportDoc } from '@/hooks/useImports';
import { useBrands } from '@/hooks/useBrands';
import { toast } from 'sonner';
import { Loader2, UploadCloud, FileText, Trash2, AlertTriangle, ExternalLink, Activity } from 'lucide-react';
import Link from 'next/link';
import UnderCon from '@/components/UnderCon';

export default function ImportPage() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const [underCon, setUnderCon] = useState(false);
    const router = useRouter();

    const {
        importsData,
        loading: importsLoading,
        error: importsError,
        fetchImports,
        uploadImport,
        getImportById,
        deleteImport
    } = useImports();

    const { brands, loading: brandsLoading } = useBrands();

    // Form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Polling state
    const [pollingImportId, setPollingImportId] = useState<string | null>(null);

    // Delete Modal state
    const [deleteModalImport, setDeleteModalImport] = useState<ImportDoc | null>(null);
    const [deleteMode, setDeleteMode] = useState<'full' | 'file-only'>('file-only');
    const [isDeleting, setIsDeleting] = useState(false);

    // Guard: Admin only
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    // Initial fetch
    useEffect(() => {
        if (isAdmin) {
            fetchImports(1, 20, false);
        }
    }, [isAdmin, fetchImports]);

    // Polling Logic
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pollingImportId) {
            interval = setInterval(async () => {
                const updatedImport = await getImportById(pollingImportId);
                if (updatedImport) {
                    if (updatedImport.status === 'done' || updatedImport.status === 'failed') {
                        clearInterval(interval);
                        setPollingImportId(null);
                        setSubmitting(false);

                        if (updatedImport.status === 'done') {
                            toast.success(`Importação finalizada! ${updatedImport.summary.created} criados, ${updatedImport.summary.updated} atualizados.`);
                        } else {
                            toast.error('Ocorreu um erro ao processar o arquivo.');
                        }
                        fetchImports();
                    }
                }
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [pollingImportId, getImportById, fetchImports]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/pdf'];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            const validExtensions = ['csv', 'xlsx', 'pdf'];

            if (validTypes.includes(file.type) || (fileExtension && validExtensions.includes(fileExtension))) {
                setSelectedFile(file);
            } else {
                toast.error('Formato de arquivo inválido. Apenas CSV, XLSX ou PDF.');
            }
        }
    };

    const handleFormSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedFile) {
            toast.error('Por favor, selecione um arquivo.');
            return;
        }
        if (!selectedBrand) {
            toast.error('Por favor, selecione a marca (brand) para a importação.');
            return;
        }

        setSubmitting(true);
        const createdImport = await uploadImport(selectedFile, selectedBrand);

        if (createdImport) {
            if (createdImport.status === 'processing') {
                setPollingImportId(createdImport._id);
                setSelectedFile(null);
                setSelectedBrand('');
                if (fileInputRef.current) fileInputRef.current.value = '';
                toast.success('Arquivo enviado com sucesso. Processamento iniciado...');
            } else {
                setSubmitting(false);
                toast.error('Erro desconhecido ao iniciar a importação.');
            }
        } else {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteModalImport) return;
        setIsDeleting(true);
        const ok = await deleteImport(deleteModalImport._id, deleteMode);
        if (ok) {
            toast.success('Importação apagada com sucesso.');
            setDeleteModalImport(null);
            fetchImports();
        } else {
            toast.error(importsError || 'Erro ao apagar importação.');
        }
        setIsDeleting(false);
    };

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-10 space-y-8 relative">
            {underCon ? (
                <UnderCon />
            ) : (
                <>
                    {/* Title */}
                    <div>
                        <h1 className="text-2xl font-bold text-secondary">Importador de Produtos</h1>
                        <p className="text-gray-500 text-sm mt-1">
                            Faça upload de planilhas e PDFs para cadastrar ou atualizar múltiplos produtos simultaneamente.
                        </p>
                    </div>

                    {/* Error Message */}
                    {importsError && (
                        <div className="bg-red-50 border-l-4 border-primary text-red-800 px-4 py-3 rounded-md text-sm font-medium">
                            {importsError}
                        </div>
                    )}

                    {/* Processing Overlay */}
                    {pollingImportId && (
                        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center border border-gray-100 rounded-3xl shadow-xl min-h-[400px]">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-primary/20 rounded-full animate-spin border-t-primary ease-in-out"></div>
                                <UploadCloud className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <h2 className="mt-8 text-xl font-bold text-gray-800 tracking-tight">Processando importação...</h2>
                            <p className="mt-2 text-gray-500 text-sm font-medium animate-pulse">
                                Por favor, não feche ou saia desta página
                            </p>
                        </div>
                    )}

                    {/* Import Form Section */}
                    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 p-8 ${pollingImportId ? 'opacity-50 pointer-events-none' : ''}`}>
                        <h2 className="text-sm font-bold text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Activity size={16} />
                            Nova Importação
                        </h2>

                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            {/* Brand Selector */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">Marca (Brand)</label>
                                <select
                                    value={selectedBrand}
                                    onChange={(e) => setSelectedBrand(e.target.value)}
                                    disabled={submitting || brandsLoading}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 text-sm"
                                    required
                                >
                                    <option value="" disabled>Selecione uma marca...</option>
                                    {brands.map(b => (
                                        <option key={b._id} value={b._id}>{b.brand_name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Drag and Drop Zone */}
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer 
              ${selectedFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary hover:bg-red-50/30 bg-gray-50'}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".csv, .xlsx, .pdf"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                {selectedFile ? (
                                    <>
                                        <FileText className="w-12 h-12 text-green-500 mb-3" />
                                        <p className="text-sm font-bold text-green-700">{selectedFile.name}</p>
                                        <p className="text-xs text-green-600/80 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-12 h-12 text-gray-400 mb-3" />
                                        <p className="text-sm font-medium text-gray-600">
                                            Arraste e solte o arquivo aqui, ou <span className="text-primary font-bold">clique para buscar</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-2">Suporta .csv, .xlsx, e .pdf</p>
                                    </>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting || !selectedFile || !selectedBrand}
                                    className="px-8 py-3 bg-primary hover:bg-[#c91e25] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest whitespace-nowrap flex items-center gap-2"
                                >
                                    {submitting || pollingImportId ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud size={16} />
                                            Iniciar Importação
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Past Imports Section */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h2 className="text-sm font-bold text-secondary uppercase tracking-widest flex items-center gap-2">
                                <FileText size={16} />
                                Histórico de Importações
                            </h2>
                            <button
                                onClick={() => fetchImports()}
                                className="text-xs font-bold text-gray-500 hover:text-primary transition-colors cursor-pointer"
                            >
                                ATUALIZAR
                            </button>
                        </div>

                        {importsLoading && !importsData ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                            </div>
                        ) : importsData?.imports.length === 0 ? (
                            <p className="text-center text-gray-400 py-12 text-sm font-medium">Nenhuma importação encontrada.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider bg-white">
                                            <th className="px-6 py-4 font-semibold">Arquivo</th>
                                            <th className="px-6 py-4 font-semibold">Marca</th>
                                            <th className="px-6 py-4 font-semibold">Data</th>
                                            <th className="px-6 py-4 font-semibold">Status</th>
                                            <th className="px-6 py-4 font-semibold">Resumo</th>
                                            <th className="px-6 py-4 font-semibold text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 text-sm">
                                        {importsData?.imports.map((imp) => (
                                            <tr key={imp._id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <p className="font-medium text-gray-800">{imp.filename}</p>
                                                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">{imp.fileType}</p>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                                                    {imp.brandId?.brand_name || 'Desconhecida'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                    {new Date(imp.createdAt).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {imp.status === 'done' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                            Concluído
                                                        </span>
                                                    ) : imp.status === 'failed' ? (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                                            <AlertTriangle size={12} />
                                                            Falhou
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                                            <Loader2 size={12} className="animate-spin" />
                                                            Processando
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {imp.status === 'done' && imp.summary ? (
                                                        <div className="flex items-center gap-3 text-xs">
                                                            <span className="text-green-600 font-bold" title="Criados">+{imp.summary.created}</span>
                                                            <span className="text-blue-600 font-bold" title="Atualizados">~{imp.summary.updated}</span>
                                                            {imp.summary.failed > 0 && <span className="text-red-500 font-bold" title="Falhas">!{imp.summary.failed}</span>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link
                                                            href={`/admin/importar/${imp._id}/produtos`}
                                                            className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="Ver produtos gerados/afetados"
                                                        >
                                                            <ExternalLink size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteModalImport(imp)}
                                                            className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                            title="Apagar arquivo"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Delete Modal */}
                    {deleteModalImport && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-6">
                                    <div className="flex items-center gap-3 text-red-600 mb-4">
                                        <div className="p-3 bg-red-50 rounded-2xl">
                                            <Trash2 size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold">Apagar Importação</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-6">
                                        Você está prestes a apagar o registro da importação <strong>{deleteModalImport.filename}</strong>. Selecione uma opção abaixo. Tem certeza? Esta ação não pode ser desfeita.
                                    </p>

                                    <div className="space-y-3 mb-8">
                                        <label className={`flex gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${deleteMode === 'file-only' ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-gray-200'}`}>
                                            <input
                                                type="radio"
                                                name="deleteMode"
                                                value="file-only"
                                                checked={deleteMode === 'file-only'}
                                                onChange={(e) => setDeleteMode(e.target.value as 'file-only')}
                                                className="mt-0.5 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">Apagar apenas o arquivo</p>
                                                <p className="text-xs text-gray-500 mt-1">Remove do histórico, mas mantém os produtos criados e atualizados intactos.</p>
                                            </div>
                                        </label>

                                        <label className={`flex gap-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors ${deleteMode === 'full' ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-gray-200'}`}>
                                            <input
                                                type="radio"
                                                name="deleteMode"
                                                value="full"
                                                checked={deleteMode === 'full'}
                                                onChange={(e) => setDeleteMode(e.target.value as 'full')}
                                                className="mt-0.5 text-primary focus:ring-primary"
                                            />
                                            <div>
                                                <p className="text-sm font-bold text-red-600">Apagar o arquivo e suas mudanças</p>
                                                <p className="text-xs text-gray-500 mt-1">Desfaz as alterações: exclui os produtos criados por essa importação e reverte produtos atualizados.</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setDeleteModalImport(null)}
                                            disabled={isDeleting}
                                            className="flex-1 px-4 py-3 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={confirmDelete}
                                            disabled={isDeleting}
                                            className="flex-1 px-4 py-3 text-sm font-bold text-white bg-red-500 border border-red-500 rounded-xl hover:bg-red-600 shadow-md shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
