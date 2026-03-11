import { Request, Response } from 'express';
import { Import } from '../models/Import';
import { ImportBackup } from '../models/ImportBackup';
import { Product } from '../models/Product';
import { createSuccessResponse, createErrorResponse } from '../types/apiResponse';
import { logger } from '../utils/logger';
import { UploadImportSchema, DeleteImportQuerySchema, ImportPaginationSchema } from '../validators/importValidator';

// Mock function to simulate processing delay
const simulateProcessing = async (importId: string) => {
    try {
        await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 seconds processing
        await Import.findByIdAndUpdate(importId, { status: 'done' });
        logger.info(`Import ${importId} processing completed (mock).`);
    } catch (error) {
        logger.error(`Error in mock processing for import ${importId}:`, error);
        await Import.findByIdAndUpdate(importId, { status: 'failed' });
    }
};

export const uploadImport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { brandId } = UploadImportSchema.parse(req.body);
        // The file is handled by multer in the route and available in req.file
        // But for this initial version we don't parse it.

        if (!brandId) {
            res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Brand ID é obrigatório.'));
            return;
        }

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
            brandId,
            status: 'processing',
            createdBy: req.firebaseUser?.uid, // Added by auth middleware
        });

        await newImport.save();

        // Start processing asynchronously
        simulateProcessing(newImport._id.toString());

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
                .populate('brandId', 'brand_name') // Fetch brand name
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
        const importDoc = await Import.findById(id).populate('brandId', 'brand_name');

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
                    updateOne: {
                        filter: { _id: backup._id },
                        update: { $set: { restoredAt: new Date() } }
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
