import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ClientInfo, SavedReport } from '../types';

const API = process.env.NEXT_PUBLIC_API_URL;

interface ReportPayload {
    title: string;
    especificador?: string;
    consultor?: string;
    consultorPhone?: string;
    cash_discount?: number;
    client_info?: Partial<ClientInfo>;
    sections: {
        section_name: string;
        section_discount: number;
        products: {
            product_name: string;
            product_id: string;
            image_url?: string;
            price: number;
            margin: number;
            discount: number;
            quantity: number;
            type: string;
            total: number;
        }[];
    }[];
}

interface UseReportActionsReturn {
    saving: boolean;
    deleting: boolean;
    deletingMany: boolean;
    saveReport: (payload: ReportPayload) => Promise<SavedReport>;
    updateReport: (id: string, payload: Partial<ReportPayload>) => Promise<SavedReport>;
    deleteReport: (id: string) => Promise<void>;
    deleteManyReports: (ids: string[]) => Promise<void>;
}

export function useReportActions(): UseReportActionsReturn {
    const { getIdToken } = useAuth();
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingMany, setDeletingMany] = useState(false);

    const saveReport = async (payload: ReportPayload): Promise<SavedReport> => {
        setSaving(true);
        try {
            const token = await getIdToken();
            const res = await fetch(`${API}/reports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao salvar relatório');
            }

            const data = await res.json();
            return data.data as SavedReport;
        } finally {
            setSaving(false);
        }
    };

    const updateReport = async (
        id: string,
        payload: Partial<ReportPayload>
    ): Promise<SavedReport> => {
        setSaving(true);
        try {
            const token = await getIdToken();
            const res = await fetch(`${API}/reports/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao atualizar relatório');
            }

            const data = await res.json();
            return data.data as SavedReport;
        } finally {
            setSaving(false);
        }
    };

    const deleteReport = async (id: string): Promise<void> => {
        setDeleting(true);
        try {
            const token = await getIdToken();
            const res = await fetch(`${API}/reports/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao deletar relatório');
            }
        } finally {
            setDeleting(false);
        }
    };

    const deleteManyReports = async (ids: string[]): Promise<void> => {
        setDeletingMany(true);
        try {
            const token = await getIdToken();
            const res = await fetch(`${API}/reports/batch-delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ids }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao deletar relatórios');
            }
        } finally {
            setDeletingMany(false);
        }
    };

    return { saving, deleting, deletingMany, saveReport, updateReport, deleteReport, deleteManyReports };
}
