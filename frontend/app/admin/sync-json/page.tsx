'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, UploadCloud, CheckCircle2, PlayCircle, StopCircle, Table2, Code2, PackageSearch } from 'lucide-react';

interface DecaProduct {
    _id?: string;
    code: string;
    name: string;
    price: number;
    image?: string | null; // legacy field name
    imageurl?: string | null;     // field name used in merged_products.json
    brand: string;
    image_file?: string; // field from products.json
}

function capitalizeFirstLetter(str: string) {
    if (!str) return str; // Retorna a string vazia se for nula ou vazia
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function SyncDecaPage() {
    const { user, isAdmin, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [fileOptions, setFileOptions] = useState<File | null>(null);
    const [products, setProducts] = useState<DecaProduct[]>([]);
    const [previewMode, setPreviewMode] = useState<'table' | 'raw'>('table');

    const [running, setRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [stats, setStats] = useState({ created: 0, updated: 0, failed: 0 });
    const [isLyorSync, setIsLyorSync] = useState(false);
    const [isGabrielaSync, setIsGabrielaSync] = useState(false);
    const cancelRef = useRef(false);

    const PREVIEW_LIMIT = 100;

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
        setIsLyorSync(false);
        setIsGabrielaSync(false);
    };

    const loadLyorProducts = async () => {
        try {
            const res = await fetch(`${API}/static-images/products.json`);
            if (!res.ok) throw new Error('Não foi possível carregar o arquivo products.json');
            const json = await res.json();

            // Filter products with Brand being LYOR
            const lyorOnly = json.filter((p: any) =>
                (p.name && p.name.toUpperCase().includes('LYOR'))
            ).map((p: any) => ({
                code: p.code,
                name: p.name,
                price: p.price,
                brand: 'LYOR',
                image_file: p.image_file
            }));

            if (lyorOnly.length === 0) {
                toast.error('Nenhum produto Lyor encontrado no JSON.');
                return;
            }

            setProducts(lyorOnly);
            setIsLyorSync(true);
            setIsGabrielaSync(false);
            setFileOptions(null);
            toast.success(`${lyorOnly.length} produtos Lyor carregados.`);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar produtos Lyor da pasta local.');
        }
    };

    const loadGabrielaProducts = async () => {
        try {
            const token = await getIdToken();
            const headers = { Authorization: `Bearer ${token}` };

            let allGabriela: any[] = [];
            let page = 1;
            let totalPages = 1;

            toast.info('Buscando produtos Gabriela no banco de dados...');
            do {
                const res = await fetch(`${API}/products?brand=GABRIELA&limit=100&page=${page}`, { headers });
                if (!res.ok) throw new Error('Falha ao buscar produtos Gabriela');
                const response = await res.json();

                const productsPage = response.data.data || [];
                totalPages = response.data.totalPages || 1;

                const needSync = productsPage.filter((p: any) =>
                    p.imageurl && !p.imageurl.includes('res.cloudinary.com')
                );

                allGabriela = [...allGabriela, ...needSync];
                page++;
            } while (page <= totalPages);

            if (allGabriela.length === 0) {
                toast.info('Nenhum produto Gabriela precisando de sincronização de imagem.');
                return;
            }

            const formatted = allGabriela.map(p => ({
                _id: p._id,
                code: p.product_code,
                name: p.description,
                price: p.base_price,
                brand: 'GABRIELA',
                imageurl: p.imageurl
            }));

            setProducts(formatted);
            setIsGabrielaSync(true);
            setIsLyorSync(false);
            setFileOptions(null);
            toast.success(`${formatted.length} produtos Gabriela carregados para sync.`);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao carregar produtos Gabriela.');
        }
    };

    const processConcurrently = async (items: DecaProduct[], concurrency: number) => {
        let currentIndex = 0;
        let c = 0;
        let u = 0;
        let f = 0;

        const token = await getIdToken();
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };

        const existingBrands = new Set<string>();
        try {
            const brandsRes = await fetch(`${API}/brands`, { headers });
            if (brandsRes.ok) {
                const brandsData = await brandsRes.json();
                brandsData.data.forEach((b: any) => existingBrands.add(b.brand_name.toUpperCase()));
            }
        } catch (err) {
            console.error('Erro ao buscar marcas:', err);
        }

        const ensureBrandExists = async (brandName: string) => {
            if (!brandName) return;
            const upperBrand = brandName.toUpperCase().trim();
            if (existingBrands.has(upperBrand)) return;

            try {
                const res = await fetch(`${API}/brands`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ brand_name: upperBrand })
                });
                // Status 201 created or 400 (which might mean already exists due to unique constraint)
                if (res.ok || res.status === 400) {
                    existingBrands.add(upperBrand);
                }
            } catch (err) {
                console.error(`Erro ao criar marca ${upperBrand}:`, err);
            }
        };

        const processItem = async (item: DecaProduct) => {
            try {
                const bName = (item.brand || 'OUTROS').toUpperCase();
                await ensureBrandExists(bName);

                if (isGabrielaSync && item._id && item.imageurl) {
                    try {
                        const imgRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(item.imageurl)}`);
                        if (!imgRes.ok) throw new Error(`Proxy error: ${imgRes.status}`);

                        const blob = await imgRes.blob();
                        const formData = new FormData();
                        formData.append('image', blob, `${item.code}.png`);

                        const patchRes = await fetch(`${API}/products/${item._id}/image`, {
                            method: 'PATCH',
                            headers: { Authorization: `Bearer ${token}` },
                            body: formData
                        });

                        if (patchRes.ok) {
                            u++;
                        } else {
                            f++;
                        }
                    } catch (imgErr: any) {
                        const is404 = imgErr.message && imgErr.message.includes('404');
                        if (is404) {
                            console.warn(`Imagem original não encontrada (404) para Gabriela ${item.code}`);
                        } else {
                            console.error(`Erro ao processar imagem para Gabriela ${item.code}:`, imgErr);
                        }
                        f++;
                    }
                    return;
                }

                // If Lyor Sync, attempt to upload image from local static folder
                if (isLyorSync && item.image_file) {
                    try {
                        const imgRes = await fetch(`${API}/static-images/${item.image_file}`);
                        if (imgRes.ok) {
                            const blob = await imgRes.blob();
                            const formData = new FormData();
                            formData.append('image', blob, item.image_file);
                            formData.append('code', item.code);
                            formData.append('description', item.name.toUpperCase());
                            formData.append('brand', bName);
                            formData.append('price', item.price.toString());

                            const uploadRes = await fetch(`${API}/products/upload`, {
                                method: 'POST',
                                headers: {
                                    Authorization: `Bearer ${token}`
                                },
                                body: formData
                            });

                            if (uploadRes.ok) {
                                c++;
                                return;
                            } else if (uploadRes.status === 400) {
                                // Likely duplicate code, try to update instead
                                const data = await uploadRes.json();
                                if (data.error?.code === 'DUPLICATE_CODE') {
                                    // Fetch existing product to get its ID
                                    const getRes = await fetch(`${API}/products/${encodeURIComponent(item.code)}`, { headers });
                                    if (getRes.ok) {
                                        const existingData = await getRes.json();
                                        const productId = existingData.data._id;

                                        // Update with new image
                                        const updateFormData = new FormData();
                                        updateFormData.append('image', blob, item.image_file);
                                        updateFormData.append('description', item.name.toUpperCase());
                                        updateFormData.append('brand_name', bName);
                                        updateFormData.append('base_price', item.price.toString());

                                        const putRes = await fetch(`${API}/products/${productId}`, {
                                            method: 'PUT',
                                            headers: { Authorization: `Bearer ${token}` },
                                            body: updateFormData
                                        });

                                        if (putRes.ok) {
                                            u++;
                                            return;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (imgErr) {
                        console.error(`Erro ao processar imagem para ${item.code}:`, imgErr);
                    }
                }

                // Normal JSON Sync logic (fallback or non-Lyor)
                const getRes = await fetch(`${API}/products/${encodeURIComponent(item.code)}`, { headers });
                
                const imgUrl = (item.image ?? item.imageurl ?? '').trim();
                const isValidUrl = imgUrl.length > 0;

                if (getRes.ok) {
                    const data = await getRes.json();
                    const existingProduct = data.data;
                    
                    const updateBody: any = {
                        description: item.name.toUpperCase(),
                        brand_name: bName
                    };
                    if (isValidUrl) {
                        updateBody.imageurl = imgUrl;
                    }

                    const putRes = await fetch(`${API}/products/${existingProduct._id}`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify(updateBody)
                    });

                    if (putRes.ok) {
                        u++;
                    } else {
                        f++;
                    }
                } else if (getRes.status === 404) {
                    const requestBody: any = {
                        product_code: item.code.toString(),
                        description: item.name.toUpperCase(),
                        base_price: item.price || 0,
                        brand_name: bName
                    };
                    if (isValidUrl) {
                        requestBody.imageurl = imgUrl;
                    }

                    console.log('Criando produto:', requestBody);

                    const postRes = await fetch(`${API}/products`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(requestBody)
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

    // Guard: Admin only
    useEffect(() => {
        if (!authLoading && (!user || !isAdmin)) {
            router.push('/');
        }
    }, [user, isAdmin, authLoading, router]);

    if (authLoading || !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-6">
            <h1 className="text-2xl font-bold mb-4">Sync JSON</h1>

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

            <div className="flex gap-4">
                <button
                    onClick={loadLyorProducts}
                    disabled={running}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                    <UploadCloud size={20} />
                    Carregar Lyor (Local JSON)
                </button>
                <button
                    onClick={loadGabrielaProducts}
                    disabled={running}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                    <UploadCloud size={20} />
                    Sync Imagens Gabriela
                </button>
            </div>

            {/* JSON Preview */}
            {products.length > 0 && (
                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <PackageSearch size={20} className="text-primary" />
                            <span className="font-semibold text-gray-700">Preview do JSON</span>
                            <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                                {products.length} produtos
                            </span>
                        </div>
                        <div className="flex items-center gap-1 bg-gray-200 p-1 rounded-lg">
                            <button
                                onClick={() => setPreviewMode('table')}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${previewMode === 'table'
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Table2 size={14} /> Tabela
                            </button>
                            <button
                                onClick={() => setPreviewMode('raw')}
                                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md transition-all ${previewMode === 'raw'
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Code2 size={14} /> JSON
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    {previewMode === 'table' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100">
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Código</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Marca</th>
                                        <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Preço</th>
                                        <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Imagem</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.slice(0, PREVIEW_LIMIT).map((p, i) => (
                                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors">
                                            <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{p.code}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-gray-700 max-w-xs truncate" title={p.name}>{p.name}</td>
                                            <td className="px-4 py-2.5">
                                                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{p.brand || ""}</span>
                                            </td>
                                            <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                                                {p.price != null
                                                    ? `R$ ${Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                                    : <span className="text-gray-400 text-xs">—</span>}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {(() => {
                                                    const img = p.image ?? p.imageurl; return img ? (
                                                        <a
                                                            href={img}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-primary text-xs underline truncate block max-w-[180px]"
                                                            title={img}
                                                        >
                                                            {img}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs">sem imagem</span>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {products.length > PREVIEW_LIMIT && (
                                <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-100">
                                    Mostrando {PREVIEW_LIMIT} de {products.length} produtos. Todos serão processados na sincronização.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Raw JSON View */}
                    {previewMode === 'raw' && (
                        <div className="overflow-auto max-h-[400px]">
                            <pre className="text-xs text-gray-700 bg-gray-950 text-green-400 p-5 leading-relaxed">
                                {JSON.stringify(products.slice(0, PREVIEW_LIMIT), null, 2)}
                            </pre>
                            {products.length > PREVIEW_LIMIT && (
                                <p className="text-center text-xs text-gray-400 py-3 border-t border-gray-800 bg-gray-950">
                                    Mostrando {PREVIEW_LIMIT} de {products.length} itens
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}

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
