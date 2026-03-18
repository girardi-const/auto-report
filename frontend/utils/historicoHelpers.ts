import { SavedReport, Section } from '../types';

export function calcReportTotal(report: SavedReport): number {
    const sectionTotal = report.sections.reduce((acc, s) => {
        const raw = s.products.reduce((a, p) => a + p.total, 0);
        return acc + raw * (1 - (s.section_discount || 0) / 100);
    }, 0);
    return sectionTotal;
}

export function savedToFrontendSections(report: SavedReport): Section[] {
    return report.sections.map((s) => ({
        id: crypto.randomUUID(),
        name: s.section_name,
        margin_section: s.section_margin || 0,
        discount: s.section_discount,
        products: s.products.map((p) => {
            // Reconstruct the original priceBase so that we can keep the true margin and discount
            const marginMult = 1 + (p.margin || 0) / 100;
            const discountMult = 1 - (p.discount || 0) / 100;
            const denom = marginMult * discountMult;
            const priceBase = denom === 0 ? 0 : p.price / denom;

            return {
                id: crypto.randomUUID(),
                code: p.product_id,
                brand: p.brand || '',
                name: p.product_name,
                units: p.quantity,
                priceBase,
                margin: p.margin || 0,
                discount: p.discount || 0,
                image: p.image_url ?? '',
            };
        }),
    }));
}

export function buildPayload(
    title: string,
    especificador: string,
    consultor: string,
    consultorPhone: string,
    cashDiscount: number,
    clientInfo: import('../types').ClientInfo,
    sections: Section[]
) {
    return {
        title,
        especificador,
        consultor,
        consultorPhone,
        cash_discount: cashDiscount,
        client_info: clientInfo,
        sections: sections.map((s) => ({
            section_name: s.name,
            section_margin: s.margin_section ?? 0,
            section_discount: s.discount ?? 0,
            products: s.products.map((p) => {
                const price = p.priceBase * (1 + (p.margin || 0) / 100) * (1 - (p.discount || 0) / 100);
                return {
                    product_name: p.name,
                    product_id: p.code || p.id,
                    brand: p.brand || '',
                    image_url: p.image ?? '',
                    price,
                    margin: p.margin ?? 0,
                    discount: p.discount ?? 0,
                    quantity: p.units,
                    total: price * p.units,
                };
            }),
        })),
    };
}
