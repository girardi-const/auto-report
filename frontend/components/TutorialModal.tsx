'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, BookOpen, Home, FileText, PackagePlus, UploadCloud, Database, History, Tag, Edit3 } from 'lucide-react';

interface SlideImage {
    src: string;
    label?: string; // e.g. "1.1", "1.2"
}

interface Slide {
    title: string;
    description: string;
    images?: SlideImage[]; // if empty, text-only slide
    textOnly?: boolean;
}

interface TutorialSection {
    id: string;
    title: string;
    icon: React.ElementType;
    color: string;
    slides: Slide[];
}

const TUTORIAL_SECTIONS: TutorialSection[] = [
    {
        id: 'home',
        title: 'Página Inicial',
        icon: Home,
        color: '#c91e25',
        slides: [
            {
                title: 'Bem-vindo ao Portal Girardi!',
                description: 'Esta é a página inicial do sistema. Aqui você encontra acesso rápido a todas as ferramentas disponíveis para você.',
                images: [{ src: '/tutorial/home-step-1.png', label: '1' }],
            },
            {
                title: 'Navegação pelo menu',
                description: 'Toque nos blocos para abrir as ferramentas.',
                images: [{ src: '/tutorial/home-step-2.png', label: '2' }],
            },
        ],
    },
    {
        id: 'gerar-relatorio',
        title: 'Gerar Relatório',
        icon: FileText,
        color: '#c91e25',
        slides: [
            {
                title: 'Iniciando um relatório',
                description: 'Na página Gerar Relatório, você começa preenchendo as informações do cliente e do relatório.',
                images: [{ src: '/tutorial/gerar-relatorio-step-2.png', label: '1' }],
            },
            {
                title: 'Organização em Seções',
                description: 'Categorize seu relatório com precisão. Crie múltiplas seções personalizadas para agrupar produtos, aplicando nomes, descontos e margens específicas para cada conjunto.',
                images: [{ src: '/tutorial/gerar-relatorio-step-3.png', label: '2' }],
            },
            {
                title: 'Configurando produtos',
                description: 'Adicione produtos ao relatório no campo de código. Para cada produto adicionado, você pode ajustar a quantidade, aplicar descontos individuais e personalizar informações e margens.',
                images: [{ src: '/tutorial/gerar-relatorio-step-5.png', label: '3' }],
            },
            {
                title: 'Buscando produtos dinamicamente',
                description: 'Utilize o botão ao lado do campo de código para buscar produto por nome, ou adicione múltiplos produtos de uma vez abrindo a busca pelo botão no cabeçalho da seção.',
                images: [
                    { src: '/tutorial/gerar-relatorio-step-6.png', label: 'BOTÃO INDIVIDUAL' },
                    { src: '/tutorial/gerar-relatorio-step-7.1.png', label: 'CAIXA INDIVIDUAL' },
                    { src: '/tutorial/gerar-relatorio-step-7.2.png', label: 'BOTÃO COLETIVO' },
                    { src: '/tutorial/gerar-relatorio-step-7.3.png', label: 'CAIXA COLETIVA' }],
            },
            {
                title: 'Descontos e condições de entrega',
                description: 'Configure descontos globais e as condições de entrega. O sistema calcula automaticamente os totais.',
                images: [{ src: '/tutorial/gerar-relatorio-step-8.png', label: '5' }],
            },
            {
                title: 'Resultado e prévia do PDF',
                description: 'Veja como o relatório ficará antes de baixar.',
                images: [
                    { src: '/tutorial/gerar-relatorio-step-9.png', label: '6' },
                ],
            },
            {
                title: 'Salvando',
                description: 'Clique em "SALVAR" para salvar o relatório no seu dispositivo, assim que gerado o PDF ou EXCEL salvará automaticamente. Salvando no histórico pode acessar depois.',
                images: [{ src: '/tutorial/gerar-relatorio-step-8.png', label: '7' }],
            },
        ],
    },
    {
        id: 'catalogo',
        title: 'Catálogo',
        icon: Database,
        color: '#3b82f6',
        slides: [
            {
                title: 'Navegando no Catálogo',
                description: 'O Catálogo exibe todos os produtos disponíveis no sistema. Use os filtros por marca, nome ou código para encontrar o produto desejado rapidamente.',
                textOnly: true,
            },
            {
                title: 'Usando o Catálogo para relatórios',
                description: 'Ao encontrar um produto no catálogo, você pode visualizar seus detalhes: código, nome, marca, preço e imagem. Esses dados são os mesmos usados ao gerar relatórios.',
                textOnly: true,
            },
        ],
    },
    {
        id: 'historico',
        title: 'Histórico',
        icon: History,
        color: '#22c55e',
        slides: [
            {
                title: 'Visão geral do Histórico',
                description: 'No Histórico você encontra todos os relatórios que gerou e salvou anteriormente. A lista exibe o nome do cliente, título do orçamento, data de criação e o valor total de cada relatório.',
                images: [{ src: '/tutorial/historico-step-1.png', label: '1' }],
            },
            {
                title: 'Ações disponíveis por relatório',
                description: 'Para cada relatório na lista, você tem botões de ação: visualizar detalhes, gerar PDF ou EXCEL novamente, duplicar ou excluir o registro. Passe o mouse sobre um item para ver as opções.',
                images: [{ src: '/tutorial/historico-step-2.png', label: '2' }],
            },
            {
                title: 'Detalhes e edição do relatório',
                description: 'Ao abrir um relatório salvo, você pode ver todos os produtos organizados por seção, seus preços e quantidades. Use o botão de edição para alterar qualquer informação.',
                images: [{ src: '/tutorial/historico-step-3.png', label: '3' }],
            },
        ],
    },
    {
        id: 'marcas',
        title: 'Marcas',
        icon: Tag,
        color: '#14b8a6',
        slides: [
            {
                title: 'Gerenciando Marcas',
                description: 'A seção de Marcas exibe todas as marcas cadastradas no sistema. Você pode visualizar quais marcas estão disponíveis e quantos produtos cada uma possui.',
                textOnly: true,
            },
        ],
    },
    {
        id: 'editor',
        title: 'Editor Livre',
        icon: Edit3,
        color: '#0ea5e9',
        slides: [
            {
                title: 'Visão geral do Editor',
                description: 'O Editor Livre é uma ferramenta de criação totalmente personalizada. Na esquerda você encontra o painel de blocos, no centro a área de edição no formato A4, e no rodapé os botões de pré-visualização e download do PDF.',
                images: [{ src: '/tutorial/editor-step-1.png', label: '1' }],
            },
            {
                title: 'Adicionando Blocos',
                description: 'Use o painel lateral esquerdo para adicionar blocos ao documento: Texto, Tabela, Sessão, Total de Seção, Total Geral, Imagem e Espaçador. Cada bloco pode ser reordenado com as setas ou removido ao passar o mouse sobre ele.',
                images: [{ src: '/tutorial/editor-step-2..png', label: '2' }],
            },
            {
                title: 'Formatação manual e personalização total',
                description: 'Cada bloco de texto pode ser formatado individualmente (tamanho, alinhamento, negrito). Cole imagens diretamente com CTRL+V — tanto como bloco de imagem independente quanto dentro de células de tabela. Isso permite total liberdade na composição visual do documento.',
                images: [{ src: '/tutorial/editor-step-3.png', label: '3' }],
            },
            {
                title: 'Pré-visualizar e baixar o PDF',
                description: 'Clique em "Pré-Visualizar" na barra inferior para ver exatamente como o documento ficará em PDF. Se estiver satisfeito, clique em "Baixar PDF" para salvar o arquivo no seu dispositivo, este modo não salva o relatório no histórico.',
                images: [{ src: '/tutorial/editor-step-4.png', label: '4' }],
            },
        ],
    },
    {
        id: 'criar-produto',
        title: 'Cadastrar Produto',
        icon: PackagePlus,
        color: '#a855f7',
        slides: [
            {
                title: 'Cadastrando um novo produto',
                description: 'Na página de Cadastro de Produto, preencha o código, nome, marca e preço do produto. Esses campos são obrigatórios para o produto aparecer no catálogo.',
                images: [{ src: '/tutorial/criar-produto-step-1.png', label: '1' }],
            },
            {
                title: 'Adicione uma marca se precisar',
                description: 'Clique no botão "+ Nova Marca" para adicionar uma nova marca. A marca será exibida no catálogo e nos relatórios gerados com esse produto.',
                images: [{ src: '/tutorial/criar-produto-step-2.png', label: '2' }],
            },
        ],
    },
    {
        id: 'importar',
        title: 'Importar Produtos',
        icon: UploadCloud,
        color: '#ef4444',
        slides: [
            {
                title: 'Importando em massa via planilha',
                description: 'O Importador permite cadastrar ou atualizar múltiplos produtos de uma vez por meio de uma planilha (.xlsx ou .csv).',
                images: [
                    { src: '/tutorial/importar-step-1.1.png', label: 'Caixa para colocar o arquivo .xlsx ou .csv' },
                    { src: '/tutorial/importar-step-1.2.png', label: 'Exemplo de arquivo .xlsx ou .csv' },
                ],
            },
            {
                title: 'Apagando importações',
                description: 'Após enviar o arquivo, o sistema salva as importações e os produtos afetados. Você pode apagar as importações e os produtos afetados clicando no botão .',
                images: [{ src: '/tutorial/importar-step-2.png', label: 'Opções de exclusão' }],
            },
        ],
    },
];

