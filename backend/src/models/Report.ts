import mongoose, { Schema, Document } from 'mongoose';

export interface IClientInfo {
    name: string;
    telefone: string;
}

export interface IReport extends Document {
    title: string;
    especificador: string;
    consultor: string;
    consultorPhone: string;
    cash_discount: number;
    delivery_value?: number;
    client_info: IClientInfo;
    sections: {
        section_name: string;
        section_margin: number;
        section_discount: number;
        products: {
            product_name: string;
            product_id: string;
            brand: string;
            image_url: string;
            price: number;
            margin: number;
            discount: number;
            quantity: number;
            total: number;
        }[];
    }[];
    creator_id: string;
    creator_name: string;
    timestamp: Date;
}

const ClientInfoSchema = new Schema<IClientInfo>(
    {
        name: { type: String, default: '' },
        telefone: { type: String, default: '' },
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
        consultorPhone: { type: String, default: '' },
        cash_discount: { type: Number, default: 0 },
        delivery_value: { type: Number, default: 0 },
        client_info: { type: ClientInfoSchema, default: () => ({}) },
        sections: [
            {
                _id: false,
                section_name: { type: String, required: true, trim: true },
                section_margin: { type: Number, required: true, default: 0 },
                section_discount: { type: Number, required: true, default: 0 },
                products: [
                    {
                        _id: false,
                        product_name: { type: String, required: true, trim: true },
                        brand: { type: String, default: '' },
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
        creator_name: {
            type: String,
            default: 'Usuário desconhecido',
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