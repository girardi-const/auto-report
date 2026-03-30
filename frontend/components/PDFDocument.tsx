import React from 'react';
import {
    Document, Page, Text, View, Image, Font,
} from '@react-pdf/renderer';
import { styles } from '../utils/PDFStyles';
import { getProxyImageUrl } from '@/utils/image';

// ─── Types ──────────────────────────────────────────────────────

export interface Product {
    id: string;
    name: string;
    code?: string;
    brand?: string;
    units: number;
    priceBase: number;
    margin: number;
    discount: number;
    image?: string;
    type?: string;
}

export interface Section {
    id: string;
    name: string;
    discount: number;
    products: Product[];
}

export interface ClientInfo {
    name: string;
    telefone: string;
}

export interface PDFDocumentProps {
    especificador: string;
    consultor: string;
    consultorPhone: string;
    clientInfo: ClientInfo;
    sections: Section[];
    totalValue: number;
    subtotalBeforeCash: number;
    cashDiscount: number;
    deliveryFee: number;
    logoSrc?: string; // base64 or URL for the Girardi logo
    subtitleSrc?: string; // base64 or URL for "o mesmo propósito" image
    date?: string; // e.g. "26/11/2025"
}

// ─── Helpers ────────────────────────────────────────────────────

const fmt = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const splitPrice = (value: number): [string, string] => {
    const full = fmt(value); // "R$ 1.349,90"
    const idx = full.indexOf(' ');
    return [full.slice(0, idx), full.slice(idx + 1)]; // ["R$", "1.349,90"]
};

const effectivePrice = (p: Product): number => {
    const withMargin = p.priceBase * (1 + p.margin / 100);
    return withMargin * (1 - (p.discount || 0) / 100);
};


// ─── Sub-components ─────────────────────────────────────────────

const CompanyInfo: React.FC = () => (
    <View style={styles.companyInfo}>
        {[
            'Av. Nereu Ramos, 138 E - Centro',
            'Chapecó - SC, 89814-247',
            'CNPJ: 83.298.349/0001-89 - Inscr. Estadual: 250168162',
            'E-mail: girardicentro.drive@gmail.com',
            'Contato: (49) 3322-2509',
        ].map((line) => (
            <Text key={line} style={styles.companyInfoLine}>{line}</Text>
        ))}
    </View>
);

const PageFooter: React.FC<{ date: string }> = ({ date }) => (
    <View style={styles.footer} fixed>
        <View style={[styles.footerSide, styles.footerLine]}>
            <Text style={styles.footerLabel}>CLIENTE</Text>
        </View>
        <Text style={styles.footerDate}>{date}</Text>
        <View style={[styles.footerSide, styles.footerLine]}>
            <Text style={styles.footerLabelRight}>CONSULTOR DE VENDAS</Text>
        </View>
    </View>
);

const TableColumnHeaders: React.FC = () => (
    <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, { width: '6%' }]}>Qtde.</Text>
        <Text style={[styles.tableHeaderCell, { width: '6%' }]}>{''}</Text>
        <Text style={[styles.tableHeaderCell, { width: '38%', textAlign: 'center' }]}>
            Descrição
        </Text>
        <Text style={[styles.tableHeaderCell, { width: '18%' }]}>Imagem</Text>
        <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Valor Und</Text>
        <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Sub Total</Text>
    </View>
);

const SectionHeader: React.FC<{ name: string }> = ({ name }) => (
    <View style={styles.sectionBar}>
        <Text style={styles.sectionBarText}>{name.toUpperCase()}</Text>
    </View>
);

const ProductRow: React.FC<{ product: Product }> = ({ product }) => {
    const price = effectivePrice(product);
    const subtotal = price * product.units;
    const [pCur, pVal] = splitPrice(price);
    const [sCur, sVal] = splitPrice(subtotal);
    const imgSrc = getProxyImageUrl(product.image);

    return (
        <View style={styles.productRow} wrap={false}>
            {/* Qty */}
            <Text style={styles.productQty}>{product.units}</Text>

            {/* Unit */}
            <Text style={styles.productUnit}>{
                product.type?.includes("MT") ? "MT²" : product.type
            }</Text>

            {/* Description */}
            <View style={styles.productDesc}>
                <Text style={styles.productDescLine}>{product.name}</Text>
                {product.code && (
                    <Text style={[styles.productDescLine, { color: '#999999', fontSize: 7 }]}>
                        {"Código: " + product.code}
                        {product.brand ? ` | Marca: ${product.brand}` : ''}
                        {product.discount > 0 ? ` | Desc: ${product.discount}%` : ''}
                    </Text>
                )}
            </View>

            {/* Image */}
            <View style={styles.productImageCol}>
                {imgSrc ? (
                    <Image src={imgSrc} style={styles.productImage} />
                ) : (
                    <View style={[styles.productImage, { backgroundColor: '#f9f9f9' }]} />
                )}
            </View>
            {/* Unit price */}
            <View style={styles.productPriceCol}>
                <Text style={styles.productPriceCurrency}>{pCur}0</Text>
            </View>

            {/* Subtotal */}
            <View style={styles.productSubtotalCol}>
                <Text style={styles.productPriceCurrency}>{sCur}0</Text>
            </View>

        </View>
    );
};

