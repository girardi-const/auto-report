export const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
};

export const formatPriceInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const numberValue = Number(digits) / 100;
    return numberValue.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

export const parseLocaleNumber = (value: string) => {
    return Number(value.replace(/\./g, "").replace(",", "."));
};

export const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatInscricaoEstadual = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 12);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}.${digits.slice(9)}`;
};