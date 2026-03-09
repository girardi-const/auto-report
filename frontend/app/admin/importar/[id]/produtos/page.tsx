'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useImports, ImportDoc } from '@/hooks/useImports';
import { Loader2, ArrowLeft, Database, Search, PackageCheck } from 'lucide-react';
import Link from 'next/link';

export default function ImportProductsPage() {
    const { id } = useParams() as { id: string };
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { getImportById, getImportBackups, loading } = useImports();

    const [importDoc, setImportDoc] = useState<ImportDoc | null>(null);
    const [backups, setBackups] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    useEffect(() => {
        if (isAdmin && id) {
            getImportById(id).then(doc => {
                if (doc) setImportDoc(doc);
            });
            getImportBackups(id).then(data => {
                setBackups(data);
            });
        }
    }, [id, isAdmin, getImportById, getImportBackups]);

    const filteredBackups = backups.filter(b => {
        if (!searchTerm) return true;

        // Simple search heuristic logic since backup format is somewhat dynamic
        const searchLower = searchTerm.toLowerCase();
        const actionStr = b.action.toLowerCase();

        // Product code would usually be in snapshot or product ID
        return actionStr.includes(searchLower) || b.productId.toString().includes(searchLower);
    });

    if (authLoading || !isAdmin || loading && !importDoc) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/importar" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
                        <Database className="text-primary" />
                        Produtos Afetados
                    </h1>
                    {importDoc && (
                        <p className="text-gray-500 text-sm mt-1">
                            Visualizando histórico da importação: <span className="font-semibold">{importDoc.filename}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {/* Status pills based on the original summary */}
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Criados: {importDoc?.summary?.created || 0}</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Atualizados: {importDoc?.summary?.updated || 0}</span>
                        </div>
                    </div>

                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por ID ou Ação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 text-sm"
                        />
                    </div>
                </div>

                {filteredBackups.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center justify-center">
                        <PackageCheck className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium">Nenhum produto foi criado ou atualizado nesta importação.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 uppercase tracking-widest text-xs border-b border-gray-100">
                                    <th className="px-6 py-4 font-semibold">Ação</th>
                                    <th className="px-6 py-4 font-semibold">ID do Produto</th>
                                    <th className="px-6 py-4 font-semibold">Data da Ação</th>
                                    <th className="px-6 py-4 font-semibold">Status do Rollback</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-gray-700">
                                {filteredBackups.map(backup => (
                                    <tr key={backup._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            {backup.action === 'created' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700">
                                                    CRIAÇÃO
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700">
                                                    ATUALIZAÇÃO
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs">{backup.productId}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(backup.createdAt).toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4">
                                            {backup.restoredAt ? (
                                                <span className="text-red-500 font-medium text-xs">Revertido em {new Date(backup.restoredAt).toLocaleDateString('pt-BR')}</span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Ativo</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
