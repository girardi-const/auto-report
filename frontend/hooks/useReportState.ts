// hooks/useReportState.ts
import { useState, useRef } from "react";
import { Product, Section, ClientInfo } from "../types"; // Importe suas interfaces aqui

export function useReportState(initialState?: any) {
    const [especificador, setEspecificador] = useState(initialState?.especificador || "");
    const [contact, setContact] = useState(initialState?.contact || "");
    const [consultor, setConsultor] = useState(initialState?.consultor || "");
    const [consultorPhone, setConsultorPhone] = useState(initialState?.consultorPhone || "");
    const [sections, setSections] = useState<Section[]>(initialState?.sections || []);
    const [cashDiscount, setCashDiscount] = useState(initialState?.cashDiscount || 0);
    const [loading, setLoading] = useState<string | null>(null);
    const timers = useRef<Record<string, NodeJS.Timeout>>({});

    // Client Info State
    const [clientInfo, setClientInfo] = useState<ClientInfo>(initialState?.clientInfo || {
        name: "",
        telefone: "",
    });

    const updateClientInfo = (field: keyof ClientInfo, value: string) => {
        setClientInfo(prev => ({ ...prev, [field]: value }));
    };

    const clearClientInfo = () => {
        setClientInfo({
            name: "",
            telefone: "",
        });
    };

    const addSection = () => {
        const newSection: Section = {
            id: crypto.randomUUID(),
            name: `Nova Seção ${sections.length + 1}`,
            margin_section: 0,
            discount: 0,
            products: [],
        };
        setSections(prev => [...prev, newSection]);
    };

    const removeSection = (id: string) => {
        setSections(prev => prev.filter(s => s.id !== id));
    };

    const updateSectionName = (id: string, name: string) => {
        setSections(prev => prev.map(s => s.id === id ? { ...s, name } : s));
    };

    const updateSectionMargin = (id: string, margin: number) => {
        setSections(prev => prev.map(s => s.id === id ? { 
            ...s, 
            margin_section: margin,
            products: s.products.map(p => ({ ...p, margin }))
        } : s));
    };

    const addProduct = (sectionId: string) => {
        const newProduct: Product = {
            id: crypto.randomUUID(),
            code: "",
            brand: "",
            name: "Digite um código...",
            units: 1,
            margin: 0,
            discount: 0,
            priceBase: 0,
            image: "",
        };
        setSections(prev => prev.map(s =>
            s.id === sectionId ? { ...s, products: [...s.products, { ...newProduct, margin: s.margin_section || 0 }] } : s
        ));
    };

    const removeProduct = (sectionId: string, productId: string) => {
        setSections(prev => prev.map(s =>
            s.id === sectionId ? { ...s, products: s.products.filter(p => p.id !== productId) } : s
        ));
    };

    const updateProduct = (sectionId: string, productId: string, updates: Partial<Product>) => {
        setSections(prev => prev.map(s => {
            if (s.id !== sectionId) return s;
            return {
                ...s,
                products: s.products.map(p => p.id === productId ? { ...p, ...updates } : p)
            };
        }));
    };

    const calculateSubtotal = (products: Product[], sectionDiscount: number = 0) => {
        const total = products.reduce((acc, p) => {
            const priceWithMargin = p.priceBase * (1 + (p.margin || 0) / 100);
            const priceWithDiscount = priceWithMargin * (1 - (p.discount || 0) / 100);
            return acc + (priceWithDiscount * p.units);
        }, 0);
        return total * (1 - (sectionDiscount || 0) / 100);
    };

    return {
        state: { especificador, contact, consultor, consultorPhone, sections, cashDiscount, loading, clientInfo },
        actions: {
            setEspecificador, setContact, setConsultor, setConsultorPhone,
            setSections, setCashDiscount, addSection, addProduct, updateProduct,
            updateSectionMargin,
            removeSection, removeProduct, updateSectionName, updateClientInfo, clearClientInfo
        },
        utils: { calculateSubtotal, timers, setLoading }
    };
}