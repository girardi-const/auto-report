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
import { registerImport, cancelImport as cancelImportSignal, unregisterImport } from '../services/importCancelRegistry';

/**
 * Helper: delete Cloudinary images in batches
 */
const deleteCloudinaryImages = async (ids: string[]) => {
    if (ids.length === 0) return;
    const BATCH_SIZE = 10;
    let deletedOk = 0;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = ids.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
            batch.map(id => cloudinary.uploader.destroy(id).catch(() => { }))
        );
        deletedOk += results.filter(r => r.status === 'fulfilled').length;
    }
    logger.info(`[Import Cleanup] Deleted ${deletedOk}/${ids.length} Cloudinary images`);
};

/**
 * Cleanup a cancelled import:
 *   1. Delete Cloudinary images
 *   2. Delete products created by this import (using backup records)
 *   3. Delete ImportBackup records
 *   4. Delete the Import document itself
 */
const cleanupCancelledImport = async (importId: string, cloudinaryIds: string[]) => {
    logger.info(`[Import Cancel] Starting cleanup for import ${importId}...`);

    // 1. Delete Cloudinary images uploaded during this import
    await deleteCloudinaryImages(cloudinaryIds);

    // 2. Find backups to know which products were created by this import
    const backups = await ImportBackup.find({ importId }).catch(() => []);
    if (backups && backups.length > 0) {
        const createdProductIds = backups
            .filter((b: any) => b.action === 'created')
            .map((b: any) => b.productId);

        // Delete products that were created by this import
        if (createdProductIds.length > 0) {
            await Product.deleteMany({ _id: { $in: createdProductIds } }).catch(() => { });
            logger.info(`[Import Cancel] Deleted ${createdProductIds.length} products created by import`);
        }

        // Restore updated products to their snapshot
        const updatedBackups = backups.filter((b: any) => b.action === 'updated' && b.snapshotBefore);
        if (updatedBackups.length > 0) {
            const restoreOps = updatedBackups.map((b: any) => ({
                replaceOne: {
                    filter: { _id: b.productId },
                    replacement: b.snapshotBefore,
                }
            }));
            await Product.bulkWrite(restoreOps as any).catch(() => { });
            logger.info(`[Import Cancel] Restored ${updatedBackups.length} updated products`);
        }

        // 3. Delete backups
        await ImportBackup.deleteMany({ importId }).catch(() => { });
        logger.info(`[Import Cancel] Deleted ${backups.length} backup records`);
    }

    // 4. Delete the import document itself so it doesn't block future imports
    await Import.findByIdAndDelete(importId).catch(() => { });
    logger.info(`[Import Cancel] Import ${importId} fully cleaned up.`);
};

// ----- Types used in the 3-phase process -----

/** Data collected in Phase 1 for each valid row */
interface CollectedRow {
    productCode: string;
    description: string;
    basePrice: number;
    brandName: string;
    /** Image URL from spreadsheet or scraped externally */
    imageUrl: string;
    /** Downloaded image buffer ready for Cloudinary upload (null if no image or from URL column) */
    imageBuffer: Buffer | null;
    /** Whether an existing product already has an image (skip upload) */
    existingHasImage: boolean;
    /** Whether this product already exists in DB */
    isUpdate: boolean;
}

/**
 * Process import in 3 sequential phases with cancellation support.
 *
 * Phase 1 — Validate spreadsheet + scrape/download image buffers (no Cloudinary yet)
 * Phase 2 — Upload all collected image buffers to Cloudinary
 * Phase 3 — Bulk write products & backups to MongoDB
 */
