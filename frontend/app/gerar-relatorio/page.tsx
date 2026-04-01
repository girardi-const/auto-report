'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import ReportForm from "../../components/ReportForm";
import { toast } from "sonner";

export default function GerarRelatorio() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/sign-in');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-gray-500">Carregando...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-muted flex flex-col pt-4 px-4 md:px-0">
            <div className="container mx-auto">
                <ReportForm
                    onSaveSuccess={() => toast.success("Relatório salvo com sucesso")}
                    onSaveError={() => toast.error("Erro ao salvar relatório")}
                />
            </div>
        </div>
    );
}
