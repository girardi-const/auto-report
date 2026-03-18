import { EditModalProps } from "@/types";
import { useState } from "react";
import { ImageUpload } from "../ImageUpload";
import { Loader2, Save, X } from "lucide-react";

export function EditProductModal({ product, onClose, onSaved, getIdToken }: EditModalProps) {
    const [description, setDescription] = useState(product.description || '');
    const [brandName, setBrandName] = useState(product.brand_name);
    const [basePrice, setBasePrice] = useState(
        product.base_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
    const [image, setImage] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');

        try {
            const token = await getIdToken();
            const formattedPrice = parseFloat(basePrice.replace(/\./g, '').replace(',', '.'));

            const formData = new FormData();
            formData.append('description', description.toUpperCase());
            formData.append('brand_name', brandName.toUpperCase());
            formData.append('base_price', formattedPrice.toString());
            if (image) {
                formData.append('image', image);
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${product._id}`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || 'Erro ao atualizar produto');
            }

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Editar Produto</p>
                        <p className="font-black text-secondary text-sm truncate max-w-xs">{product.product_code}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-primary transition-colors p-1 rounded-lg">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                    {/* Image */}
                    <div className="flex flex-col gap-1.5 w-full">
                        <ImageUpload image={image} previewUrl={product.imageurl} onImageChange={setImage} />
                    </div>

                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nome / Descrição</label>
                        <input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-secondary focus:border-primary focus:bg-white outline-none transition-all uppercase"
                            placeholder="NOME DO PRODUTO"
                        />
                    </div>

                    {/* Brand */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Marca</label>
                        <input
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            required
                            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-semibold text-secondary focus:border-primary focus:bg-white outline-none transition-all uppercase"
                            placeholder="MARCA"
                        />
                    </div>

                    {/* Price */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preço Base (R$)</label>
                        <input
                            value={basePrice}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                const num = Number(raw) / 100;
                                setBasePrice(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
                            }}
                            required
                            className="bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-black text-primary focus:border-primary focus:bg-white outline-none transition-all"
                            placeholder="0,00"
                        />
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 font-medium bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 text-gray-500 font-black text-xs uppercase tracking-widest hover:border-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-white font-black text-xs uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            {saving ? 'Salvando…' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}