import mongoose, { Schema, Document } from 'mongoose';

export interface IClientInfo {
    name: string;
    telefone: string;
    email: string;
    razaoSocial: string;
    cnpj: string;
    inscricaoEstadual: string;
    endereco: string;
    bairro: string;
    cep: string;
    cidade: string;
    uf: string;
}

export interface IReport extends Document {
    title: string;
    especificador: string;
    consultor: string;
    cash_discount: number;
    client_info: IClientInfo;
    sections: {
        section_name: string;
        section_discount: number;
        products: {
            product_name: string;
            product_id: string;
            image_url: string;
            price: number;
            margin: number;
            discount: number;
            quantity: number;
            total: number;
        }[];
    }[];
    creator_id: string;
    timestamp: Date;
}

const ClientInfoSchema = new Schema<IClientInfo>(
    {
        name: { type: String, default: '' },
        telefone: { type: String, default: '' },
        email: { type: String, default: '' },
        razaoSocial: { type: String, default: '' },
        cnpj: { type: String, default: '' },
        inscricaoEstadual: { type: String, default: '' },
        endereco: { type: String, default: '' },
        bairro: { type: String, default: '' },
        cep: { type: String, default: '' },
        cidade: { type: String, default: '' },
        uf: { type: String, default: '' },
    },
    { _id: false }
);

const ReportSchema = new Schema<IReport>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        especificador: { type: String, default: '' },
        consultor: { type: String, default: '' },
        cash_discount: { type: Number, default: 0 },
        client_info: { type: ClientInfoSchema, default: () => ({}) },
        sections: [
            {
                _id: false,
                section_name: { type: String, required: true, trim: true },
                section_discount: { type: Number, required: true, default: 0 },
                products: [
                    {
                        _id: false,
                        product_name: { type: String, required: true, trim: true },
                        image_url: { type: String, default: '' },
                        product_id: { type: String, required: true },
                        price: { type: Number, required: true },
                        margin: { type: Number, required: true },
                        discount: { type: Number, required: true, default: 0 },
                        quantity: { type: Number, required: true },
                        total: { type: Number, required: true },
                    },
                ],
            },
        ],
        creator_id: {
            type: String,
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: false,
    }
);

ReportSchema.index({ timestamp: -1 });
ReportSchema.index({ title: 'text' });
ReportSchema.index({ creator_id: 1, timestamp: -1 });

export const Report = mongoose.model<IReport>('Report', ReportSchema);