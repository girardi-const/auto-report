import { Request, Response } from 'express';
import { Import } from '../models/Import';
import { ImportBackup } from '../models/ImportBackup';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { createSuccessResponse, createErrorResponse } from '../types/apiResponse';
import { logger } from '../utils/logger';
import { DeleteImportQuerySchema, ImportPaginationSchema } from '../validators/importValidator';
import { z } from 'zod';
import xlsx from 'xlsx';
import cloudinary from '../config/cloudinary';
import { scrapeProductImage } from '../services/imageScraperService';

// Mock function to simulate processing delay
const processImport = async (importId: string, fileBuffer: Buffer) => {
    try {
        const importDoc = await Import.findById(importId);
        if (!importDoc) return;

        // 1. Convert Buffer to Workbook
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 2. Parse exactly as json (raw: false converts formatted numbers like '1127,7' directly to strings instead of math numbers)
        const rawJson: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false });
        // 3. Validation Schema
        const RowSchema = z.object({
            'Código do Produto': z.string().min(1, 'Código é obrigatório').trim(),
            'Nome do Produto': z.string().min(1, 'Nome é obrigatório').trim(),
            'Preço de Tabela': z.coerce.number().positive('Preço deve ser maior que zero'),
            'Marca': z.string().min(1, 'Marca é obrigatória').trim(),
            'Link de Imagem': z.string().trim().optional().default(''),
        });

        const errors: { productCode?: string; reason: string }[] = [];
        let createdCount = 0;
        let updatedCount = 0;
        let failedCount = 0;

        const productCodesInFile = new Set<string>();
        const validRows: any[] = [];
        const uniqueBrandNames = new Set<string>();

        // 4. Validate and deduplicate rows
        for (const [index, row] of rawJson.entries()) {
            const rowNumber = index + 2; // +1 for 0-index, +1 for header
            // Normalize keys to handle trailing \n and case differences in Excel headers
            const normalizedRow: any = {};
            for (const key of Object.keys(row)) {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            }

            // Handle comma as decimal separator in prices (e.g. "1127,7" -> 1127.7, or "1.240,47" -> 1240.47)
            let rawPrice = normalizedRow['preço de tabela'] || normalizedRow['preco de tabela'] || normalizedRow['preço'] || normalizedRow['preco'] || normalizedRow['preã§o de tabela'];
            if (typeof rawPrice === 'string') {
                rawPrice = rawPrice.trim();
                // If the price string contains a comma, it indicates Brazilian formatting
                if (rawPrice.includes(',')) {
                    // remove thousands separators (if they exist) and replace comma with dot
                    rawPrice = rawPrice.replace(/\./g, '').replace(',', '.');
                }
                // If it doesn't contain a comma, assume it's already in standard math format (1240.47)
            }

            // Map possible column variations (including garbled UTF-8 variations from CSVs like CÃ³digo)
            const cleanRow = {
                'Código do Produto': String(normalizedRow['código do produto'] || normalizedRow['cã³digo do produto'] || normalizedRow['codigo do produto'] || normalizedRow['codigo'] || '').trim(),
                'Nome do Produto': String(normalizedRow['nome do produto'] || normalizedRow['nome'] || '').trim(),
                'Preço de Tabela': rawPrice,
                'Marca': String(normalizedRow['marca'] || '').trim(),
                'Link de Imagem': String(normalizedRow['link de imagem'] || normalizedRow['imagem'] || '').trim(),
            };

            console.log(cleanRow)

            const parsed = RowSchema.safeParse(cleanRow);
            if (!parsed.success) {
                const issueMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
                errors.push({ reason: `Linha ${rowNumber}: ${issueMessages}` });
                failedCount++;
                continue;
            }

            const data = parsed.data;

            // Optional image link URL validation if not empty
            if (data['Link de Imagem']) {
                try {
                    new URL(data['Link de Imagem']);
                } catch {
                    errors.push({ productCode: data['Código do Produto'], reason: `Linha ${rowNumber}: Link de Imagem inválido` });
                    failedCount++;
                    continue;
                }
            }

            // Check for duplicates in the spreadsheet
            if (productCodesInFile.has(data['Código do Produto'])) {
                errors.push({ productCode: data['Código do Produto'], reason: `Linha ${rowNumber}: Código do produto duplicado na planilha` });
                failedCount++;
                continue;
            }

            productCodesInFile.add(data['Código do Produto']);
            uniqueBrandNames.add(data['Marca']);
            validRows.push(data);
        }

        // 5. Handle Brands
        const existingBrands = await Brand.find({ brand_name: { $in: Array.from(uniqueBrandNames) } });
        const existingBrandNames = new Set(existingBrands.map(b => b.brand_name));

        const missingBrands = Array.from(uniqueBrandNames)
            .filter(name => !existingBrandNames.has(name))
            .map(name => ({ brand_name: name }));

        if (missingBrands.length > 0) {
            await Brand.insertMany(missingBrands);
        }

        // 6. Handle Products & Backups — with real-time progress tracking
        const totalRows = validRows.length;

        // Initialise progress in DB: let the frontend know total rows
        await Import.findByIdAndUpdate(importId, {
            'progress.total': totalRows,
            'progress.processed': 0,
            'progress.percent': 0,
        });

        const existingProducts = await Product.find({ product_code: { $in: Array.from(productCodesInFile) } });
        const existingProductMap = new Map(existingProducts.map(p => [p.product_code, p]));

        /**
         * Upload an image buffer to Cloudinary and return { imageurl, cloudinaryId }.
         * Returns null if upload fails (errors are logged, not thrown).
         */
        const uploadToCloudinary = async (buffer: Buffer): Promise<{ imageurl: string; cloudinaryId: string } | null> => {
            try {
                const result = await new Promise<any>((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        {
                            folder: 'teste',
                            resource_type: 'image',
                        },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    stream.end(buffer);
                });
                return { imageurl: result.secure_url, cloudinaryId: result.public_id };
            } catch (err: any) {
                logger.warn(`[Import] Cloudinary upload failed: ${err.message}`);
                return null;
            }
        };

        const productBulkOps: any[] = [];
        const backupDocs: any[] = [];

        // --- Concurrency pool: process up to N rows simultaneously ---
        const CONCURRENCY = 6;
        let processedCount = 0;
        let lastWrittenPercent = -1;

        /**
         * Throttled progress writer: writes to MongoDB only when the percent
         * changes by ≥5 points (or on the very first row), to avoid flooding DB.
         */
        const writeProgress = async () => {
            processedCount++;
            const percent = Math.round((processedCount / totalRows) * 100);
            if (percent >= lastWrittenPercent + 5 || processedCount === 1 || processedCount === totalRows) {
                lastWrittenPercent = percent;
                await Import.findByIdAndUpdate(importId, {
                    'progress.processed': processedCount,
                    'progress.percent': percent,
                }).catch(() => { }); // fire-and-forget, never block the row
            }
        };

        /**
         * Simple semaphore to cap parallel work.
         * Prevents hammering DuckDuckGo while still running much faster than serial.
         */
        const createSemaphore = (limit: number) => {
            let active = 0;
            const queue: (() => void)[] = [];
            const acquire = () => new Promise<void>(resolve => {
                if (active < limit) { active++; resolve(); }
                else queue.push(resolve);
            });
            const release = () => {
                active--;
                const next = queue.shift();
                if (next) { active++; next(); }
            };
            return { acquire, release };
        };
        const sem = createSemaphore(CONCURRENCY);

        type RowResult = {
            bulkOp: any;
            backupDoc: any;
            countType: 'created' | 'updated';
        };

        const processRow = async (row: any): Promise<RowResult> => {
            await sem.acquire();
            try {
                const productCode = row['Código do Produto'];
                const description = row['Nome do Produto'];
                const basePrice = row['Preço de Tabela'];
                const brandName = row['Marca'];
                let imageUrl: string = row['Link de Imagem'] || '';
                let cloudinaryId: string | undefined;

                const existingProduct = existingProductMap.get(productCode);

                // --- Auto-scrape image if no link provided ---
                const needsScrape = !imageUrl;
                const existingHasNoImage = existingProduct && !existingProduct.imageurl;

                if (needsScrape && (!existingProduct || existingHasNoImage)) {
                    logger.info(`[Import] No image for "${productCode}", attempting scrape...`);
                    const scraped = await scrapeProductImage(description, brandName);
                    if (scraped) {
                        const uploaded = await uploadToCloudinary(scraped.buffer);
                        if (uploaded) {
                            imageUrl = uploaded.imageurl;
                            cloudinaryId = uploaded.cloudinaryId;
                            logger.info(`[Import] Scraped + uploaded image for "${productCode}": ${imageUrl}`);
                        }
                    }
                }

                if (existingProduct) {
                    const imageUpdate: Record<string, string> = {};
                    if (imageUrl) imageUpdate.imageurl = imageUrl;
                    if (cloudinaryId) imageUpdate.cloudinaryId = cloudinaryId;

                    return {
                        bulkOp: {
                            updateOne: {
                                filter: { product_code: productCode },
                                update: { $set: { description, base_price: basePrice, brand_name: brandName, ...imageUpdate } }
                            }
                        },
                        backupDoc: { importId, productId: existingProduct._id, action: 'updated', snapshotBefore: existingProduct.toObject() },
                        countType: 'updated',
                    };
                } else {
                    const newProductId = new (importDoc.db.model('Product')).base.Types.ObjectId();
                    return {
                        bulkOp: {
                            insertOne: {
                                document: {
                                    _id: newProductId,
                                    product_code: productCode,
                                    description,
                                    base_price: basePrice,
                                    brand_name: brandName,
                                    imageurl: imageUrl,
                                    ...(cloudinaryId && { cloudinaryId }),
                                }
                            }
                        },
                        backupDoc: { importId, productId: newProductId, action: 'created', snapshotBefore: null },
                        countType: 'created',
                    };
                }
            } finally {
                sem.release();
            }
        };

        // Run all rows in parallel (capped by the semaphore)
        const rowResults = await Promise.allSettled(
            validRows.map(row => processRow(row).then(async result => {
                await writeProgress();
                return result;
            }))
        );

        for (const result of rowResults) {
            if (result.status === 'fulfilled') {
                productBulkOps.push(result.value.bulkOp);
                backupDocs.push(result.value.backupDoc);
                if (result.value.countType === 'created') createdCount++;
                else updatedCount++;
            } else {
                logger.error(`[Import] Unexpected row processing error: ${result.reason}`);
                failedCount++;
            }
        }

        if (productBulkOps.length > 0) {
            await Product.bulkWrite(productBulkOps as any);
        }

        if (backupDocs.length > 0) {
            await ImportBackup.insertMany(backupDocs);
        }

        // 7. Finish Import — mark 100%
        importDoc.status = 'done';
        importDoc.progress = { processed: totalRows, total: totalRows, percent: 100 };
        importDoc.summary = {
            total: rawJson.length,
            created: createdCount,
            updated: updatedCount,
            failed: failedCount,
            errors,
        };
        await importDoc.save();

        logger.info(`Import ${importId} processing completed.`);
    } catch (error: any) {
        logger.error(`Error processing import ${importId}:`, error);
        await Import.findByIdAndUpdate(importId, {
            status: 'failed',
            summary: {
                total: 0, created: 0, updated: 0, failed: 1,
                errors: [{ reason: error.message || 'Erro catastrófico no processamento' }]
            }
        });
    }
};

