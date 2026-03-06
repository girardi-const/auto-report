import { Brand } from "../models/Brand";

export const deleteAllBrands = async () => {
    await Brand.deleteMany({});
}