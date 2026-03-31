import React from 'react';
import {
    Document, Page, Text, View, Image, Font, StyleSheet
} from '@react-pdf/renderer';
import { styles as commonStyles } from '../utils/PDFStyles';
import { EditorDocument, EditorBlock, TextBlock, ImageBlock, TableBlock, SpacerBlock } from '../types/editor';

interface CustomPDFDocumentProps {
    documentData: EditorDocument;
    logoSrc?: string;
    subtitleSrc?: string;
}

const customStyles = StyleSheet.create({
    textBlock: {
        marginBottom: 8,
    },
    h1: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        color: '#111111',
    },
    h2: {
        fontSize: 14,
        fontFamily: 'Helvetica-Bold',
        color: '#333333',
    },
    p: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#444444',
        lineHeight: 1.4,
    },
    small: {
        fontSize: 8,
        fontFamily: 'Helvetica',
        color: '#666666',
    },
    bold: {
        fontFamily: 'Helvetica-Bold',
    },
    tableContainer: {
        width: '100%',
        marginVertical: 4,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f2f2f2',
        paddingVertical: 5,
        paddingLeft: 4,
        alignItems: 'center',
    },
    tableHeaderCell: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        minHeight: 30,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#f2f2f2',
        paddingVertical: 4,
        paddingLeft: 4,
    },
    tableCell: {
        fontSize: 7.5,
        fontFamily: 'Helvetica',
        color: '#000000',
        paddingHorizontal: 4,
        textAlign: 'center',
        lineHeight: 1.5,
    }
});

const CompanyInfo: React.FC = () => (
    <View style={commonStyles.companyInfo}>
        {[
            'Av. Nereu Ramos, 138 E - Centro',
            'Chapecó - SC, 89814-247',
            'CNPJ: 83.298.349/0001-89 - Inscr. Estadual: 250168162',
            'E-mail: girardicentro.drive@gmail.com',
            'Contato: (49) 3322-2509',
        ].map((line) => (
            <Text key={line} style={commonStyles.companyInfoLine}>{line}</Text>
        ))}
    </View>
);

const PageFooter: React.FC<{ date: string }> = ({ date }) => (
    <View style={commonStyles.footer} fixed>
        <View style={[commonStyles.footerSide, commonStyles.footerLine]}>
            <Text style={commonStyles.footerLabel}>CLIENTE</Text>
        </View>
        <Text style={commonStyles.footerDate}>{date}</Text>
        <View style={[commonStyles.footerSide, commonStyles.footerLine]}>
            <Text style={commonStyles.footerLabelRight}>CONSULTOR DE VENDAS</Text>
        </View>
    </View>
);

const TermItem = ({ bold, rest }: { bold: string; rest: string }) => (
    <Text style={commonStyles.termsBullet}>
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{bold}</Text>
        {rest}
    </Text>
);

const renderTextBlock = (block: TextBlock) => {
    return (
        <Text
            key={block.id}
            style={[
                customStyles.textBlock,
                customStyles[block.style],
                block.bold ? customStyles.bold : {},
                { textAlign: block.align }
            ]}
        >
            {block.content}
        </Text>
    );
};

const renderImageBlock = (block: ImageBlock) => {
    let flexAlign: 'flex-start' | 'center' | 'flex-end' = 'center';
    if (block.align === 'left') flexAlign = 'flex-start';
    if (block.align === 'right') flexAlign = 'flex-end';

    return (
        <View key={block.id} style={{ alignItems: flexAlign, marginVertical: 8, width: '100%' }}>
            {block.src ? (
                <Image src={block.src} style={{ width: `${block.width}%` }} />
            ) : (
                <View style={{ width: `${block.width}%`, height: 50, backgroundColor: '#f0f0f0' }} />
            )}
        </View>
    );
};