export const uploadImport = async (req: Request, res: Response): Promise<void> => {
    try {
        // The file is handled by multer in the route and available in req.file

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        // Atomically release any stale lock
        await Import.updateMany(
            { status: 'processing', createdAt: { $lt: tenMinutesAgo } },
            { $set: { status: 'failed' } }
        );

        // Check if there is still an active processing import
        const activeImport = await Import.findOne({ status: 'processing' });
        if (activeImport) {
            res.status(429).json(
                createErrorResponse(
                    'RATE_LIMIT_EXCEEDED',
                    'Outra importação já está em andamento. Aguarde a conclusão.'
                )
            );
            return;
        }

        const newImport = new Import({
            filename: req.file?.originalname || 'MockFile.csv',
            fileType: req.file?.mimetype?.includes('csv') ? 'csv' : 'xlsx', // Simplified logic
            status: 'processing',
            createdBy: req.firebaseUser?.uid, // Added by auth middleware
        });

        await newImport.save();

        // Start processing asynchronously
        if (req.file?.buffer) {
            processImport(newImport._id.toString(), req.file.buffer);
        } else {
            // Buffer missing means something is wrong with Multer memoryStorage configuration
            throw new Error('Upload fail: Empty file buffer');
        }

        res.status(201).json(createSuccessResponse(newImport));
    } catch (error: any) {
        logger.error('Error uploading import:', error);
        res.status(500).json(createErrorResponse('SERVER_ERROR', 'Erro ao iniciar importação.'));
    }
};

