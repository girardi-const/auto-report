export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextStyle = 'h1' | 'h2' | 'p' | 'small';

export interface BaseBlock {
    id: string;
}

export interface TextBlock extends BaseBlock {
    type: 'text';
    content: string;
    style: TextStyle;
    align: TextAlignment;
    bold: boolean;
}

export interface ImageBlock extends BaseBlock {
    type: 'image';
    src: string; // base64 or URL
    width: number; // percentage or pixels
    align: TextAlignment;
}

export interface TableBlock extends BaseBlock {
    type: 'table';
    headers: string[];
    rows: string[][];
    columnWidths?: number[]; // Percentages
}

export interface SpacerBlock extends BaseBlock {
    type: 'spacer';
    height: number; // in pt
}

export interface SectionBlock extends BaseBlock {
    type: 'section';
    title: string;
}

export interface SectionTotalBlock extends BaseBlock {
    type: 'section_total';
    label: string;
    value: string;
}

export interface GeneralTotalBlock extends BaseBlock {
    type: 'general_total';
    items: Array<{ label: string; value: string }>;
}

export type EditorBlock = TextBlock | ImageBlock | TableBlock | SpacerBlock | SectionBlock | SectionTotalBlock | GeneralTotalBlock;

export interface EditorDocument {
    title: string;
    date: string;
    clientName: string;
    blocks: EditorBlock[];
}
