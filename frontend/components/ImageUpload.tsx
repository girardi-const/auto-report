import { ImageUploadProps } from "@/types";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getProxyImageUrl } from "@/utils/image";


export function ImageUpload({ image, previewUrl, onImageChange }: ImageUploadProps) {
    const [internalPreview, setInternalPreview] = useState<string | null>(getProxyImageUrl(previewUrl) ?? null);
    const [userCleared, setUserCleared] = useState(false);

    useEffect(() => {
        if (image) {
            setUserCleared(false);
            const url = URL.createObjectURL(image);
            setInternalPreview(url);
            return () => URL.revokeObjectURL(url);
        } else if (!userCleared) {
            setInternalPreview(getProxyImageUrl(previewUrl) ?? null);
        }
    }, [image, previewUrl, userCleared]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        onImageChange(file);
    };

    const handleClear = () => {
        setUserCleared(true);
        setInternalPreview(null);
        onImageChange(null);
    };

    return (
        <div className="col-span-1 md:col-span-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-gray-50 hover:bg-white hover:border-primary transition-all group relative overflow-hidden min-h-[300px]">
            {internalPreview ? (
                <div className="absolute inset-0 w-full h-full">
                    <img src={internalPreview} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="bg-primary text-white p-3 rounded-full hover:scale-110 transition-transform shadow-xl"
                        >
                            <Trash2 size={24} />
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-white p-4 rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform group-hover:text-primary">
                        <Plus size={40} strokeWidth={1.5} />
                    </div>
                    <div className="text-center">
                        <p className="font-black text-sm uppercase tracking-widest text-secondary">Adicionar Imagem do Produto</p>
                        <p className="text-gray-400 text-[10px] font-medium uppercase tracking-widest mt-2">Arraste ou clique para selecionar</p>
                    </div>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </>
            )}
        </div>
    );
}
