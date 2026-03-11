import { Product, IProduct } from '../models/Product';
import { logger } from '../utils/logger';
import cloudinary from '../config/cloudinary';

// Removed naive server-side cache for scalability

/**
 * Product Service
 * Handles business logic for products, including external API integration
 */
export class ProductService {
    /**
     * Get a product by its code
     * Logic: Check database first, if not found, fetch from external API and save to DB
     */
    static async getProductByCode(code: string): Promise<IProduct | null> {
        const uppercaseCode = code.toUpperCase().trim();

        // 1. Check Database
        let product = await Product.findOne({ product_code: uppercaseCode });

        if (product) {
            logger.info(`Product ${uppercaseCode} found in database`);
            return product;
        }

        // 2. Fetch from External API (if not found in DB)
        logger.info(`Product ${uppercaseCode} not found in database, fetching from external API...`);
        const externalData = await this.fetchFromExternalApi(uppercaseCode);

        if (externalData) {
            // 3. Save to Database for future use
            product = new Product({
                product_code: uppercaseCode,
                description: externalData.description || '',
                brand_name: externalData.brand_name || 'UNKNOWN',
                imageurl: externalData.imageurl || '',
                base_price: externalData.base_price || 0,
                externalId: externalData.externalId,
            });

            await product.save();
            logger.info(`Product ${uppercaseCode} fetched from external API and saved to database`);
            return product;
        }

        return null;
    }

    /**
     * Simulated External API Fetch
     * In a real scenario, this would call an actual external service
     */
    private static async fetchFromExternalApi(code: string): Promise<Partial<IProduct> | null> {
        // Mocking an external API response
        // In the future, this will use config.externalApis.productApi

        logger.info(`Simulating external API call for code: ${code}`);

        // For demonstration purposes, let's return some mock data for specific codes
        // or just return null to simulate "not found anywhere"

        // Example mock data:
        if (code.startsWith('TEST')) {
            return {
                product_code: code,
                brand_name: 'MOCK BRAND',
                imageurl: 'https://via.placeholder.com/150',
                base_price: 99.99,
                externalId: `ext_${code}`,
            };
        }

        return null;
    }

    /**
     * List products from the database with pagination and filters.
     */
    static async listProducts(
        query: { search?: string; brand?: string; page: number; limit: number; sortBy: string; sortOrder: 'asc' | 'desc' }
    ): Promise<{ data: IProduct[]; total: number; page: number; totalPages: number }> {
        const { search, brand, page, limit, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as Record<string, 1 | -1>;

        const filter: Record<string, any> = {};

        if (search) {
            filter.$or = [
                { product_code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        if (brand) {
            filter.brand_name = brand;
        }

        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter).sort(sort).skip(skip).limit(limit)
        ]);

        return {
            data: products as unknown as IProduct[],
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }


    /**
     * Create a product manually
     */
    static async createProduct(data: Partial<IProduct>) {
        const product = new Product(data);
        const saved = await product.save();
        return saved;
    }

    /**
     * Create a product with image upload to Cloudinary
     */
    static async createProductWithImage(
        productData: { code: string; brand: string; price: number, description: string },
        imageBuffer: Buffer
    ): Promise<IProduct> {
        // Upload image to Cloudinary
        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'products',
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(imageBuffer);
        });

        // Create product in MongoDB with Cloudinary URL
        const product = new Product({
            product_code: productData.code.toUpperCase().trim(),
            brand_name: productData.brand,
            description: productData.description,
            base_price: productData.price,
            imageurl: result.secure_url,
            cloudinaryId: result.public_id
        });

        try {
            await product.save();
        } catch (error) {
            // Rollback Cloudinary upload if DB save fails
            logger.error(`Product save failed, rolling back Cloudinary image: ${result.public_id}`);
            try {
                await cloudinary.uploader.destroy(result.public_id);
            } catch (cleanupError) {
                logger.error(`Failed to cleanup Cloudinary image ${result.public_id}: ${cleanupError}`);
            }
            throw error;
        }

        logger.info(`Product ${product.product_code} created with Cloudinary image`);

        return product;
    }

    /**
     * Update a product's editable fields by MongoDB ID
     */
    static async updateProduct(
        productId: string,
        updates: Partial<Pick<IProduct, 'description' | 'brand_name' | 'base_price'>>
    ): Promise<IProduct> {
        const product = await Product.findByIdAndUpdate(
            productId,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!product) {
            throw new Error('Produto não encontrado');
        }

        logger.info(`Product ${product.product_code} updated`);
        return product;
    }

    /**
     * Delete a product and its associated Cloudinary image
     */
    static async deleteProduct(productId: string): Promise<void> {
        const product = await Product.findById(productId);

        if (!product) {
            throw new Error('Produto não encontrado');
        }

        // Delete image from Cloudinary if it exists
        if (product.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(product.cloudinaryId);
                logger.info(`Deleted Cloudinary image: ${product.cloudinaryId}`);
            } catch (error) {
                logger.error(`Failed to delete Cloudinary image: ${error}`);
                // Continue with product deletion even if Cloudinary deletion fails
            }
        }

        // Delete product from MongoDB
        await Product.findByIdAndDelete(productId);
        logger.info(`Product ${product.product_code} deleted`);
    }
}

