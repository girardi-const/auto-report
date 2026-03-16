'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Loader2, UploadCloud, CheckCircle2, PlayCircle, StopCircle } from 'lucide-react';

interface DokaProduct {
    codigo: string;
    nome: string;
    preco: number;
    imagem: string;
}

export default function SyncDokaPage() {
    const { getIdToken } = useAuth();
    const [fileOptions, setFileOptions] = useState<File | null>(null);
    const [products, setProducts] = useState<DokaProduct[]>([]);
    
    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ created: 0, updated: 0, failed: 0 });
    const cancelRef = useRef(false);

    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (Array.isArray(json)) {
                    setProducts(json);
                    toast.success(`Carregado com sucesso. ${json.length} produtos encontrados.`);
                } else {
                    toast.error('O formato do JSON é inválido. Esperava um array.');
                }
            } catch (err) {
                toast.error('Erro ao processar o arquivo JSON.');
            }
        };
        reader.readAsText(file);
        setFileOptions(file);
    };

    const processConcurrently = async (items: DokaProduct[], concurrency: number) => {
        let currentIndex = 0;
        let c = 0;
        let u = 0;
        let f = 0;
        
        const token = await getIdToken();
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };

        const processItem = async (item: DokaProduct) => {
            try {
                const getRes = await fetch(`${API}/products/${encodeURIComponent(item.codigo)}`, { headers });
                
                if (getRes.ok) {
                    const data = await getRes.json();
                    const existingProduct = data.data;

                    const putRes = await fetch(`${API}/products/${existingProduct._id}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({ base_price: item.preco })
                    });

                    if (putRes.ok) {
                        u++;
                    } else {
                        f++;
                    }
                } else if (getRes.status === 404) {
                    const postRes = await fetch(`${API}/products`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            product_code: item.codigo,
                            description: item.nome,
                            base_price: item.preco,
                            imageurl: item.imagem,
                            brand_name: 'DOKA'
                        })
                    });

                    if (postRes.ok) {
                        c++;
                    } else {
                        f++;
                    }
                } else {
                    f++;
                }
            } catch (err) {
                f++;
            }
        };

        const workers = Array(concurrency).fill(null).map(async () => {
            while (true) {
                if (cancelRef.current) break;
                
                // JS is single-threaded, atomic
                let index = currentIndex++;

                if (index >= items.length) break;

                await processItem(items[index]);

                setProgress(prev => {
                    const newProgress = prev + 1;
                    if (newProgress % 10 === 0) {
                        setStats({ created: c, updated: u, failed: f });
                    }
                    return newProgress;
                });
            }
        });

        await Promise.all(workers);
        setStats({ created: c, updated: u, failed: f });
    };

    const startSync = async () => {
        if (!products.length) return;
        setRunning(true);
        cancelRef.current = false;
        setProgress(0);
        setStats({ created: 0, updated: 0, failed: 0 });

        await processConcurrently(products, 5); // 5 concurrent requests

        setRunning(false);
        if (!cancelRef.current) {
            toast.success('Sincronização concluída!');
        } else {
            toast.info('Sincronização interrompida.');
        }
    };

    const stopSync = () => {
        cancelRef.current = true;
        setRunning(false);
    };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Sync JSON DOKA</h1>
            
            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
                <input
                    type="file"
                    accept=".json"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary/10 file:text-primary
                        hover:file:bg-primary/20
                    "
                    disabled={running}
                />
            </div>

            {products.length > 0 && (
                <div className="bg-white rounded-xl shadow p-6 border border-gray-100 flex flex-col items-center">
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                        <div 
                            className="bg-primary h-4 transition-all duration-300" 
                            style={{ width: `${(progress / products.length) * 100}%` }}
                        ></div>
                    </div>
                    
                    <div className="flex justify-between w-full text-sm font-semibold text-gray-600 mb-6">
                        <span>Progresso: {progress} / {products.length}</span>
                        <span>{((progress / products.length) * 100).toFixed(1)}%</span>
                    </div>

                    <div className="flex gap-4 w-full mb-6">
                        <div className="flex-1 bg-green-50 p-4 rounded-xl text-center border border-green-100">
                            <p className="text-2xl font-bold text-green-600">{stats.created}</p>
                            <p className="text-xs text-green-800 uppercase font-bold tracking-wider">Criados</p>
                        </div>
                        <div className="flex-1 bg-blue-50 p-4 rounded-xl text-center border border-blue-100">
                            <p className="text-2xl font-bold text-blue-600">{stats.updated}</p>
                            <p className="text-xs text-blue-800 uppercase font-bold tracking-wider">Atualizados</p>
                        </div>
                        <div className="flex-1 bg-red-50 p-4 rounded-xl text-center border border-red-100">
                            <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                            <p className="text-xs text-red-800 uppercase font-bold tracking-wider">Falhas</p>
                        </div>
                    </div>

                    {!running ? (
                        <button
                            onClick={startSync}
                            disabled={progress === products.length && products.length > 0}
                            className="bg-primary hover:bg-[#c91e25] text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-primary/20"
                        >
                            {progress === products.length ? <CheckCircle2 size={20} /> : <PlayCircle size={20} />}
                            {progress === products.length ? 'Finalizado' : progress > 0 ? 'Continuar Sync' : 'Iniciar Sync'}
                        </button>
                    ) : (
                        <button
                            onClick={stopSync}
                            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-full flex items-center gap-2 transition-all shadow-lg"
                        >
                            <StopCircle size={20} />
                            Parar Sync
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
