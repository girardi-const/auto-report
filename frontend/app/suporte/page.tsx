'use client';

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTutorialContext } from "@/components/TutorialProvider";
import {
    BookOpen,
    ChevronDown,
    HelpCircle,
    LifeBuoy,
    MessageCircle,
    FileText,
    Database,
    History,
    Tag,
    Edit3,
    PackagePlus,
    UploadCloud,
    Sparkles,
} from "lucide-react";

interface FAQItem {
    question: string;
    answer: string;
    icon: React.ElementType;
    category: string;
}

const FAQ_ITEMS: FAQItem[] = [
    {
        question: "Como gerar um relatório/orçamento?",
        answer: "Acesse 'Gerar Relatório' no menu principal. Preencha os dados do cliente, adicione produtos usando o campo de busca por código ou nome, configure quantidades, descontos e condições de pagamento. Ao finalizar, clique em 'Gerar PDF' para baixar ou salvar no histórico.",
        icon: FileText,
        category: "Relatórios",
    },
    {
        question: "Como usar o Editor Livre?",
        answer: "O Editor Livre permite criar documentos com formatação personalizada. Você pode digitar texto livremente, importar dados de relatórios existentes e customizar o layout completo do documento conforme a necessidade de cada cliente.",
        icon: Edit3,
        category: "Relatórios",
    },
    {
        question: "Como buscar produtos no catálogo?",
        answer: "No Catálogo, use a barra de busca para pesquisar por nome ou código. Você também pode filtrar por marca para encontrar produtos específicos. Cada produto exibe seu código, nome, marca, preço e imagem.",
        icon: Database,
        category: "Catálogo",
    },
    {
        question: "Como acessar relatórios salvos?",
        answer: "Acesse a página 'Histórico' pelo menu. Todos os relatórios que você gerou e salvou ficam disponíveis lá. Você pode reabrir qualquer relatório, baixá-lo novamente em PDF ou continuar editando.",
        icon: History,
        category: "Histórico",
    },
    {
        question: "O que são Marcas no sistema?",
        answer: "A seção 'Marcas' lista todas as marcas de produtos cadastradas no sistema. Ela ajuda a visualizar a organização dos produtos e quantos itens cada marca possui. Marcas são atribuídas a produtos no momento do cadastro.",
        icon: Tag,
        category: "Marcas",
    },
    {
        question: "Como cadastrar um novo produto?",
        answer: "Na página 'Criar Produto' (disponível para administradores), preencha o código, nome, marca e preço do produto. Você também pode fazer upload de uma imagem. Todos os campos obrigatórios são marcados no formulário.",
        icon: PackagePlus,
        category: "Produtos",
    },
    {
        question: "Como importar produtos em massa?",
        answer: "Acesse o 'Importador' no menu (administradores). Faça upload de uma planilha .xlsx ou .csv seguindo o formato indicado. O sistema processa automaticamente e cria ou atualiza os produtos. Você pode acompanhar o progresso em tempo real.",
        icon: UploadCloud,
        category: "Produtos",
    },
    {
        question: "Posso aplicar descontos no relatório?",
        answer: "Sim! Ao gerar um relatório, você pode aplicar descontos individuais por produto e também um desconto global sobre o total. O desconto para pagamento à vista também é configurável. Tudo é calculado automaticamente.",
        icon: Sparkles,
        category: "Relatórios",
    },
    {
        question: "Como funciona o frete no relatório?",
        answer: "Na seção de entrega do formulário de relatório, você informa o endereço e o valor do frete. Esse valor é adicionado ao total do orçamento e exibido separadamente no PDF gerado para o cliente.",
        icon: FileText,
        category: "Relatórios",
    },
    {
        question: "Como entro em contato com o suporte?",
        answer: "Caso tenha alguma dúvida não respondida aqui, entre em contato com o administrador do sistema. Você também pode repetir o tutorial a qualquer momento clicando no botão acima para relembrar como usar cada funcionalidade.",
        icon: MessageCircle,
        category: "Geral",
    },
];

