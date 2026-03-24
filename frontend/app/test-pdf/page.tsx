'use client';

import { useState } from 'react';
import { pdf as generatePdf } from '@react-pdf/renderer';
import { ReportPDFDocument, Section, Product } from '../../components/PDFDocument';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

export default function TestPdfPage() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError(null);
        setProgress('Buscando marcas...');

        try {
            // 1. Fetch brands
            const brandsRes = await fetch(`${API_BASE_URL}/brands`);
            if (!brandsRes.ok) throw new Error('Falha ao buscar marcas');
            const brandsJson = await brandsRes.json();
            const brands = brandsJson.data.map((b: any) => typeof b === "string" ? b : b.brand_name);

            setProgress(`Encontradas ${brands.length} marcas. Buscando 1 produto de cada...`);

            const testProducts: Product[] = [];

            // 2. Fetch 1 product per brand
            for (const brand of brands) {
                try {
                    const params = new URLSearchParams({
                        limit: '1',
                        brand: brand
                    });
                    const prodRes = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
                    if (!prodRes.ok) continue;
                    
                    const prodJson = await prodRes.json();
                    const productsList = prodJson.data?.data ?? prodJson.data ?? [];
                    
                    if (productsList.length > 0) {
                        const p = productsList[0];
                        testProducts.push({
                            id: p.id || p._id || `test-${brand}`,
                            name: p.description || p.name || `Produto de Teste - ${brand}`,
                            code: p.code || 'VARIDO',
                            brand: brand,
                            units: 1,
                            priceBase: p.base_price || 100,
                            margin: p.margin || 0,
                            discount: 0,
                            image: p.imageurl || p.image || undefined
                        });
                    }
                } catch (e) {
                    console.error(`Erro ao buscar produto da marca ${brand}`, e);
                }
            }

            setProgress(`Encontrados ${testProducts.length} produtos. Gerando PDF...`);

            // 3. Prepare section
            const sections: Section[] = [
                {
                    id: 'test-section-1',
                    name: 'Seção de Teste de Imagens',
                    discount: 0,
                    products: testProducts
                }
            ];

            const totalValue = testProducts.reduce((acc, p) => acc + (p.priceBase * (1 + p.margin / 100)), 0);

            const doc = (
                <ReportPDFDocument
                    especificador="Teste de PDF"
                    consultor="Sistema"
                    consultorPhone=""
                    sections={sections}
                    totalValue={totalValue}
                    subtotalBeforeCash={totalValue}
                    cashDiscount={0}
                    clientInfo={{ name: 'Cliente Teste Renderização', telefone: '' }}
                />
            );

            // 4. Generate and download PDF
            const blob = await generatePdf(doc).toBlob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Teste_Renderizacao_${new Date().toISOString().split('T')[0]}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            
            setProgress('PDF gerado com sucesso!');
        } catch (err: any) {
            console.error('Erro geral', err);
            setError(err.message || 'Erro desconhecido');
            setProgress('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted flex items-center justify-center p-4 text-center">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-lg w-full flex flex-col gap-6">
                <h1 className="text-2xl font-bold">Teste de Renderização de PDF</h1>
                <p className="text-gray-500 text-sm">
                    Gera um PDF contendo 1 produto de cada marca cadastrada. Útil para testar a busca de imagens e a formatação geral.
                </p>
                
                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                        {error}
                    </div>
                )}

                {progress && !error && (
                    <div className="bg-blue-50 text-blue-600 p-3 rounded text-sm font-medium">
                        {progress}
                    </div>
                )}

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-primary text-white py-3 px-6 rounded-lg font-bold disabled:opacity-50 transition-opacity"
                >
                    {loading ? 'Gerando...' : 'Gerar PDF de Teste'}
                </button>
            </div>
        </div>
    );
}