const TotalBlock: React.FC<{
    totalValue: number;
    subtotalBeforeCash: number;
    cashDiscount: number;
    deliveryFee: number;
    grossProductsTotal: number;
    allDiscountsAmount: number;
}> = ({ totalValue, subtotalBeforeCash, cashDiscount, deliveryFee, grossProductsTotal, allDiscountsAmount }) => (
    <View style={styles.totalRow}>
        <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>V. Produtos :</Text>
            <Text style={styles.totalValue}>{fmt(grossProductsTotal)}</Text>
        </View>

        <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>Taxa de Entrega :</Text>
            <Text style={styles.totalValue}>{fmt(deliveryFee)}</Text>
        </View>

        <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>V. Descontos :</Text>
            <Text style={styles.totalValue}>{fmt(allDiscountsAmount)}</Text>
        </View>

        <View style={styles.totalItem}>
            <Text style={styles.totalLabel}>V. Total :</Text>
            <Text style={styles.totalValue}>{fmt(subtotalBeforeCash + deliveryFee)}</Text>
        </View>

        {cashDiscount > 0 && (
            <>
                <View style={styles.totalItem}>
                    <Text style={styles.totalLabel}>Desconto à Vista ({cashDiscount}%) :</Text>
                    <Text style={styles.totalValue}>{fmt(subtotalBeforeCash * (cashDiscount / 100))}</Text>
                </View>

                <View style={styles.totalItem}>
                    <Text style={styles.totalLabel}>Total à Vista :</Text>
                    <Text style={styles.totalValue}>{fmt(totalValue)}</Text>
                </View>
            </>
        )}
    </View>
);

// ─── Terms page inline bold helper ──────────────────────────────
// @react-pdf/renderer supports nested <Text> for mixed bold/regular inline
const TermItem: React.FC<{ bold: string; rest: string }> = ({ bold, rest }) => (
    <Text style={styles.termsPara}>
        <Text style={{ fontFamily: 'Helvetica-Bold' }}>{bold}</Text>
        {rest}
    </Text>
);

// ─── Main Document ──────────────────────────────────────────────

