import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useReportActions } from '../../hooks/useReportActions';

interface DeleteModalProps {
    reportId: string;
    reportTitle: string;
    onClose: () => void;
    onDeleted: () => void;
    handleDeleteExternally?: () => Promise<void>;
    externalDeleting?: boolean;
}

export function DeleteModal({
    reportId,
    reportTitle,
    onClose,
    onDeleted,
    handleDeleteExternally,
    externalDeleting
}: DeleteModalProps) {
    const { deleteReport, deleting: internalDeleting } = useReportActions();
    const [error, setError] = useState('');

    const deleting = externalDeleting !== undefined ? externalDeleting : internalDeleting;

    const handleDelete = async () => {
        if (handleDeleteExternally) {
            await handleDeleteExternally();
            return;
        }

        setError('');
        try {
            await deleteReport(reportId);
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
                        <p className="text-sm text-gray-600 mt-1 font-medium">{reportTitle}</p>
                        <p className="text-xs text-gray-500 mt-1">Esta ação não pode ser desfeita.</p>
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