const renderTableBlock = (block: TableBlock) => {
    const colCount = block.headers.length;
    if (colCount === 0) return null;

    const defaultWidth = 100 / colCount;
    const getWidth = (idx: number) => block.columnWidths && block.columnWidths[idx] ? `${block.columnWidths[idx]}%` : `${defaultWidth}%`;

    return (
        <View key={block.id} style={customStyles.tableContainer}>
            <View style={customStyles.tableHeaderRow}>
                {block.headers.map((h, i) => (
                    <Text key={i} style={[customStyles.tableHeaderCell, { width: getWidth(i) }]}>{h}</Text>
                ))}
            </View>
            {block.rows.filter((r: string[]) => r.some(c => c.trim() !== '')).map((row, rIdx) => (
                <View key={rIdx} style={customStyles.tableRow} wrap={false}>
                    {row.map((cell, cIdx) => {
                        const isImage = cell.startsWith('data:image/') || cell.startsWith('http') || cell.startsWith('/api/');
                        return (
                            <View key={cIdx} style={[customStyles.tableCell, { width: getWidth(cIdx), justifyContent: 'center', alignItems: 'center' }]}>
                                {isImage ? (
                                    <Image src={cell} style={{ width: 40, height: 40, objectFit: 'contain' }} />
                                ) : (
                                    <Text>{cell}</Text>
                                )}
                            </View>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

const renderSpacerBlock = (block: SpacerBlock) => {
    return <View key={block.id} style={{ height: block.height, width: '100%' }} />;
};

const renderSectionBlock = (block: any) => {
    return (
        <View key={block.id} style={commonStyles.sectionBar}>
            <Text style={commonStyles.sectionBarText}>{block.title}</Text>
        </View>
    );
};

const renderSectionTotalBlock = (block: any) => {
    return (
        <View key={block.id} style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            backgroundColor: '#d4d4d4',
            paddingVertical: 4,
            paddingRight: 8,
            borderTopWidth: 0.5,
            borderTopColor: '#999999',
            marginTop: 0,
            gap: 16,
        }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
                {block.label} {block.value}
            </Text>
        </View>
    );
};

const renderGeneralTotalBlock = (block: any) => {
    return (
        <View key={block.id} style={{
            ...commonStyles.totalRow,
            paddingVertical: 4,
            marginTop: 0,
            gap: 3,
        }}>
            {block.items.map((item: any, idx: number) => (
                <View key={idx} style={commonStyles.totalItem}>
                    <Text style={commonStyles.totalLabel}>{item.label}</Text>
                    <Text style={commonStyles.totalValue}>{item.value}</Text>
                </View>
            ))}
        </View>
    );
};

export const CustomPDFDocument: React.FC<CustomPDFDocumentProps> = ({
    documentData,
    logoSrc = '/logo.png',
    subtitleSrc = '/extracted/text.png',
}) => {
    return (
        <Document>
            <Page size="A4" style={commonStyles.page}>
                <View style={commonStyles.header}>
                    <View style={commonStyles.headerTop}>
                        <Image src={logoSrc} style={commonStyles.logo} />
                        <CompanyInfo />
                    </View>

                    <View style={commonStyles.titleBlock}>
                        {subtitleSrc && (
                            <Image src={subtitleSrc} style={commonStyles.titleSubtitleImage} />
                        )}
                    </View>

                    <View style={commonStyles.hairline} />

                    {documentData.title && (
                        <View style={commonStyles.orcamentoBar}>
                            <Text style={commonStyles.orcamentoBarText}>{documentData.title}</Text>
                        </View>
                    )}
                </View>

                {/* ── BLOCKS RENDERING ── */}
                <View style={{ flex: 1, paddingBottom: 60 }}>
                    {documentData.blocks.map(block => {
                        switch (block.type) {
                            case 'text': return renderTextBlock(block);
                            case 'image': return renderImageBlock(block);
                            case 'table': return renderTableBlock(block as TableBlock);
                            case 'spacer': return renderSpacerBlock(block as SpacerBlock);
                            case 'section': return renderSectionBlock(block);
                            case 'section_total': return renderSectionTotalBlock(block);
                            case 'general_total': return renderGeneralTotalBlock(block);
                            default: return null;
                        }
                    })}
                    {/* ── PAYMENT TERMS STATIC ── */}
                    <View style={{
                        backgroundColor: '#efedeb',
                        paddingVertical: 10,
                        alignItems: 'center',
                        marginTop: 10,
                    }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333333', marginBottom: 3 }}>
                            *condição de pagamento à prazo em até 10x sem juros no cartão
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333333' }}>
                            *Sujeito à alterações de disponibilidade de estoque
                        </Text>
                    </View>
                </View>

                <PageFooter date={documentData.date || new Date().toLocaleDateString('pt-BR')} />
            </Page>

            {/* ── TERMS PAGE ────────────────────────────────────────────── */}
            <Page size="A4" style={commonStyles.termsPage}>
                <Image src={logoSrc} style={commonStyles.termsLogo} />
                <Text style={commonStyles.termsTitle}>TROCAS E DEVOLUÇÕES</Text>
                <Text style={commonStyles.termsGreeting}>Prezados clientes,</Text>
                <Text style={commonStyles.termsPara}>
                    Nosso compromisso é garantir sua satisfação e cumprir as normas do{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                        Código de Defesa do Consumidor (Lei n° 8.078/90)
                    </Text>
                    .
                </Text>
                <Text style={commonStyles.termsPara}>
                    Para isso, estabelecemos as seguintes condições para trocas e devoluções:
                </Text>
                <TermItem
                    bold="* Troca por defeito de fabricação: "
                    rest="Aceitamos trocas de produtos com defeito dentro do prazo de 90 dias para bens duráveis e 30 dias para bens não duráveis, conforme o artigo 26 do CDC."
                />
                <TermItem
                    bold="* Bens duráveis (90 dias de garantia legal): "
                    rest="eletrodomésticos, ferramentas elétricas, furadeiras, chuveiros, torneiras elétricas, luminárias, móveis, porcelanatos, revestimentos, cerâmicas, louças sanitárias, fechaduras, disjuntores, ventiladores, aquecedores, escadas e itens de iluminação."
                />
                <TermItem
                    bold="* Bens não duráveis (30 dias de garantia legal): "
                    rest="tintas, colas, adesivos, argamassas, rejuntes, lâmpadas, pilhas, baterias, produtos de vedação, materiais de limpeza, massas de acabamento, silicones e outros produtos de consumo imediato ou de curta duração. O produto será analisado e, caso seja constatado defeito, poderá ser consertado, trocado ou reembolsado."
                />
                <TermItem
                    bold="* Desistência da compra (compras online): "
                    rest="Conforme o artigo 49 do CDC, o cliente tem 7 dias corridos após o recebimento para desistir da compra e solicitar a devolução do produto sem custo adicional."
                />
                <TermItem
                    bold="* Produtos sem defeito: "
                    rest="A troca de produtos por motivo de arrependimento em compras presenciais não é obrigatória por lei, mas poderá ser realizada por cortesia da empresa no período de 15 (quinze) dias, desde que o produto esteja sem uso, na embalagem original e com a nota fiscal. Consulte nossas condições específicas."
                />

                <Text style={commonStyles.termsSectionTitle}>Não realizamos trocas de:</Text>
                {[
                    '* Produtos sem nota fiscal ou fora do prazo estabelecido;',
                    '* Produtos danificados por mau uso;',
                    '* Itens personalizados ou sob encomenda.',
                    '* Para solicitar trocas ou devoluções, entre em contato conosco através do nosso atendimento.',
                ].map((line) => (
                    <Text key={line} style={commonStyles.termsBullet}>{line}</Text>
                ))}

                <Text style={commonStyles.termsValidity}>
                    Orçamentos possuem validade de 07 dias, a partir da data de envio ou enquanto durar o estoque.
                </Text>

                <Text style={commonStyles.termsClosing}>
                    Agradecemos sua compreensão e estamos à disposição para melhor atendê-lo!
                </Text>

                <PageFooter date={documentData.date || new Date().toLocaleDateString('pt-BR')} />
            </Page>
        </Document>
    );
};