const processImport = async (importId: string, fileBuffer: Buffer, signal: AbortSignal) => {
    const uploadedCloudinaryIds: string[] = [];
    try {
        const importDoc = await Import.findById(importId);
        if (!importDoc) return;

        // ===== PARSE SPREADSHEET =====
        const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '', raw: false });

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

        // Validate and deduplicate rows
        for (const [index, row] of rawJson.entries()) {
            const rowNumber = index + 2;
            const normalizedRow: any = {};
            for (const key of Object.keys(row)) {
                normalizedRow[key.trim().toLowerCase()] = row[key];
            }

            let rawPrice = normalizedRow['preço de tabela'] || normalizedRow['preco de tabela'] || normalizedRow['preço'] || normalizedRow['preco'] || normalizedRow['preã§o de tabela'];
            if (typeof rawPrice === 'string') {
                rawPrice = rawPrice.trim();
                if (rawPrice.includes(',')) {
                    rawPrice = rawPrice.replace(/\./g, '').replace(',', '.');
                }
            }

            const cleanRow = {
                'Código do Produto': String(normalizedRow['código do produto'] || normalizedRow['cã³digo do produto'] || normalizedRow['codigo do produto'] || normalizedRow['codigo'] || '').trim(),
                'Nome do Produto': String(normalizedRow['nome do produto'] || normalizedRow['nome'] || '').trim(),
                'Preço de Tabela': rawPrice,
                'Marca': String(normalizedRow['marca'] || '').trim(),
                'Link de Imagem': String(normalizedRow['link de imagem'] || normalizedRow['imagem'] || '').trim(),
            };

            const parsed = RowSchema.safeParse(cleanRow);
            if (!parsed.success) {
                const issueMessages = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
                errors.push({ reason: `Linha ${rowNumber}: ${issueMessages}` });
                failedCount++;
                continue;
            }

            const data = parsed.data;

            if (data['Link de Imagem']) {
                try {
                    new URL(data['Link de Imagem']);
                } catch {
                    errors.push({ productCode: data['Código do Produto'], reason: `Linha ${rowNumber}: Link de Imagem inválido` });
                    failedCount++;
                    continue;
                }
            }

            if (productCodesInFile.has(data['Código do Produto'])) {
                errors.push({ productCode: data['Código do Produto'], reason: `Linha ${rowNumber}: Código do produto duplicado na planilha` });
                failedCount++;
                continue;
            }

            productCodesInFile.add(data['Código do Produto']);
            uniqueBrandNames.add(data['Marca']);
            validRows.push(data);
        }

        // Handle Brands
        const existingBrands = await Brand.find({ brand_name: { $in: Array.from(uniqueBrandNames) } });
        const existingBrandNames = new Set(existingBrands.map(b => b.brand_name));
        const missingBrands = Array.from(uniqueBrandNames)
            .filter(name => !existingBrandNames.has(name))
            .map(name => ({ brand_name: name }));
        if (missingBrands.length > 0) {
            await Brand.insertMany(missingBrands);
        }

        const totalRows = validRows.length;
        await Import.findByIdAndUpdate(importId, {
            'progress.total': totalRows,
            'progress.processed': 0,
            'progress.percent': 0,
        });

        const existingProducts = await Product.find({ product_code: { $in: Array.from(productCodesInFile) } });
        const existingProductMap = new Map(existingProducts.map(p => [p.product_code, p]));

        // ================================================================
        // PHASE 1 — Collect image URLs/buffers (scrape from web, no Cloudinary yet)
        // ================================================================
        logger.info(`[Import ${importId}] Phase 1: Collecting image URLs for ${totalRows} products...`);

        const collectedRows: CollectedRow[] = [];
        let phase1Processed = 0;
        let lastWrittenPercent = -1;

        const writeProgress = async (processed: number, phaseMultiplier: number, phaseOffset: number) => {
            // Phase 1 = 0-50%, Phase 2 = 50-90%, Phase 3 = 90-100%
            const percent = Math.round(phaseOffset + (processed / totalRows) * phaseMultiplier);
            if (percent >= lastWrittenPercent + 5 || processed === 1 || processed === totalRows) {
                lastWrittenPercent = percent;
                await Import.findByIdAndUpdate(importId, {
                    'progress.processed': processed,
                    'progress.percent': Math.min(percent, 99),
                }).catch(() => { });
            }
        };

        // Semaphore for concurrent scraping
        const CONCURRENCY = 4;
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

        const collectRow = async (row: any): Promise<CollectedRow> => {
            if (signal.aborted) throw new Error('IMPORT_CANCELLED');
            await sem.acquire();
            try {
                const productCode = row['Código do Produto'];
                const description = row['Nome do Produto'];
                const basePrice = row['Preço de Tabela'];
                const brandName = row['Marca'];
                let imageUrl: string = row['Link de Imagem'] || '';
                let imageBuffer: Buffer | null = null;

                const existingProduct = existingProductMap.get(productCode);
                const needsScrape = !imageUrl;
                const existingHasImage = !!(existingProduct && existingProduct.imageurl);

                // Scrape image if no link provided and product doesn't already have one
                if (needsScrape && (!existingProduct || !existingHasImage)) {
                    logger.info(`[Import] No image for "${productCode}", attempting scrape...`);
                    const scraped = await scrapeProductImage(description, productCode, brandName);
                    if (scraped) {
                        imageBuffer = scraped.buffer;
                        logger.info(`[Import] Scraped image for "${productCode}" from ${scraped.sourceUrl}`);
                    }
                }

                return {
                    productCode,
                    description,
                    basePrice,
                    brandName,
                    imageUrl,
                    imageBuffer,
                    existingHasImage,
                    isUpdate: !!existingProduct,
                };
            } finally {
                sem.release();
            }
        };

        // Run Phase 1 concurrently (capped by semaphore)
        const phase1Results = await Promise.allSettled(
            validRows.map(row => collectRow(row).then(async result => {
                phase1Processed++;
                await writeProgress(phase1Processed, 50, 0); // 0-50%
                return result;
            }))
        );

        // Check cancel after Phase 1
        if (signal.aborted) throw new Error('IMPORT_CANCELLED');

        for (const result of phase1Results) {
            if (result.status === 'fulfilled') {
                collectedRows.push(result.value);
            } else {
                if (result.reason?.message === 'IMPORT_CANCELLED') throw new Error('IMPORT_CANCELLED');
                logger.error(`[Import] Phase 1 row error: ${result.reason}`);
                failedCount++;
            }
        }

        logger.info(`[Import ${importId}] Phase 1 complete: ${collectedRows.length} rows collected, ${failedCount} failed`);

        // ================================================================
        // PHASE 2 — Upload collected image buffers to Cloudinary
        // ================================================================
        const rowsNeedingUpload = collectedRows.filter(r => r.imageBuffer !== null);
        logger.info(`[Import ${importId}] Phase 2: Uploading ${rowsNeedingUpload.length} images to Cloudinary...`);

        let phase2Processed = 0;
        lastWrittenPercent = -1;

        for (const row of collectedRows) {
            if (signal.aborted) throw new Error('IMPORT_CANCELLED');

            if (row.imageBuffer) {
                try {
                    const result = await new Promise<any>((resolve, reject) => {
                        const stream = cloudinary.uploader.upload_stream(
                            { folder: row.brandName, resource_type: 'image' },
                            (error, result) => {
                                if (error) reject(error);
                                else resolve(result);
                            }
                        );
                        stream.end(row.imageBuffer);
                    });
                    uploadedCloudinaryIds.push(result.public_id);
                    row.imageUrl = result.secure_url;
                    // Store the cloudinaryId on the row for later use in Phase 3
                    (row as any).cloudinaryId = result.public_id;
                    logger.info(`[Import] Uploaded image for "${row.productCode}": ${result.secure_url}`);
                } catch (err: any) {
                    logger.warn(`[Import] Cloudinary upload failed for "${row.productCode}": ${err.message}`);
                }
            }

            phase2Processed++;
            await writeProgress(phase2Processed, 40, 50); // 50-90%
        }

        // Check cancel after Phase 2
        if (signal.aborted) throw new Error('IMPORT_CANCELLED');

        logger.info(`[Import ${importId}] Phase 2 complete: ${uploadedCloudinaryIds.length} images uploaded`);

        // ================================================================
        // PHASE 3 — Save products & backups to MongoDB
        // ================================================================
        logger.info(`[Import ${importId}] Phase 3: Saving ${collectedRows.length} products to database...`);

        const productBulkOps: any[] = [];
        const backupDocs: any[] = [];

        for (const row of collectedRows) {
            const existingProduct = existingProductMap.get(row.productCode);
            const cloudinaryId = (row as any).cloudinaryId as string | undefined;

            if (existingProduct) {
                const imageUpdate: Record<string, string> = {};
                if (row.imageUrl) imageUpdate.imageurl = row.imageUrl;
                if (cloudinaryId) imageUpdate.cloudinaryId = cloudinaryId;

                productBulkOps.push({
                    updateOne: {
                        filter: { product_code: row.productCode },
                        update: { $set: { description: row.description, base_price: row.basePrice, brand_name: row.brandName, ...imageUpdate } }
                    }
                });
                backupDocs.push({ importId, productId: existingProduct._id, action: 'updated', snapshotBefore: existingProduct.toObject() });
                updatedCount++;
            } else {
                const newProductId = new (importDoc.db.model('Product')).base.Types.ObjectId();
                productBulkOps.push({
                    insertOne: {
                        document: {
                            _id: newProductId,
                            product_code: row.productCode,
                            description: row.description,
                            base_price: row.basePrice,
                            brand_name: row.brandName,
                            imageurl: row.imageUrl,
                            ...(cloudinaryId && { cloudinaryId }),
                        }
                    }
                });
                backupDocs.push({ importId, productId: newProductId, action: 'created', snapshotBefore: null });
                createdCount++;
            }
        }

        if (productBulkOps.length > 0) {
            await Product.bulkWrite(productBulkOps as any);
        }

        if (backupDocs.length > 0) {
            await ImportBackup.insertMany(backupDocs);
        }

        // Finish Import — mark 100%
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

        unregisterImport(importId);
        logger.info(`[Import ${importId}] Processing completed: ${createdCount} created, ${updatedCount} updated, ${failedCount} failed.`);
    } catch (error: any) {
        if (error.message === 'IMPORT_CANCELLED' || signal.aborted) {
            logger.info(`[Import] Import ${importId} was cancelled. Running cleanup...`);
            await cleanupCancelledImport(importId, uploadedCloudinaryIds);
            unregisterImport(importId);
            return;
        }

        logger.error(`Error processing import ${importId}:`, error);
        unregisterImport(importId);
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

        // Start processing asynchronously with cancellation support
        if (req.file?.buffer) {
            const ac = registerImport(newImport._id.toString());
            processImport(newImport._id.toString(), req.file.buffer, ac.signal);
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

            // Fetch current products so we can read their cloudinaryId before rollback
            const productIds = backups.map(b => b.productId);
            const currentProducts = await Product.find({ _id: { $in: productIds } });
            const currentProductMap = new Map(currentProducts.map(p => [p._id.toString(), p]));

            const productBulkOps = [];
            const backupBulkOps = [];
            const cloudinaryIdsToDelete: string[] = [];
            let restoredCount = 0;
            let deletedCount = 0;

            for (const backup of backups) {
                const currentProduct = currentProductMap.get(backup.productId.toString());

                if (backup.action === 'created') {
                    // Product was created by this import — delete it and its Cloudinary image
                    if (currentProduct?.cloudinaryId) {
                        cloudinaryIdsToDelete.push(currentProduct.cloudinaryId);
                    }
                    productBulkOps.push({ deleteOne: { filter: { _id: backup.productId } } });
                    deletedCount++;
                } else if (backup.action === 'updated') {
                    if (backup.snapshotBefore) {
                        // If the import changed the image, delete the current (import-added) one
                        const snapshotCloudinaryId = backup.snapshotBefore.cloudinaryId || null;
                        const currentCloudinaryId = currentProduct?.cloudinaryId || null;
                        if (currentCloudinaryId && currentCloudinaryId !== snapshotCloudinaryId) {
                            cloudinaryIdsToDelete.push(currentCloudinaryId);
                        }

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

            // Delete orphaned Cloudinary images in batches to avoid overwhelming the API
            if (cloudinaryIdsToDelete.length > 0) {
                const BATCH_SIZE = 10;
                let cloudinaryDeletedOk = 0;
                let cloudinaryDeletedFail = 0;

                for (let i = 0; i < cloudinaryIdsToDelete.length; i += BATCH_SIZE) {
                    const batch = cloudinaryIdsToDelete.slice(i, i + BATCH_SIZE);
                    const results = await Promise.allSettled(
                        batch.map(async (rawId) => {
                            let publicId = rawId;
                            if (publicId.startsWith('product/')) {
                                publicId = publicId.replace('product/', '');
                            } else if (publicId.startsWith('products/')) {
                                publicId = publicId.replace('products/', '');
                            }
                            await cloudinary.uploader.destroy(publicId);
                            logger.info(`[Import Rollback] Deleted Cloudinary image: ${publicId}`);
                        })
                    );
                    cloudinaryDeletedOk += results.filter(r => r.status === 'fulfilled').length;
                    cloudinaryDeletedFail += results.filter(r => r.status === 'rejected').length;
                }

                logger.info(`[Import Rollback] Cloudinary cleanup done: ${cloudinaryDeletedOk} deleted, ${cloudinaryDeletedFail} failed`);
            }

            if (productBulkOps.length > 0) {
                await Product.bulkWrite(productBulkOps as any);
            }
            if (backupBulkOps.length > 0) {
                await ImportBackup.bulkWrite(backupBulkOps as any);
            }

            importDoc.isDeleted = true;
            await importDoc.save();

            res.status(200).json(
                createSuccessResponse({
                    message: 'Rollback concluído. Registros revertidos.',
                    restored: restoredCount,
                    deleted: deletedCount,
                    cloudinaryDeleted: cloudinaryIdsToDelete.length,
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

export const cancelImportController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const importDoc = await Import.findById(id);

        // If the import doesn't exist, it was already cleaned up — treat as success
        if (!importDoc) {
            res.status(200).json(createSuccessResponse({ message: 'Importação já foi removida.' }));
            return;
        }

        // If not processing, it already finished — treat as success
        if (importDoc.status !== 'processing') {
            res.status(200).json(createSuccessResponse({ message: 'Importação já finalizada.' }));
            return;
        }

        // Try to signal the abort — if already removed from registry, it's already being cleaned up
        const wasCancelled = cancelImportSignal(id);
        if (!wasCancelled) {
            res.status(200).json(createSuccessResponse({ message: 'Cancelamento já em andamento.' }));
            return;
        }

        logger.info(`[Import] Cancel requested for import ${id}`);
        res.status(200).json(createSuccessResponse({ message: 'Importação cancelada com sucesso. Limpeza em andamento.' }));
    } catch (error: any) {
        logger.error('Error cancelling import:', error);
        res.status(500).json(createErrorResponse('SERVER_ERROR', 'Erro ao cancelar importação.'));
    }
};
