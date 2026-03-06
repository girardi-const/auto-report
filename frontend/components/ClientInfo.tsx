import { formatCEP, formatCNPJ, formatPhoneNumber } from "@/utils";
import { ClientInfo as ClientInfoType } from "../types";
import { useState, useRef } from "react";
import { formatInscricaoEstadual } from "@/utils/formatters";

interface ClientInfoProps {
    data: ClientInfoType;
    onChange: (field: keyof ClientInfoType, value: string) => void;
}

export const ClientInfo = ({ data, onChange }: ClientInfoProps) => {
    const [loadingCep, setLoadingCep] = useState(false);
    const cepTimerRef = useRef<NodeJS.Timeout | null>(null);


    // Fetch address data from CEP
    const fetchAddressFromCEP = async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');

        // Only fetch if CEP has 8 digits
        if (cleanCep.length !== 8) return;

        setLoadingCep(true);

        try {
            const response = await fetch(`/api/cep?cep=${cleanCep}`);

            if (!response.ok) {
                console.error('Failed to fetch CEP data');
                return;
            }

            const data = await response.json();

            // Update address fields with fetched data
            if (data.logradouro) onChange('endereco', data.logradouro);
            if (data.bairro) onChange('bairro', data.bairro);
            if (data.localidade) onChange('cidade', data.localidade);
            if (data.uf) onChange('uf', data.uf.toUpperCase());
        } catch (error) {
            console.error('Error fetching CEP:', error);
        } finally {
            setLoadingCep(false);
        }
    };

    const handlePhoneChange = (value: string) => {
        const formatted = formatPhoneNumber(value);
        onChange('telefone', formatted);
    };

    const handleCNPJChange = (value: string) => {
        const formatted = formatCNPJ(value);
        onChange('cnpj', formatted);
    };

    const handleCEPChange = (value: string) => {
        const formatted = formatCEP(value);
        onChange('cep', formatted);

        // Clear existing timer
        if (cepTimerRef.current) {
            clearTimeout(cepTimerRef.current);
        }

        // Debounce the API call
        cepTimerRef.current = setTimeout(() => {
            fetchAddressFromCEP(formatted);
        }, 500);
    };

    const handleInscricaoEstadualChange = (value: string) => {
        const formatted = formatInscricaoEstadual(value);
        onChange('inscricaoEstadual', formatted);
    };

    const fields = [
        { label: "Nome", value: data.name, key: "name" as keyof ClientInfoType, placeholder: "Nome do cliente", span: 2 },
        { label: "Telefone", value: data.telefone, key: "telefone" as keyof ClientInfoType, placeholder: "(00) 00000-0000", span: 1, customHandler: handlePhoneChange },
        { label: "Email", value: data.email, key: "email" as keyof ClientInfoType, placeholder: "email@exemplo.com", span: 1 },
        { label: "Razão Social", value: data.razaoSocial, key: "razaoSocial" as keyof ClientInfoType, placeholder: "Razão Social da Empresa", span: 2 },
        { label: "CNPJ", value: data.cnpj, key: "cnpj" as keyof ClientInfoType, placeholder: "00.000.000/0000-00", span: 1, customHandler: handleCNPJChange },
        { label: "Inscrição Estadual", value: data.inscricaoEstadual, key: "inscricaoEstadual" as keyof ClientInfoType, placeholder: "000.000.000.000", span: 1, customHandler: handleInscricaoEstadualChange },
        { label: "Endereço", value: data.endereco, key: "endereco" as keyof ClientInfoType, placeholder: "Rua, Avenida, etc.", span: 2 },
        { label: "Bairro", value: data.bairro, key: "bairro" as keyof ClientInfoType, placeholder: "Bairro", span: 1 },
        { label: "CEP", value: data.cep, key: "cep" as keyof ClientInfoType, placeholder: "00000-000", span: 1, customHandler: handleCEPChange },
        { label: "Cidade", value: data.cidade, key: "cidade" as keyof ClientInfoType, placeholder: "Cidade", span: 1 },
        { label: "UF", value: data.uf, key: "uf" as keyof ClientInfoType, placeholder: "SC", span: 1, maxLength: 2 },
    ];

    return (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">
                Informações do Cliente
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {fields.map((field) => (
                    <div
                        key={field.label}
                        className={`flex flex-col gap-1 group ${field.span === 2 ? 'md:col-span-2' : ''}`}
                    >
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest group-focus-within:text-red-500">
                            {field.label}
                            {
                                field.key === 'cep' && (
                                    <span className="text-gray-400 text-[10px]"> (Busca automática de endereço)</span>
                                )
                            }
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={field.value}
                                onChange={(e) => {
                                    if (field.customHandler) {
                                        field.customHandler(e.target.value);
                                    } else {
                                        onChange(field.key, e.target.value);
                                    }
                                }}
                                placeholder={field.placeholder}
                                maxLength={field.maxLength}
                                className="w-full border-b-2 border-gray-100 py-1 focus:border-red-500 outline-none transition-all text-sm uppercase"
                            />
                            {field.key === 'cep' && loadingCep && (
                                <div className="absolute right-0 top-1/2 -translate-y-1/2">
                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