export const getImports = async (req: Request, res: Response): Promise<void> => {
    try {
        const { page, limit, includeDeleted } = ImportPaginationSchema.parse(req.query);

        const query = includeDeleted ? {} : { isDeleted: false };
        const skip = (page - 1) * limit;

        const [imports, total] = await Promise.all([
            Import.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Import.countDocuments(query),
        ]);

        res.status(200).json(
            createSuccessResponse({
                imports,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            })
        );
    } catch (error: any) {
        logger.error('Error fetching imports:', error);
        res.status(500).json(createErrorResponse('SERVER_ERROR', 'Erro ao buscar importações.'));
    }
};

export const getImportById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const importDoc = await Import.findById(id);

        if (!importDoc) {
            res.status(404).json(createErrorResponse('NOT_FOUND', 'Importação não encontrada.'));
            return;
        }

        res.status(200).json(createSuccessResponse(importDoc));
    } catch (error: any) {
        logger.error('Error fetching import by ID:', error);
        res.status(500).json(createErrorResponse('SERVER_ERROR', 'Erro ao buscar importação.'));
    }
};

export const deleteImport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { mode } = DeleteImportQuerySchema.parse(req.query);

        const importDoc = await Import.findById(id);
        if (!importDoc) {
            res.status(404).json(createErrorResponse('NOT_FOUND', 'Importação não encontrada.'));
            return;
        }

        if (mode === 'file-only') {
            importDoc.isDeleted = true;
            await importDoc.save();
            // In a real app, delete physical file here
            res.status(200).json(createSuccessResponse({ message: 'Arquivo e registro apagados.', mode }));
            return;
        }

        if (mode === 'full') {
            // Full rollback
            const backups = await ImportBackup.find({ importId: id, restoredAt: null });

            const productBulkOps = [];
            const backupBulkOps = [];
            let restoredCount = 0;
            let deletedCount = 0;

            for (const backup of backups) {
                if (backup.action === 'created') {
                    productBulkOps.push({ deleteOne: { filter: { _id: backup.productId } } });
                    deletedCount++;
                } else if (backup.action === 'updated') {
                    if (backup.snapshotBefore) {
                        productBulkOps.push({
                            replaceOne: {
                                filter: { _id: backup.productId },
                                replacement: backup.snapshotBefore
                            }
                        });
                        restoredCount++;
                    }
                }

                backupBulkOps.push({
                    deleteOne: {
                        filter: { _id: backup._id }
                    }
                });
            }

            if (productBulkOps.length > 0) {
                await Product.bulkWrite(productBulkOps as any);
            }
            if (backupBulkOps.length > 0) {
                await ImportBackup.bulkWrite(backupBulkOps as any);
            }

            importDoc.isDeleted = true;
            await importDoc.save();
            // Optional: delete physical file

            res.status(200).json(
                createSuccessResponse({
                    message: 'Rollback concluído. Registros revertidos.',
                    restored: restoredCount,
                    deleted: deletedCount,
                })
            );
        }
    } catch (error: any) {
        logger.error('Error deleting import:', error);
        res.status(500).json(createErrorResponse('SERVER_ERROR', 'Erro ao apagar importação.'));
    }
};

export const getImportBackups = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const backups = await ImportBackup.find({ importId: id }).sort({ createdAt: -1 });

        res.status(200).json(createSuccessResponse(backups));
    } catch (error: any) {
        logger.error('Error fetching import backups:', error);
        res.status(500).json(createErrorResponse('SERVER_ERROR', 'Erro ao buscar backups.'));
    }
};
