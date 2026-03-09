import { Request, Response } from 'express';
import { Import } from '../models/Import';
import { ImportBackup } from '../models/ImportBackup';
import { Product } from '../models/Product';
import { createSuccessResponse, createErrorResponse } from '../types/apiResponse';
import { logger } from '../utils/logger';

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
        const { brandId } = req.body;
        // The file is handled by multer in the route and available in req.file
        // But for this initial version we don't parse it.

        if (!brandId) {
            res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Brand ID é obrigatório.'));
            return;
        }

        // Concurrency lock: Check if any import is currently processing
        const activeImport = await Import.findOne({ status: 'processing' });
        if (activeImport) {
            // Check for stale lock (> 10 minutes)
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            if (activeImport.createdAt && activeImport.createdAt < tenMinutesAgo) {
                // Stale lock, release it
                activeImport.status = 'failed';
                await activeImport.save();
                logger.warn(`Released stale import lock for ${activeImport._id}`);
            } else {
                res.status(429).json(
                    createErrorResponse(
                        'RATE_LIMIT_EXCEEDED',
                        'Outra importação já está em andamento. Aguarde a conclusão.'
                    )
                );
                return;
            }
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
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const includeDeleted = req.query.includeDeleted === 'true';

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
        const mode = req.query.mode as 'full' | 'file-only';

        if (!mode || !['full', 'file-only'].includes(mode)) {
            res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Modo inválido.'));
            return;
        }

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

            let restoredCount = 0;
            let deletedCount = 0;

            for (const backup of backups) {
                if (backup.action === 'created') {
                    // product was created, so we delete it
                    await Product.findByIdAndDelete(backup.productId);
                    deletedCount++;
                } else if (backup.action === 'updated') {
                    // product was updated, restore previous state
                    // Use Any cast if types clash, but we replace document
                    if (backup.snapshotBefore) {
                        await Product.findByIdAndUpdate(backup.productId, backup.snapshotBefore, { overwrite: true });
                        restoredCount++;
                    }
                }

                backup.restoredAt = new Date();
                await backup.save();
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
