import { StyleSheet } from '@react-pdf/renderer';

export const COLORS = {
    grayLight: '#f2f2f2',
    grayMed: '#cccccc',
    grayDark: '#666666',
    grayText: '#999999',
    black: '#000000',
    white: '#ffffff',
};

export const COL_WIDTHS = {
    qty: '6%',
    unit: '6%',
    desc: '38%',
    price: '16%',
    subtotal: '16%',
    image: '18%',
};

export const styles = StyleSheet.create({

    // ─── PAGE ──────────────────────────────────────────────────────
    page: {
        paddingTop: 14,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 40,
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },

    // ─── HEADER ────────────────────────────────────────────────────
    header: {
        marginBottom: 0,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    logo: {
        width: 220,
        height: 'auto',
    },
    companyInfo: {
        fontSize: 10,
        textAlign: 'right',
        lineHeight: 1.5,
        marginTop: 2,
    },
    companyInfoLine: {
        marginBottom: 1,
    },

    // ─── TITLE BLOCK ───────────────────────────────────────────────
    titleBlock: {
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 4,
    },
    titleMain: {
        fontSize: 9,
        fontFamily: 'Helvetica',
        letterSpacing: 2,
        marginBottom: 2,
    },
    titleSubtitleImage: {
        width: 160,
        height: 30,
        objectFit: 'contain',
    },

    // thin rule between title and orcamento bar
    hairline: {
        width: '100%',
        height: 0.4,
        backgroundColor: '#cccccc',
        marginTop: 6,
        marginBottom: 0,
    },

    // ─── "Orçamento de Venda" BAR ──────────────────────────────────
    orcamentoBar: {
        backgroundColor: '#f2f2f2',
        paddingVertical: 4,
        paddingLeft: 4,
        marginBottom: 8,
    },
    orcamentoBarText: {
        fontSize: 9,
        fontFamily: 'Helvetica',
        color: '#000000',
    },

    // ─── CLIENT INFO ───────────────────────────────────────────────
    clientBlock: {
        marginBottom: 8,
    },
    clientRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    clientRowRight: {
        flexDirection: 'row',
        marginBottom: 5,
        justifyContent: 'flex-end',
    },
    clientLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8.5,
        marginRight: 4,
    },
    clientValue: {
        fontFamily: 'Helvetica',
        fontSize: 8.5,
    },
    clientRowDual: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    clientLeft: {
        flexDirection: 'row',
        flex: 1,
    },
    clientRight: {
        flexDirection: 'row',
    },

    // ─── TABLE HEADER ──────────────────────────────────────────────
    tableHeader: {
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

    // ─── SECTION TITLE BAR ─────────────────────────────────────────
    sectionBar: {
        backgroundColor: '#f2f2f2',
        paddingVertical: 4,
        alignItems: 'center',
        marginTop: 2,
    },
    sectionBarText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        color: '#000000',
    },

    // ─── PRODUCT ROW ───────────────────────────────────────────────
    productRow: {
        flexDirection: 'row',
        minHeight: 90,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#f2f2f2',
        paddingVertical: 8,
        paddingLeft: 4,
    },
    productQty: {
        width: '6%',
        textAlign: 'center',
        fontSize: 8.5,
        fontFamily: 'Helvetica',
        color: '#000000',
    },
    productUnit: {
        width: '6%',
        textAlign: 'left',
        fontSize: 7.5,
        color: '#666666',
    },
    productDesc: {
        width: '38%',
        paddingLeft: 5,
        paddingRight: 4,
        fontSize: 7.5,
        textAlign: 'center',
        lineHeight: 1.5,
        color: '#000000',
        justifyContent: 'center',
    },
    productDescLine: {
        fontSize: 7.5,
        lineHeight: 1.5,
        color: '#000000',
    },
    productPriceCol: {
        width: '16%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 20,
        paddingRight: 4,
    },
    productPriceCurrency: {
        fontSize: 8,
        textAlign: 'center',
        color: '#000000',
    },
    productPriceValue: {
        fontSize: 8,
        color: '#000000',
        textAlign: 'center',
        flex: 1,
    },
    productSubtotalCol: {
        width: '16%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 22,
        paddingRight: 4,
    },
    productImageCol: {
        width: '18%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    productImage: {
        width: 65,
        height: 65,
        objectFit: 'contain',
    },

    // ─── TOTAL ROW ─────────────────────────────────────────────────
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
        paddingVertical: 8,
        paddingRight: 8,
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginRight: 24,
        textTransform: 'uppercase',
    },
    totalValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        minWidth: 80,
        textAlign: 'right',
    },

    // ─── FOOTER ────────────────────────────────────────────────────
    footer: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    footerSide: {
        width: '30%',
    },
    footerLine: {
        borderTopWidth: 0.5,
        borderTopColor: '#cccccc',
        paddingTop: 4,
    },
    footerLabel: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
    },
    footerLabelRight: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        textAlign: 'right',
    },
    footerDate: {
        fontSize: 8,
        textAlign: 'center',
        flex: 1,
    },

    // ─── TERMS PAGE ────────────────────────────────────────────────
    termsPage: {
        paddingTop: 40,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 60,
        fontSize: 8.5,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    termsLogo: {
        width: 220,
        height: 'auto',
        marginBottom: 28,
    },
    termsTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 18,
    },
    termsGreeting: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginBottom: 10,
    },
    termsPara: {
        fontSize: 8.5,
        lineHeight: 1.55,
        marginBottom: 6,
        color: '#000000',
    },
    termsParaBold: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        lineHeight: 1.55,
        marginBottom: 0,
        color: '#000000',
    },
    termsSectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    termsBullet: {
        fontSize: 8.5,
        lineHeight: 1.55,
        marginBottom: 4,
        color: '#000000',
    },
    termsValidity: {
        fontSize: 8.5,
        fontFamily: 'Helvetica-Bold',
        lineHeight: 1.55,
        marginTop: 12,
        marginBottom: 10,
        color: '#000000',
    },
    termsClosing: {
        fontSize: 8.5,
        lineHeight: 1.55,
        color: '#000000',
    },
    termsInlineRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 6,
        alignItems: 'flex-start',
    },
});