export default function SuportePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const { resetTutorial } = useTutorialContext();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/sign-in');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return loading ? (
            <div className="min-h-screen bg-muted flex items-center justify-center">
                <div className="text-gray-500 italic font-medium">Carregando...</div>
            </div>
        ) : null;
    }

    const toggleFaq = (idx: number) => {
        setOpenIndex(openIndex === idx ? null : idx);
    };

    return (
        <div className="min-h-screen bg-muted">
            {/* ── Page Header ── */}
            <div className="px-6 py-6">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-gray-800 font-black text-2xl tracking-tight uppercase">
                        <span className="text-primary">Suporte</span> & Ajuda
                    </h1>
                    <p className="text-gray-800/40 text-xs font-medium mt-0.5">
                        Encontre respostas para suas dúvidas e aprenda a usar o sistema.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12 space-y-8">
                {/* ── Welcome + Tutorial Replay ── */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <BookOpen size={28} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-2">
                            Bem-vindo ao Portal Girardi!
                        </h2>
                        <p className="text-sm text-gray-500 leading-relaxed max-w-lg mx-auto mb-6">
                            Este sistema foi criado para facilitar a criação de orçamentos e relatórios
                            profissionais. Explore as ferramentas disponíveis e, se precisar relembrar
                            como cada funcionalidade funciona, repita o tutorial interativo a qualquer momento.
                        </p>
                        <button
                            onClick={resetTutorial}
                            className="inline-flex items-center gap-2.5 px-6 py-3 bg-primary text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/20 hover:bg-[#b01a20] active:scale-95 transition-all duration-200"
                        >
                            <BookOpen size={17} />
                            Repetir Tutorial
                        </button>
                    </div>
                </div>

                {/* ── FAQ Section ── */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                        <HelpCircle size={16} className="text-primary" />
                        <h2 className="text-sm font-bold text-secondary uppercase tracking-widest">
                            Perguntas Frequentes
                        </h2>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {FAQ_ITEMS.map((item, idx) => {
                            const isOpen = openIndex === idx;
                            return (
                                <div key={idx} className="group">
                                    <button
                                        onClick={() => toggleFaq(idx)}
                                        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/60 transition-colors"
                                    >
                                        <div
                                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
                                            style={{
                                                backgroundColor: isOpen ? '#c91e2515' : '#f4f4f4',
                                            }}
                                        >
                                            <item.icon
                                                size={16}
                                                className="transition-colors"
                                                style={{ color: isOpen ? '#c91e25' : '#9ca3af' }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold transition-colors ${isOpen ? 'text-gray-800' : 'text-gray-600'}`}>
                                                {item.question}
                                            </p>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">
                                                {item.category}
                                            </span>
                                        </div>
                                        <ChevronDown
                                            size={16}
                                            className={`text-gray-300 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`}
                                        />
                                    </button>

                                    {/* Answer Panel */}
                                    <div
                                        className="overflow-hidden transition-all duration-300 ease-in-out"
                                        style={{
                                            maxHeight: isOpen ? '500px' : '0',
                                            opacity: isOpen ? 1 : 0,
                                        }}
                                    >
                                        <div className="px-6 pb-5 pl-[4.25rem]">
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                {item.answer}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Contact Help ── */}
                <div className="bg-gradient-to-br from-secondary to-[#2e2c2b] rounded-2xl shadow-lg border border-gray-100 overflow-hidden p-8 text-center">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <LifeBuoy size={24} className="text-primary" />
                    </div>
                    <h3 className="text-white font-bold text-base mb-1.5">Ainda precisa de ajuda?</h3>
                    <p className="text-white/50 text-xs leading-relaxed max-w-sm mx-auto">
                        Se a sua dúvida não foi respondida, entre em contato com o administrador do sistema
                        para suporte adicional.
                    </p>
                </div>
            </div>
        </div>
    );
}
