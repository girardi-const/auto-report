import { formatPhoneNumber } from "@/utils";

export const GeneralInfo = ({ data, onChange }: { data: any, onChange: any }) => {

    const handlePhoneChange = (value: string) => {
        const formatted = formatPhoneNumber(value);
        onChange.setConsultorPhone(formatted);
    };

    return (
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-6">
            <p className="text-sm font-black uppercase text-gray-400 tracking-widest col-span-full">
                Informações Gerais
            </p>

            {[
                { label: "Especificador", value: data.especificador, key: "setEspecificador", placeholder: "Arquiteto/Eng" },
                { label: "Consultor", value: data.consultor, key: "setConsultor", placeholder: "Seu nome" },
                { label: "Telefone Consultor", value: data.consultorPhone, key: "setConsultorPhone", placeholder: "Seu telefone" },
            ].map((field) => (
                <div key={field.label} className="flex flex-col gap-1 group">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest group-focus-within:text-red-500">
                        {field.label}
                    </label>

                    <input
                        type="text"
                        value={field.value}
                        placeholder={field.placeholder}
                        onChange={(e) => {
                            const value = e.target.value;

                            if (field.key === "setConsultorPhone") {
                                handlePhoneChange(value);
                            } else {
                                onChange[field.key](value.toUpperCase());
                            }
                        }}
                        className="border-b-2 border-gray-100 uppercase py-1 focus:border-red-500 outline-none transition-all text-sm"
                    />
                </div>
            ))}
        </section>
    );
};