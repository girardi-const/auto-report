export interface ClientInfo {
    name: string;
    telefone: string;
}

export interface Product {
    id: string;
    code: string;
    brand: string;
    name: string;
    units: number;
    margin: number;
    discount: number;
    priceBase: number;
    image: string;
}

export interface Section {
    id: string;
    name: string;
    discount: number;
    products: Product[];
}

export interface PDFDocumentProps {
    especificador: string;
    contact: string;
    sections: Section[];
    consultor: string;
    totalValue: number;
    subtotalBeforeCash: number;
    cashDiscount: number;
    clientInfo: ClientInfo;
}

export interface CatalogProduct {
    _id: string;
    product_code: string;
    brand_name: string;
    imageurl: string;
    description: string;
    base_price: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface EditModalProps {
    product: CatalogProduct;
    onClose: () => void;
    onSaved: () => void;
    getIdToken: () => Promise<string>;
}
export interface ProductRowProps {
    product: Product;
    sectionId: string;
    brands: string[];
    isLoading: boolean;
    onUpdate: (updates: Partial<Product>) => void;
    onRemove: () => void;
    onCodeChange: (code: string) => void;
}

export interface SectionCardProps {
    section: Section;
    brands: string[];
    loadingProductId: string | null;
    actions: {
        updateSectionName: (id: string, name: string) => void;
        removeSection: (id: string) => void;
        updateProduct: (sectionId: string, productId: string, updates: Partial<Product>) => void;
        removeProduct: (sectionId: string, productId: string) => void;
        addProduct: (sectionId: string) => void;
        updateSectionDiscount: (id: string, discount: number) => void;
    };
    utils: {
        calculateSubtotal: (products: Product[], discount: number) => number;
    };
    onProductCodeChange: (sectionId: string, productId: string, code: string) => void;
}

export interface ProductTableProps {
    products: Product[];
    sectionId: string;
    brands: string[];
    loadingProductId: string | null;
    onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
    onRemoveProduct: (productId: string) => void;
    onAddProduct: () => void;
    onProductCodeChange: (productId: string, code: string) => void;
}

// ── Saved Report (matches backend IReport schema) ────────────────────────────
export interface SavedReportProduct {
    product_name: string;
    product_id: string;
    brand?: string;
    image_url?: string;
    price: number;
    margin: number;
    discount: number;
    quantity: number;
    total: number;
}

export interface SavedReportSection {
    section_name: string;
    section_discount: number;
    products: SavedReportProduct[];
}

export interface SavedReport {
    _id: string;
    title: string;
    creator_name: string;
    especificador?: string;
    consultor?: string;
    cash_discount?: number;
    client_info?: ClientInfo;
    sections: SavedReportSection[];
    creator_id: string;
    timestamp: string;
}

export interface ImageUploadProps {
    image: File | null;
    previewUrl: string | null;
    onImageChange: (file: File | null) => void;
}
