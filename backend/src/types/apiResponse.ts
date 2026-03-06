// Standardized API Response Types

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    meta: {
        timestamp: string;
        version: string;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    meta: {
        timestamp: string;
        version: string;
        requestId?: string;
    };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    meta: {
        timestamp: string;
        version: string;
    };
}

// Helper functions to create standardized responses
export const createSuccessResponse = <T>(
    data: T,
    version: string = 'v1'
): ApiSuccessResponse<T> => ({
    success: true,
    data,
    meta: {
        timestamp: new Date().toISOString(),
        version,
    },
});

export const createErrorResponse = (
    code: string,
    message: string,
    details?: any,
    requestId?: string,
    version: string = 'v1'
): ApiErrorResponse => ({
    success: false,
    error: {
        code,
        message,
        details,
    },
    meta: {
        timestamp: new Date().toISOString(),
        version,
        requestId,
    },
});

export const createPaginatedResponse = <T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    version: string = 'v1'
): PaginatedResponse<T> => {
    const totalPages = Math.ceil(total / limit);

    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
        meta: {
            timestamp: new Date().toISOString(),
            version,
        },
    };
};
