// PDF Styles matching the reference PDF design
import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
    // Page styles
    page: {
        paddingTop: 40,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 70, // Increased to prevent footer overlap
        fontSize: 10,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },

    separator: {
        width: '100%',
        height: 1,
        backgroundColor: '#f2f2f2',
    },

    // Header styles
    header: {
        marginBottom: 20,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    logo: {
        width: 180,
        height: 'auto',
    },
    companyInfo: {
        fontSize: 8,
        textAlign: 'right',
        lineHeight: 1.4,
    },
    companyInfoText: {
        marginBottom: 2,
        fontWeight: 'medium',
    },

    // Title section
    titleSection: {
        marginTop: 15,
        marginBottom: 15,
        textAlign: 'center',
    },
    titleMain: {
        fontSize: 11,
        fontFamily: 'Helvetica',
        letterSpacing: 2,
        marginBottom: 3,
    },
    titleSubtitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Oblique',
        color: '#666666',
    },

    // Green header bar
    sectionHeaderBar: {
        backgroundColor: '#f2f2f2',
        padding: 6,
        marginBottom: 15,
        textAlign: 'left',
    },
    sectionHeaderText: {
        fontSize: 10,
        fontFamily: 'Helvetica',
        color: '#000000',
    },

    // Client info section
    clientInfo: {
        marginBottom: 15,
        fontSize: 9,
    },
    clientInfoRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    clientInfoLabel: {
        fontFamily: 'Helvetica-Bold',
        marginRight: 5,
    },
    clientInfoValue: {
        fontFamily: 'Helvetica',
    },

    // Table header
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f2f2f2',
        padding: 8,
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        borderBottom: '1 solid #e0e0e0',
    },
    tableHeaderCell: {
        textAlign: 'center',
        textTransform: 'uppercase',
    },

    // Section title (e.g., "COZINHA")
    sectionTitle: {
        backgroundColor: '#f2f2f2',
        padding: 6,
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 5,
    },

    // Product row
    productRow: {
        flexDirection: 'row',
        padding: 10,
        borderBottom: '0.5 solid #f2f2f2',
        minHeight: 80,
        alignItems: 'center',
    },
    productQtde: {
        width: '6%',
        textAlign: 'center',
        fontSize: 9,
    },
    productUnit: {
        width: '6%',
        textAlign: 'center',
        fontSize: 8,
    },
    productDescription: {
        width: '40%',
        paddingHorizontal: 8,
        fontSize: 8,
        lineHeight: 1.3,
    },
    productDescriptionBrand: {
        fontSize: 7,
        color: '#666666',
        marginBottom: 2,
    },
    productDescriptionName: {
        fontSize: 8,
        marginBottom: 2,
    },
    productDescriptionCode: {
        fontSize: 7,
        color: '#999999',
    },
    productPrice: {
        width: '16%',
        textAlign: 'right',
        fontSize: 9,
        paddingRight: 5,
    },
    productSubtotal: {
        width: '16%',
        textAlign: 'right',
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        paddingRight: 5,
    },
    productImage: {
        width: '16%',
        textAlign: 'center',
        paddingHorizontal: 5,
    },
    productImageImg: {
        width: 60,
        height: 45,
        objectFit: 'contain',
    },

    // Footer
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: 10,
        fontSize: 8,
    },
    footerSection: {
        width: '30%',
    },
    footerLabel: {
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        borderTop: '1 solid #CCCCCC',
        paddingTop: 5,
        fontSize: 7,
    },
    footerDate: {
        width: '40%',
        textAlign: 'center',
        borderTop: "none"
    },

    // Total section
    totalRow: {
        flexDirection: 'column',
        alignItems: 'flex-end',
        backgroundColor: '#f2f2f2',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginTop: 10,
        marginBottom: 0,
    },
    totalItem: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 4,
    },
    totalLabel: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginRight: 20,
        textTransform: 'uppercase',
    },
    totalValue: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
    },
    paymentTermsSection: {
        marginTop: 0,
        marginBottom: 0,
        backgroundColor: '#efede7',
        paddingVertical: 15,
        alignItems: 'center',
    },
    paymentTermsText: {
        fontSize: 8,
        color: '#333333',
        marginBottom: 4,
    },
    stockNote: {
        fontSize: 8,
        color: '#333333',
    },
    grayBar: {
        height: 10,
        backgroundColor: '#f2f2f2',
        width: '100%',
    },

    // Terms and Conditions Page
    termsPage: {
        paddingTop: 40,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 70, // Increased to prevent footer overlap
        fontSize: 9,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
    },
    termsHeader: {
        marginBottom: 20,
    },
    termsLogo: {
        width: 180,
        height: 'auto',
        marginBottom: 20,
    },
    termsTitle: {
        paddingVertical: 10,
        paddingLeft: 0,
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        textAlign: 'left',
        marginBottom: 15,
    },
    termsGreeting: {
        fontSize: 9,
        marginBottom: 10,
        lineHeight: 1.5,
        textAlign: 'left',
        fontFamily: 'Helvetica-Bold',
    },
    termsIntro: {
        fontSize: 9,
        marginBottom: 15,
        lineHeight: 1.5,
        textAlign: 'left',
    },
    termsSectionTitle: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginTop: 10,
        marginBottom: 5,
        lineHeight: 1.5,
    },
    termsParagraph: {
        fontSize: 9,
        marginBottom: 8,
        lineHeight: 1.5,
        textAlign: 'left',
    },
    termsBullet: {
        fontSize: 9,
        marginBottom: 6,
        lineHeight: 1.5,
        textAlign: 'left',
    },
    termsSubBullet: {
        fontSize: 9,
        marginBottom: 4,
        lineHeight: 1.5,
        textAlign: 'left',
    },
    termsNoExchange: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginTop: 10,
        marginBottom: 5,
        textAlign: 'left',
    },
    termsValidity: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        marginTop: 15,
        marginBottom: 10,
        lineHeight: 1.5,
        textAlign: 'left',
    },
    termsClosing: {
        fontSize: 9,
        marginTop: 10,
        lineHeight: 1.5,
        textAlign: 'left',
    },

    // Spacing utilities
    spacer: {
        height: 15,
    },
});
