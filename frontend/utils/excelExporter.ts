// npm install exceljs
// Remove the 'xlsx' import — this file uses exceljs for full style + image support.

import ExcelJS from 'exceljs';
import { Section, ClientInfo } from '../types';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
    darkBlue: 'FF1F3864',
    midBlue: 'FF2E5DA6',
    lightBlue: 'FFD6E4F0',
    sectionBg: 'FF263F5A',
    rowAlt: 'FFEBF3FB',
    white: 'FFFFFFFF',
    totalBg: 'FFFFF2CC',
    greenDark: 'FF1D6A3A',
    greenBg: 'FFD8F3DC',
    gray: 'FFF2F2F2',
    red: 'FFC00000',
};

const BRL = '"R$" #,##0.00';
const IMG_COL = 11;  // column K (1-indexed)
const IMG_ROW_H = 70;  // row height (px) when product has an image

interface ExportParams {
    especificador: string;
    consultor: string;
    sections: Section[];
    cashDiscount: number;
    clientInfo: ClientInfo;
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function fill(argb: string): ExcelJS.Fill {
    return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}
function bord(): Partial<ExcelJS.Borders> {
    const s: Partial<ExcelJS.Border> = { style: 'thin', color: { argb: 'FFAAAAAA' } };
    return { top: s, bottom: s, left: s, right: s };
}
function fnt(bold = false, color = 'FF000000', size = 10, italic = false): Partial<ExcelJS.Font> {
    return { name: 'Arial', bold, color: { argb: color }, size, italic };
}
function aln(horizontal: ExcelJS.Alignment['horizontal'] = 'left'): Partial<ExcelJS.Alignment> {
    return { horizontal, vertical: 'middle', wrapText: false };
}

function sc(
    cell: ExcelJS.Cell,
    opts: {
        value?: ExcelJS.CellValue;
        bold?: boolean;
        fc?: string;
        bg?: string;
        ha?: ExcelJS.Alignment['horizontal'];
        sz?: number;
        fmt?: string;
        italic?: boolean;
    } = {}
) {
    if (opts.value !== undefined) cell.value = opts.value;
    cell.font = fnt(opts.bold ?? false, opts.fc ?? 'FF000000', opts.sz ?? 10, opts.italic ?? false);
    if (opts.bg) cell.fill = fill(opts.bg);
    cell.alignment = aln(opts.ha ?? 'left');
    cell.border = bord();
    if (opts.fmt) cell.numFmt = opts.fmt;
}

function mergeStyle(
    ws: ExcelJS.Worksheet,
    row: number, startCol: number, endCol: number,
    opts: Parameters<typeof sc>[1] = {}
) {
    ws.mergeCells(row, startCol, row, endCol);
    sc(ws.getCell(row, startCol), opts);
    for (let c = startCol + 1; c <= endCol; c++) {
        ws.getCell(row, c).border = bord();
        if (opts.bg) ws.getCell(row, c).fill = fill(opts.bg);
    }
}

function spacer(ws: ExcelJS.Worksheet, row: number, h = 7) {
    ws.getRow(row).height = h;
    mergeStyle(ws, row, 1, 11, { bg: C.gray });
}

// ── Image fetch helper ────────────────────────────────────────────────────────
/**
 * Converts any image src (URL, relative path, or data URI) to base64.
 * Returns null on failure so the export never crashes — the cell just stays empty.
 */
async function fetchImageBase64(
    src: string
): Promise<{ base64: string; extension: 'jpeg' | 'png' | 'gif' } | null> {
    try {
        // Already a data URI (bmp excluded — ExcelJS does not support it)
        const match = src.match(/^data:image\/(jpeg|jpg|png|gif);base64,(.+)$/);
        if (match) {
            return {
                extension: (match[1] === 'jpg' ? 'jpeg' : match[1]) as 'jpeg' | 'png' | 'gif',
                base64: match[2],
            };
        }

        // Fetch remote/local URL → ArrayBuffer → base64
        const res = await fetch(src);
        if (!res.ok) return null;

        const blob = await res.blob();
        const rawExt = (blob.type.split('/')[1] ?? 'jpeg').replace('jpg', 'jpeg');
        // ExcelJS only accepts jpeg | png | gif — fall back to jpeg for anything else (e.g. bmp)
        const knownExts = ['jpeg', 'png', 'gif'] as const;
        const extension = (knownExts.includes(rawExt as typeof knownExts[number]) ? rawExt : 'jpeg') as 'jpeg' | 'png' | 'gif';

        const buf = await blob.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = '';
        // Process in chunks to avoid call-stack overflow on large images
        const CHUNK = 8192;
        for (let i = 0; i < bytes.byteLength; i += CHUNK) {
            binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
        }

        return { base64: btoa(binary), extension };
    } catch {
        return null;
    }
}

// ── Unit price ────────────────────────────────────────────────────────────────
function calcUnitPrice(p: { priceBase: number; margin: number; discount: number }) {
    return p.priceBase * (1 + (p.margin || 0) / 100) * (1 - (p.discount || 0) / 100);
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function generateExcel({
    especificador,
    consultor,
    sections,
    cashDiscount,
    clientInfo,
}: ExportParams): Promise<void> {

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Orçamento');

    [5, 7, 7, 40, 12, 14, 16, 16, 16, 16, 18].forEach((w, i) => {
        ws.getColumn(i + 1).width = w;
    });

    let r = 1;

    // ── Title ────────────────────────────────────────────────────────────────────
    ws.getRow(r).height = 32;
    mergeStyle(ws, r, 1, 11, {
        value: 'GIRARDI CASA & CONSTRUÇÃO — ORÇAMENTO DE VENDA',
        bold: true, fc: C.white, bg: C.darkBlue, ha: 'center', sz: 13,
    });
    r++;
    spacer(ws, r); r++;

    // ── Dados da Empresa ──────────────────────────────────────────────────────────
    ws.getRow(r).height = 22;
    mergeStyle(ws, r, 1, 11, { value: 'DADOS DA EMPRESA', bold: true, fc: C.white, bg: C.midBlue, ha: 'center', sz: 11 });
    r++;
    for (const [label, val] of [
        ['Endereço', 'Av. Nereu Ramos, 138 E - Centro, Chapecó - SC, 89814-247'],
        ['CNPJ', '83.298.349/0001-89 — Insc. Estadual: 250168162'],
        ['E-mail', 'girardicentro.drive@gmail.com'],
        ['Contato', '(49) 3322-2509'],
    ] as [string, string][]) {
        ws.getRow(r).height = 18;
        sc(ws.getCell(r, 1), { value: label, bold: true, bg: C.lightBlue });
        mergeStyle(ws, r, 2, 11, { value: val, bg: C.white });
        r++;
    }
    spacer(ws, r); r++;

    // ── Dados do Orçamento ────────────────────────────────────────────────────────
    ws.getRow(r).height = 22;
    mergeStyle(ws, r, 1, 11, { value: 'DADOS DO ORÇAMENTO', bold: true, fc: C.white, bg: C.midBlue, ha: 'center', sz: 11 });
    r++;

    ws.getRow(r).height = 18;
    sc(ws.getCell(r, 1), { value: 'Data', bold: true, bg: C.lightBlue });
    mergeStyle(ws, r, 2, 4, { value: new Date().toLocaleDateString('pt-BR'), bg: C.white });
    sc(ws.getCell(r, 5), { value: 'Especificador', bold: true, bg: C.lightBlue });
    mergeStyle(ws, r, 6, 11, { value: especificador || '-', bg: C.white });
    r++;

    ws.getRow(r).height = 18;
    sc(ws.getCell(r, 1), { value: 'Consultor', bold: true, bg: C.lightBlue });
    mergeStyle(ws, r, 2, 11, { value: consultor || '-', bg: C.white });
    r++;
    spacer(ws, r); r++;

    // ── Informações do Cliente ────────────────────────────────────────────────────
    ws.getRow(r).height = 22;
    mergeStyle(ws, r, 1, 11, { value: 'INFORMAÇÕES DO CLIENTE', bold: true, fc: C.white, bg: C.midBlue, ha: 'center', sz: 11 });
    r++;
    for (const [l1, v1, l2, v2] of [
        ['Nome', clientInfo.name || '-', 'Telefone', clientInfo.telefone || '-'],
    ] as [string, string, string, string][]) {
        ws.getRow(r).height = 18;
        sc(ws.getCell(r, 1), { value: l1, bold: true, bg: C.lightBlue });
        mergeStyle(ws, r, 2, 4, { value: v1, bg: C.white });
        sc(ws.getCell(r, 5), { value: l2, bold: true, bg: C.lightBlue });
        mergeStyle(ws, r, 6, 11, { value: v2, bg: C.white });
        r++;
    }
    spacer(ws, r); r++;


    // ── Column Headers ────────────────────────────────────────────────────────────
    ws.getRow(r).height = 22;
    ['#', 'QTDE', 'UN', 'PRODUTO', 'CÓDIGO', 'MARCA', 'DESC. PRODUTO', 'DESC. SEÇÃO', 'VALOR UNIT (R$)', 'SUB TOTAL (R$)', 'IMAGEM']
        .forEach((h, i) => sc(ws.getCell(r, i + 1), { value: h, bold: true, fc: C.white, bg: C.midBlue, ha: 'center', sz: 9 }));
    r++;

    // ── Sections & Products ───────────────────────────────────────────────────────
    const subtotalRows: number[] = [];
    let productCounter = 1;

    // Queue of images to embed after all rows are written
    const imageQueue: Array<{ src: string; row: number }> = [];

    for (const section of sections) {
        ws.getRow(r).height = 22;
        mergeStyle(ws, r, 1, 11, {
            value: `▌  SEÇÃO: ${section.name.toUpperCase()}`,
            bold: true, fc: C.white, bg: C.sectionBg, ha: 'left', sz: 10,
        });
        r++;

        const sectionStartRow = r;

        for (let pi = 0; pi < section.products.length; pi++) {
            const product = section.products[pi];
            const unitPrice = calcUnitPrice(product);
            const rowBg = pi % 2 === 0 ? C.white : C.rowAlt;
            const discProd = product.discount > 0 ? `${product.discount}%` : '—';
            const discSec = section.discount > 0 ? `${section.discount}%` : '—';

            // Taller row for products with an image
            ws.getRow(r).height = product.image ? IMG_ROW_H : 40;

            // Columns A–I
            [productCounter, product.units, 'UN', product.name,
                product.code || '-', product.brand || '-', discProd, discSec, unitPrice]
                .forEach((v, i) => {
                    sc(ws.getCell(r, i + 1), {
                        value: v as ExcelJS.CellValue,
                        bg: rowBg,
                        ha: [0, 1, 2, 4, 6, 7, 8].includes(i) ? 'center' : 'left',
                        fmt: i === 8 ? BRL : undefined,
                    });
                });

            // Column J — SUB TOTAL formula
            sc(ws.getCell(r, 10), {
                value: { formula: `B${r}*I${r}`, result: product.units * unitPrice } as ExcelJS.CellFormulaValue,
                bold: true, bg: rowBg, ha: 'center', fmt: BRL,
            });

            // Column K — styled empty; image floated over it after the loop
            sc(ws.getCell(r, IMG_COL), { bg: rowBg });
            if (product.image) {
                imageQueue.push({ src: product.image, row: r });
            }

            productCounter++;
            r++;
        }

        const sectionEndRow = r - 1;

        // Section footer
        ws.getRow(r).height = 20;
        const discLabel = section.discount > 0
            ? `Desconto da Seção (${section.name}): ${section.discount}%`
            : `Desconto da Seção (${section.name}): —`;
        mergeStyle(ws, r, 1, 8, { value: discLabel, bold: true, bg: C.lightBlue, ha: 'right', sz: 9 });
        sc(ws.getCell(r, 9), { value: 'Subtotal:', bold: true, bg: C.lightBlue, ha: 'right', sz: 9 });
        sc(ws.getCell(r, 10), {
            value: {
                formula: `SUM(J${sectionStartRow}:J${sectionEndRow})`,
                result: section.products.reduce((s, p) => s + calcUnitPrice(p) * p.units, 0),
            } as ExcelJS.CellFormulaValue,
            bold: true, bg: C.lightBlue, ha: 'center', fmt: BRL, sz: 9,
        });
        sc(ws.getCell(r, 11), { bg: C.lightBlue });
        subtotalRows.push(r);
        r++;

        spacer(ws, r); r++;
    }

    // ── Totals ────────────────────────────────────────────────────────────────────
    spacer(ws, r, 10); r++;

    const prazoResult = sections.reduce(
        (acc, s) => acc + s.products.reduce((a, p) => a + calcUnitPrice(p) * p.units, 0), 0
    );
    const prazoFormula = subtotalRows.map(sr => `J${sr}`).join('+');

    const totalPrazoRow = r;
    ws.getRow(r).height = 26;
    mergeStyle(ws, r, 1, 9, { value: 'TOTAL A PRAZO', bold: true, bg: C.totalBg, ha: 'right', sz: 11 });
    sc(ws.getCell(r, 10), {
        value: { formula: prazoFormula, result: prazoResult } as ExcelJS.CellFormulaValue,
        bold: true, bg: C.totalBg, ha: 'center', fmt: BRL, sz: 11,
    });
    sc(ws.getCell(r, 11), { bg: C.totalBg });
    r++;

    const totalDescRow = r;
    ws.getRow(r).height = 26;
    mergeStyle(ws, r, 1, 9, {
        value: `DESCONTO À VISTA (${cashDiscount}%)`,
        bold: true, fc: C.red, bg: C.lightBlue, ha: 'right', sz: 11,
    });
    sc(ws.getCell(r, 10), {
        value: cashDiscount > 0
            ? { formula: `-J${totalPrazoRow}*${cashDiscount / 100}`, result: -(prazoResult * cashDiscount / 100) } as ExcelJS.CellFormulaValue
            : 0,
        bold: true, fc: C.red, bg: C.lightBlue, ha: 'center', fmt: BRL, sz: 11,
    });
    sc(ws.getCell(r, 11), { bg: C.lightBlue });
    r++;

    ws.getRow(r).height = 28;
    mergeStyle(ws, r, 1, 9, { value: 'TOTAL À VISTA', bold: true, fc: C.greenDark, bg: C.greenBg, ha: 'right', sz: 12 });
    sc(ws.getCell(r, 10), {
        value: {
            formula: `J${totalPrazoRow}+J${totalDescRow}`,
            result: prazoResult * (1 - cashDiscount / 100),
        } as ExcelJS.CellFormulaValue,
        bold: true, fc: C.greenDark, bg: C.greenBg, ha: 'center', fmt: BRL, sz: 12,
    });
    sc(ws.getCell(r, 11), { bg: C.greenBg });
    r++;

    spacer(ws, r, 8); r++;
    ws.getRow(r).height = 16;
    mergeStyle(ws, r, 1, 11, {
        value: '* Pagamento à prazo: até 10x sem juros no cartão   |   * Sujeito a alterações de disponibilidade de estoque   |   * Validade: 07 dias',
        italic: true, fc: 'FF666666', bg: C.gray, ha: 'center', sz: 8,
    });

    // ── Embed images ──────────────────────────────────────────────────────────────
    // Fetch all images in parallel AFTER all rows are laid out so row indices are final
    const fetched = await Promise.all(
        imageQueue.map(async (item) => ({ ...item, data: await fetchImageBase64(item.src) }))
    );

    for (const { data, row: imgRow } of fetched) {
        if (!data) continue; // failed fetch → skip silently, cell stays empty

        const imageId = wb.addImage({ base64: data.base64, extension: data.extension });

        // tl is 0-indexed. Add small inset (0.1) for visual padding.
        // Image sized to fit inside the cell with 4px breathing room.
        ws.addImage(imageId, {
            tl: { col: IMG_COL - 1 + 0.15, row: imgRow - 1 + 0.1 } as any,
            br: { col: IMG_COL - 1 + 0.85, row: imgRow - 1 + 0.9 } as any,
        });
    }

    // ── Download ──────────────────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const clientName = clientInfo.name ? clientInfo.name.replace(/\s+/g, '_') : 'Cliente';
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `Orcamento_${clientName}_${dateStr}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
}