// Flatten all slides into a single list with section info
function buildFlatSlides() {
    const flat: Array<{ slide: Slide; section: TutorialSection; sectionIndex: number; slideIndex: number }> = [];
    TUTORIAL_SECTIONS.forEach((section, si) => {
        section.slides.forEach((slide, sli) => {
            flat.push({ slide, section, sectionIndex: si, slideIndex: sli });
        });
    });
    return flat;
}

const FLAT_SLIDES = buildFlatSlides();
const TOTAL_SLIDES = FLAT_SLIDES.length;

interface TutorialModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TutorialModal({ isOpen, onClose }: TutorialModalProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});
    const [animDirection, setAnimDirection] = useState<'next' | 'prev'>('next');
    const [isAnimating, setIsAnimating] = useState(false);

    // Reset to first slide when modal opens
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(0);
        }
    }, [isOpen]);

    const goTo = useCallback((index: number, direction: 'next' | 'prev' = 'next') => {
        if (isAnimating) return;
        setAnimDirection(direction);
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex(index);
            setIsAnimating(false);
        }, 200);
    }, [isAnimating]);

    const goNext = useCallback(() => {
        if (currentIndex < TOTAL_SLIDES - 1) {
            goTo(currentIndex + 1, 'next');
        } else {
            onClose();
        }
    }, [currentIndex, goTo, onClose]);

    const goPrev = useCallback(() => {
        if (currentIndex > 0) {
            goTo(currentIndex - 1, 'prev');
        }
    }, [currentIndex, goTo]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, goNext, goPrev, onClose]);

    if (!isOpen) return null;

    const current = FLAT_SLIDES[currentIndex];
    const { slide, section } = current;
    const isLast = currentIndex === TOTAL_SLIDES - 1;

    // Section dot navigation
    const sectionStartIndices: number[] = [];
    let idx = 0;
    TUTORIAL_SECTIONS.forEach(sec => {
        sectionStartIndices.push(idx);
        idx += sec.slides.length;
    });

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden"
                style={{ maxWidth: '860px', maxHeight: '92vh' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-2 rounded-xl"
                            style={{ backgroundColor: `${section.color}15` }}
                        >
                            <section.icon size={18} style={{ color: section.color }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tutorial</p>
                            <h2 className="text-sm font-black text-gray-800 leading-tight">{section.title}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-400 tabular-nums">
                            {currentIndex + 1} / {TOTAL_SLIDES}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 transition-colors"
                            title="Fechar tutorial"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ── Section Tabs ── */}
                <div className="flex gap-1.5 px-6 py-3 overflow-x-auto border-b border-gray-50 shrink-0 scrollbar-none">
                    {TUTORIAL_SECTIONS.map((sec, si) => {
                        const startIdx = sectionStartIndices[si];
                        const isActive = current.sectionIndex === si;
                        return (
                            <button
                                key={sec.id}
                                onClick={() => goTo(startIdx, si < current.sectionIndex ? 'prev' : 'next')}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 shrink-0"
                                style={{
                                    backgroundColor: isActive ? `${sec.color}15` : 'transparent',
                                    color: isActive ? sec.color : '#9ca3af',
                                    border: isActive ? `1.5px solid ${sec.color}30` : '1.5px solid transparent',
                                }}
                            >
                                <sec.icon size={11} />
                                {sec.title}
                            </button>
                        );
                    })}
                </div>

                {/* ── Slide Content ── */}
                <div
                    className="flex-1 overflow-y-auto px-6 py-6 flex flex-col"
                    style={{
                        opacity: isAnimating ? 0 : 1,
                        transform: isAnimating
                            ? `translateX(${animDirection === 'next' ? '20px' : '-20px'})`
                            : 'translateX(0)',
                        transition: 'opacity 0.2s ease, transform 0.2s ease',
                    }}
                >
                    {/* Slide Title + Description */}
                    <div className="mb-5">
                        <h3 className="text-xl font-black text-gray-800 mb-2">{slide.title}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">{slide.description}</p>
                    </div>

                    {/* Images or Text-only panel */}
                    {slide.textOnly ? (
                        <div
                            className="flex-1 flex items-center justify-center rounded-2xl p-8 min-h-[200px]"
                            style={{ backgroundColor: `${section.color}08`, border: `1.5px dashed ${section.color}30` }}
                        >
                            <div className="text-center max-w-md">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                    style={{ backgroundColor: `${section.color}15` }}
                                >
                                    <section.icon size={28} style={{ color: section.color }} />
                                </div>
                                <p className="text-sm font-semibold text-gray-600 leading-relaxed">
                                    {slide.description}
                                </p>
                            </div>
                        </div>
                    ) : slide.images && slide.images.length > 0 ? (
                        slide.images.length === 1 ? (
                            // Single image
                            <div className="flex-1 flex flex-col items-center">
                                <div className="relative w-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 shadow-inner">
                                    {!imageLoaded[slide.images[0].src] && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
                                        </div>
                                    )}
                                    <img
                                        src={slide.images[0].src}
                                        alt={slide.title}
                                        className="w-full object-contain"
                                        style={{ maxHeight: '50vh' }}
                                        onLoad={() => setImageLoaded(prev => ({ ...prev, [slide.images![0].src]: true }))}
                                    />
                                </div>
                                {slide.images[0].label && (
                                    <span
                                        className="mt-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                        style={{ color: section.color, backgroundColor: `${section.color}10` }}
                                    >
                                        Passo {slide.images[0].label}
                                    </span>
                                )}
                            </div>
                        ) : (
                            // Multiple sub-images side by side
                            <div className="flex-1 flex flex-col gap-4">
                                <div className={`grid gap-3 flex-1 ${slide.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                                    {slide.images.map((img) => (
                                        <div key={img.src} className="flex flex-col items-center gap-2">
                                            <div className="relative w-full bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-inner">
                                                {!imageLoaded[img.src] && (
                                                    <div className="absolute inset-0 flex items-center justify-center min-h-[120px]">
                                                        <div className="w-6 h-6 border-2 border-gray-200 border-t-primary rounded-full animate-spin" />
                                                    </div>
                                                )}
                                                <img
                                                    src={img.src}
                                                    alt={`${slide.title} - ${img.label}`}
                                                    className="w-full object-contain"
                                                    style={{ maxHeight: '42vh' }}
                                                    onLoad={() => setImageLoaded(prev => ({ ...prev, [img.src]: true }))}
                                                />
                                            </div>
                                            {img.label && (
                                                <span
                                                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md"
                                                    style={{ color: section.color, backgroundColor: `${section.color}10` }}
                                                >
                                                    {img.label}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    ) : null}
                </div>

                {/* ── Footer Navigation ── */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
                    {/* Previous */}
                    <button
                        onClick={goPrev}
                        disabled={currentIndex === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        Anterior
                    </button>

                    {/* Slide dots (per slide within current section) */}
                    <div className="flex gap-1.5">
                        {FLAT_SLIDES.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => goTo(i, i > currentIndex ? 'next' : 'prev')}
                                className="transition-all duration-200 rounded-full"
                                style={{
                                    width: i === currentIndex ? '20px' : '6px',
                                    height: '6px',
                                    backgroundColor: i === currentIndex ? section.color : '#d1d5db',
                                }}
                            />
                        ))}
                    </div>

                    {/* Next / Finish */}
                    <div className="flex items-center gap-2">
                        {!isLast && (
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-bold text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                            >
                                Pular
                            </button>
                        )}
                        <button
                            onClick={goNext}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                            style={{
                                backgroundColor: section.color,
                                boxShadow: `0 4px 14px ${section.color}40`,
                            }}
                        >
                            {isLast ? (
                                <>
                                    <BookOpen size={15} />
                                    Concluir Tutorial
                                </>
                            ) : (
                                <>
                                    Próximo
                                    <ChevronRight size={15} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
