import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { styles } from '../utils/PDFStyles';
import { PDFDocumentProps } from '@/types';


const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatDate = () => {
    return new Date().toLocaleDateString('pt-BR');
};



export const ReportPDFDocument: React.FC<PDFDocumentProps> = ({
    especificador,
    sections,
    consultor,
    totalValue,
    subtotalBeforeCash,
    cashDiscount,
    clientInfo
}) => {
    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header with Logo and Company Info */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <Image
                            src="/logo.png"
                            style={styles.logo}
                        />
                        <View style={styles.companyInfo}>
                            <Text style={styles.companyInfoText}>Av. Nereu Ramos, 138 E - Centro</Text>
                            <Text style={styles.companyInfoText}>Chapecó - SC, 89814-247</Text>
                            <Text style={styles.companyInfoText}>CNPJ: 83.298.349/0001-89 - Inscr. Estadual: 250168162</Text>
                            <Text style={styles.companyInfoText}>E-mail: girardicentro.drive@gmail.com</Text>
                            <Text style={styles.companyInfoText}>Contato: (49) 3322-2509</Text>
                        </View>
                    </View>

                    {/* Title */}
                    <View style={styles.titleSection}>
                        <Image src="/extracted/text.png" style={{ width: '40%', height: 'auto', marginBottom: 20, justifyContent: 'center', alignItems: 'center', alignSelf: 'center' }} />
                        <Text style={styles.separator}></Text>
                    </View>

                    {/* Green Header Bar */}
                    <View style={styles.sectionHeaderBar}>
                        <Text style={styles.sectionHeaderText}>Orçamento de Venda</Text>
                    </View>

                    {/* General Information */}
                    <View style={styles.clientInfo}>
                        <View style={styles.clientInfoRow}>
                            <Text style={styles.clientInfoLabel}>Especificador:</Text>
                            <Text style={styles.clientInfoValue}>{especificador}</Text>
                        </View>
                        <View style={styles.clientInfoRow}>
                            <Text style={styles.clientInfoLabel}>Consultor:</Text>
                            <Text style={styles.clientInfoValue}>{consultor}</Text>
                        </View>
                    </View>

                    {/* Client Information */}
                    <View style={{
                        marginTop: 10,
                        marginBottom: 10,
                        padding: 10,
                        backgroundColor: '#f9f9f9',
                        borderRadius: 4,
                        border: '1px solid #999999'
                    }}>
                        <Text style={{
                            fontSize: 10,
                            fontFamily: 'Helvetica-Bold',
                            marginBottom: 8,
                            textTransform: 'uppercase'
                        }}>
                            Informações do Cliente
                        </Text>

                        {/* Client Name and Contact */}
                        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>Nome:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.name || '-'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>Telefone:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.telefone || '-'}</Text>
                            </View>
                        </View>

                        {/* Email and Company */}
                        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>Email:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.email || '-'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>Razão Social:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.razaoSocial || '-'}</Text>
                            </View>
                        </View>

                        {/* CNPJ and State Registration */}
                        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>CNPJ:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.cnpj || '-'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>Inscrição Estadual:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.inscricaoEstadual || '-'}</Text>
                            </View>
                        </View>

                        {/* Address */}
                        <View style={{ flexDirection: 'row', marginBottom: 4 }}>
                            <View style={{ flex: 2 }}>
                                <Text style={styles.clientInfoLabel}>Endereço:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.endereco || '-'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>Bairro:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.bairro || '-'}</Text>
                            </View>
                        </View>

                        {/* City, State, and CEP */}
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>Cidade:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.cidade || '-'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>UF:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.uf || '-'}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clientInfoLabel}>CEP:</Text>
                                <Text style={styles.clientInfoValue}>{clientInfo.cep || '-'}</Text>
                            </View>
                        </View>
                    </View>


                    {/* Table Header */}

                </View>

                {/* Sections and Products */}
                {sections.map((section) => (
                    <View key={section.id} wrap={false}>
                        {/* Section Header Row */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { width: '6%' }]}>Qtde.</Text>
                            <Text style={[styles.tableHeaderCell, { width: '6%' }]}></Text>
                            <Text style={[styles.tableHeaderCell, { width: '40%', textAlign: 'left', paddingLeft: 8 }]}>
                                {section.name.toUpperCase()}
                            </Text>
                            <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Imagem</Text>
                            <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Valor Und</Text>
                            <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Sub Total</Text>
                        </View>

                        {/* Products */}
                        {section.products.map((product) => {
                            const priceWithMargin = product.priceBase + (product.priceBase * product.margin / 100);
                            const priceWithProductDiscount = priceWithMargin * (1 - (product.discount || 0) / 100);
                            const subtotal = priceWithProductDiscount * product.units;

                            return (
                                <View key={product.id} style={styles.productRow}>
                                    <Text style={styles.productQtde}>{product.units}</Text>
                                    <Text style={styles.productUnit}>UN</Text>
                                    <View style={styles.productDescription}>
                                        <Text style={styles.productDescriptionName}>
                                            {product.name}
                                        </Text>
                                        <Text style={styles.productDescriptionCode}>
                                            Código: {product.code} {product.brand ? `| Marca: ${product.brand}` : ''}
                                            {product.discount > 0 ? ` | Desconto: ${product.discount}%` : ''}
                                        </Text>
                                    </View>
                                    <View style={styles.productImage}>
                                        <Image
                                            src={product.image}
                                            style={styles.productImageImg}
                                        />
                                    </View>
                                    <Text style={styles.productPrice}>
                                        {formatCurrency(priceWithProductDiscount)}
                                    </Text>
                                    <Text style={styles.productSubtotal}>
                                        {formatCurrency(subtotal)}
                                    </Text>
                                </View>
                            );
                        })}

                        {/* Section Discount Display */}
                        {section.discount > 0 && (
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'flex-end',
                                paddingRight: 10,
                                paddingTop: 5,
                                paddingBottom: 5,
                                backgroundColor: '#d4d4d4',
                                borderTop: '1px solid #999999'
                            }}>
                                <Text style={{
                                    fontSize: 9,
                                    color: 'black',
                                    fontFamily: 'Helvetica-Bold'
                                }}>
                                    Desconto da Seção ({section.name}): {section.discount}%
                                </Text>
                            </View>
                        )}

                    </View>
                ))}

                {/* Total Section */}
                <View style={styles.totalRow}>
                    {cashDiscount > 0 && (
                        <>
                            <View style={styles.totalItem}>
                                <Text style={styles.totalLabel}>Total a Prazo:</Text>
                                <Text style={styles.totalValue}>{formatCurrency(subtotalBeforeCash)}</Text>
                            </View>
                            <View style={styles.totalItem}>
                                <Text style={styles.totalLabel}>Desconto à Vista ({cashDiscount}%):</Text>
                                <Text style={styles.totalValue}>-{formatCurrency(subtotalBeforeCash * (cashDiscount / 100))}</Text>
                            </View>
                        </>
                    )}
                    <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>Total a Vista:</Text>
                        <Text style={styles.totalValue}>{formatCurrency(totalValue)}</Text>
                    </View>
                </View>

                <View style={[styles.grayBar, { marginTop: 15 }]} />
                {/* Attention Section */}
                <View style={styles.paymentTermsSection}>
                    <Text style={styles.paymentTermsText}>*condição de pagamento à prazo em até 10x sem juros no cartão</Text>
                    <Text style={styles.stockNote}>*Sujeito à alterações de disponibilidade de estoque</Text>
                </View>
                <View style={styles.grayBar} />

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <View style={styles.footerSection}>
                        <Text style={styles.footerLabel}>CLIENTE</Text>
                    </View>
                    <View style={styles.footerDate}>
                        <Text>{formatDate()}</Text>
                    </View>
                    <View style={[styles.footerSection, { textAlign: 'right' }]}>
                        <Text style={styles.footerLabel}>CONSULTOR DE VENDAS</Text>
                    </View>
                </View>
            </Page>

            {/* Terms and Conditions Page */}
            <Page size="A4" style={styles.termsPage}>
                {/* Logo */}
                <View style={styles.termsHeader}>
                    <Image
                        src="/logo.png"
                        style={styles.termsLogo}
                    />
                </View>

                {/* Title */}
                <View style={styles.termsTitle}>
                    <Text>TROCAS E DEVOLUÇÕES</Text>
                </View>

                {/* Content */}
                <Text style={styles.termsGreeting}>Prezados clientes,</Text>

                <Text style={styles.termsIntro}>
                    Nosso compromisso é garantir sua satisfação e cumprir as normas do Código de Defesa do Consumidor (Lei n° 8.078/90).
                </Text>

                <Text style={styles.termsParagraph}>
                    Para isso, estabelecemos as seguintes condições para trocas e devoluções:
                </Text>

                <Text style={styles.termsBullet}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>* Troca por defeito de fabricação:</Text> Aceitamos trocas de produtos com defeito dentro do prazo de 90 dias para bens duráveis e 30 dias para bens não duráveis, conforme o artigo 26 do CDC.
                </Text>

                <Text style={styles.termsSubBullet}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>* Bens duráveis (90 dias de garantia legal):</Text> eletrodomésticos, ferramentas elétricas, furadeiras, chuveiros, torneiras elétricas, luminárias, móveis, porcelanatos, revestimentos, cerâmicas, louças sanitárias, fechaduras, disjuntores, ventiladores, aquecedores, escadas e itens de iluminação.
                </Text>

                <Text style={styles.termsSubBullet}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>* Bens não duráveis (30 dias de garantia legal):</Text> tintas, colas, adesivos, argamassas, rejuntes, lâmpadas, pilhas, baterias, produtos de vedação, materiais de limpeza, massas de acabamento, silicones e outros produtos de consumo imediato ou de curta duração. O produto será analisado e, caso seja constatado defeito, poderá ser consertado, trocado ou reembolsado.
                </Text>

                <Text style={styles.termsBullet}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>* Desistência da compra (compras online):</Text> Conforme o artigo 49 do CDC, o cliente tem 7 dias corridos após o recebimento para desistir da compra e solicitar a devolução do produto sem custo adicional.
                </Text>

                <Text style={styles.termsBullet}>
                    <Text style={{ fontFamily: 'Helvetica-Bold' }}>* Produtos sem defeito:</Text> A troca de produtos por motivo de arrependimento em compras presenciais não é obrigatória por lei, mas poderá ser realizada por cortesia da empresa no período de 15 (quinze) dias, desde que o produto esteja sem uso, na embalagem original e com a nota fiscal. Consulte nossas condições específicas.
                </Text>

                <Text style={styles.termsNoExchange}>Não realizamos trocas de:</Text>

                <Text style={styles.termsBullet}>
                    * Produtos sem nota fiscal ou fora do prazo estabelecido;
                </Text>

                <Text style={styles.termsBullet}>
                    * Produtos danificados por mau uso;
                </Text>

                <Text style={styles.termsBullet}>
                    * Itens personalizados ou sob encomenda.
                </Text>

                <Text style={styles.termsBullet}>
                    * Para solicitar trocas ou devoluções, entre em contato conosco através do nosso atendimento.
                </Text>

                <Text style={styles.termsValidity}>
                    Orçamentos possuem validade de 07 dias, a partir da data de envio ou enquanto durar o estoque.
                </Text>

                <Text style={styles.termsClosing}>
                    Agradecemos sua compreensão e estamos à disposição para melhor atendê-lo!
                </Text>

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <View style={styles.footerSection}>
                        <Text style={styles.footerLabel}>CLIENTE</Text>
                    </View>
                    <View style={styles.footerDate}>
                        <Text>{formatDate()}</Text>
                    </View>
                    <View style={[styles.footerSection, { textAlign: 'right' }]}>
                        <Text style={styles.footerLabel}>CONSULTOR DE VENDAS</Text>
                    </View>
                </View>
            </Page>
        </Document>
    );
};
