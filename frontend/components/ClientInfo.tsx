import { formatPhoneNumber } from "@/utils";
import { ClientInfo as ClientInfoType } from "../types";

interface ClientInfoProps {
    data: ClientInfoType;
    onChange: (field: keyof ClientInfoType, value: string) => void;
}

export const ClientInfo = ({ data, onChange }: ClientInfoProps) => {
    const handlePhoneChange = (value: string) => {
        const formatted = formatPhoneNumber(value);
        onChange('telefone', formatted);
    };

    const fields = [
        { label: "Nome", value: data.name, key: "name" as keyof ClientInfoType, placeholder: "Nome do cliente", span: 2 },
        { label: "Telefone", value: data.telefone, key: "telefone" as keyof ClientInfoType, placeholder: "(00) 00000-0000", span: 1, customHandler: handlePhoneChange },
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
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={field.value}
                                onChange={(e) => {
                                    if (field.customHandler) {
                                        field.customHandler(e.target.value);
                                    } else {
                                        onChange(field.key, e.target.value.toUpperCase());
                                    }
                                }}
                                placeholder={field.placeholder}
                                className="w-full border-b-2 border-gray-100 py-1 focus:border-red-500 outline-none transition-all text-sm uppercase"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};
