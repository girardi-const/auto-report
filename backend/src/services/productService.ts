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
        query: { search?: string; brand?: string; imageFilter?: string; page: number; limit: number; sortBy: string; sortOrder: 'asc' | 'desc' }
    ): Promise<{ data: IProduct[]; total: number; page: number; totalPages: number }> {
        const { search, brand, imageFilter, page, limit, sortBy, sortOrder } = query;
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 } as Record<string, 1 | -1>;

        const filterList: any[] = [];
 
         if (search) {
            const keywords = search.trim().split(/\s+/).filter(k => !!k);
            keywords.forEach(keyword => {
                filterList.push({
                    $or: [
                        { product_code: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } },
                        { brand_name: { $regex: keyword, $options: 'i' } }
                    ]
                });
            });
         }
 
         if (brand) {
             filterList.push({ brand_name: brand });
         }
 
         if (imageFilter === 'true') {
             filterList.push({ imageurl: { $nin: ['', null] } });
         } else if (imageFilter === 'false') {
             filterList.push({ imageurl: { $in: ['', null] } });
         }
 
         const filter = filterList.length > 0 ? { $and: filterList } : {};


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
        // Normalize brand name to use as Cloudinary folder
        const folder = productData.brand.trim().toUpperCase();

        // Upload image to Cloudinary under the brand folder
        const result = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { folder, resource_type: 'image' },
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
     * Update a product's editable fields and optionally its image by MongoDB ID
     */
    static async updateProduct(
        productId: string,
        updates: Record<string, any>,
        imageBuffer?: Buffer
    ): Promise<IProduct> {
        if (imageBuffer) {
            const existingProduct = await Product.findById(productId);
            if (!existingProduct) {
                throw new Error('Produto não encontrado');
            }

            if (existingProduct.cloudinaryId) {
                try {
                    let publicId = existingProduct.cloudinaryId;
                    if (publicId.startsWith('product/')) {
                        publicId = publicId.replace('product/', '');
                    } else if (publicId.startsWith('products/')) {
                        publicId = publicId.replace('products/', '');
                    }
                    await cloudinary.uploader.destroy(publicId);
                    logger.info(`Deleted old Cloudinary image: ${publicId}`);
                } catch (error) {
                    logger.error(`Failed to delete old Cloudinary image: ${error}`);
                }
            }

            // Use the product's brand as the Cloudinary folder
            const folder = (updates.brand_name || existingProduct.brand_name || 'produtos').trim().toUpperCase();

            const result = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder, resource_type: 'image' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                uploadStream.end(imageBuffer);
            });

            updates.imageurl = result.secure_url;
            updates.cloudinaryId = result.public_id;
        }

        const product = await Product.findByIdAndUpdate(
            productId,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
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
                let publicId = product.cloudinaryId;
                if (publicId.startsWith('product/')) {
                    publicId = publicId.replace('product/', '');
                } else if (publicId.startsWith('products/')) {
                    publicId = publicId.replace('products/', '');
                }

                await cloudinary.uploader.destroy(publicId);
                logger.info(`Deleted Cloudinary image: ${publicId}`);
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