export const ReportPDFDocument: React.FC<PDFDocumentProps> = ({
    especificador,
    consultor,
    consultorPhone,
    clientInfo,
    sections,
    totalValue,
    subtotalBeforeCash,
    cashDiscount,
    deliveryFee,
    logoSrc = '/logo.png',
    subtitleSrc = '/extracted/text.png',
    date = new Date().toLocaleDateString('pt-BR'),
}) => {
    const grossProductsTotal = sections.reduce((acc, section) => {
        return acc + section.products.reduce((prodAcc, p) => {
            const priceWithMargin = p.priceBase * (1 + (p.margin || 0) / 100);
            return prodAcc + (priceWithMargin * p.units);
        }, 0);
    }, 0);
    const allDiscountsAmount = grossProductsTotal - subtotalBeforeCash;

    return (
        <Document>

            {/* ── PRODUCT PAGES ─────────────────────────────────────────── */}
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Image src={logoSrc} style={styles.logo} />
                        <CompanyInfo />
                    </View>

                    {/* "UM NOVO CONCEITO / o mesmo propósito" */}
                    <View style={styles.titleBlock}>
                        {subtitleSrc && (
                            <Image src={subtitleSrc} style={styles.titleSubtitleImage} />
                        )}
                    </View>

                    <View style={styles.hairline} />

                    {/* Orçamento de Venda bar */}
                    <View style={styles.orcamentoBar}>
                        <Text style={styles.orcamentoBarText}>Orçamento de Venda</Text>
                    </View>

                    {/* Client info */}
                    <View style={styles.clientBlock}>
                        {/* Row 1: Cliente (left) + Celular (right) */}
                        <View style={styles.clientRowDual}>
                            <View style={styles.clientLeft}>
                                <Text style={styles.clientLabel}>Cliente:</Text>
                                <Text style={styles.clientValue}>{clientInfo.name}</Text>
                            </View>
                            <View style={styles.clientRight}>
                                <Text style={styles.clientLabel}>Celular:</Text>
                                <Text style={styles.clientValue}>{clientInfo.telefone}</Text>
                            </View>
                        </View>
                        {/* Row 2: Especificador */}
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>Especificador:</Text>
                            <Text style={styles.clientValue}>{especificador.toUpperCase()}</Text>
                        </View>
                        {/* Row 3: Consultor */}
                        <View style={styles.clientRow}>
                            <Text style={styles.clientLabel}>Consultor:</Text>
                            <Text style={styles.clientValue}>{consultor.toUpperCase()}{consultorPhone ? ` - ${consultorPhone}` : ''}</Text>
                        </View>
                    </View>
                </View>

                {/* Column headers — repeated on each new page via `fixed` */}
                <TableColumnHeaders />

                {/* Sections */}
                {sections.map((section) => (
                    <View key={section.id}>
                        <SectionHeader name={section.name} />

                        {section.products.map((product) => (
                            <ProductRow key={product.id} product={product} />
                        ))}

                        {(() => {
                            const sectionSubtotal = section.products.reduce((acc, p) => {
                                const withMargin = p.priceBase * (1 + (p.margin || 0) / 100);
                                const price = withMargin * (1 - (p.discount || 0) / 100);
                                return acc + (price * p.units);
                            }, 0);
                            
                            const sectionDiscountAmt = sectionSubtotal * ((section.discount || 0) / 100);
                            const sectionTotal = sectionSubtotal - sectionDiscountAmt;

                            return (
                                <View style={{
                                    flexDirection: 'row',
                                    justifyContent: 'flex-end',
                                    backgroundColor: '#d4d4d4',
                                    paddingVertical: 4,
                                    paddingRight: 8,
                                    borderTopWidth: 0.5,
                                    borderTopColor: '#999999',
                                    gap: 16,
                                }}>
                                    {section.discount > 0 && (
                                        <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
                                            Desconto ({section.discount}%): {fmt(sectionDiscountAmt)}
                                        </Text>
                                    )}
                                    <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold' }}>
                                        Total da Seção: {fmt(sectionTotal)}
                                    </Text>
                                </View>
                            );
                        })()}
                    </View>
                ))}

                {/* Total */}
                <TotalBlock
                    totalValue={totalValue}
                    subtotalBeforeCash={subtotalBeforeCash}
                    cashDiscount={cashDiscount}
                    deliveryFee={deliveryFee}
                    grossProductsTotal={grossProductsTotal}
                    allDiscountsAmount={allDiscountsAmount}
                />

                {/* Payment note */}
                <View style={{
                    backgroundColor: '#efede7',
                    paddingVertical: 10,
                    alignItems: 'center',
                    marginTop: 0,
                }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333333', marginBottom: 3 }}>
                        *condição de pagamento à prazo em até 10x sem juros no cartão
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#333333' }}>
                        *Sujeito à alterações de disponibilidade de estoque
                    </Text>
                </View>

                <PageFooter date={date} />
            </Page>

            {/* ── TERMS PAGE ────────────────────────────────────────────── */}
            <Page size="A4" style={styles.termsPage}>

                <Image src={logoSrc} style={styles.termsLogo} />

                <Text style={styles.termsTitle}>TROCAS E DEVOLUÇÕES</Text>

                <Text style={styles.termsGreeting}>Prezados clientes,</Text>

                <Text style={styles.termsPara}>
                    Nosso compromisso é garantir sua satisfação e cumprir as normas do{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>
                        Código de Defesa do Consumidor (Lei n° 8.078/90)
                    </Text>
                    .
                </Text>

                <Text style={styles.termsPara}>
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

                <Text style={styles.termsSectionTitle}>Não realizamos trocas de:</Text>

                {[
                    '* Produtos sem nota fiscal ou fora do prazo estabelecido;',
                    '* Produtos danificados por mau uso;',
                    '* Itens personalizados ou sob encomenda.',
                    '* Para solicitar trocas ou devoluções, entre em contato conosco através do nosso atendimento.',
                ].map((line) => (
                    <Text key={line} style={styles.termsBullet}>{line}</Text>
                ))}

                <Text style={styles.termsValidity}>
                    Orçamentos possuem validade de 07 dias, a partir da data de envio ou enquanto durar o estoque.
                </Text>

                <Text style={styles.termsClosing}>
                    Agradecemos sua compreensão e estamos à disposição para melhor atendê-lo!
                </Text>

                <PageFooter date={date} />
            </Page>

        </Document>
    );
};