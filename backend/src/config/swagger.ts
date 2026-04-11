import swaggerJsdoc from 'swagger-jsdoc';
import config from './index'; // Imports the environment config

const options: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Girardi Auto Report API',
            version: config.apiVersion,
            description: 'API documentation for the Girardi Auto Report System',
            contact: {
                name: 'API Support',
                url: 'https://girardisystem.com',
            },
        },
        servers: [
            {
                url: `/api/${config.apiVersion}`,
                description: 'Current API version server',
            },
            {
                url: '/',
                description: 'Root server',
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string', example: 'BAD_REQUEST' },
                                message: { type: 'string', example: 'Validation failed' },
                                details: { type: 'array', items: { type: 'object' } }
                            }
                        }
                    }
                },
                CreateReport: {
                    type: 'object',
                    required: ['title', 'sections'],
                    properties: {
                        title: { type: 'string', example: 'New Corporate Report' },
                        especificador: { type: 'string', example: 'John Doe' },
                        consultor: { type: 'string', example: 'Jane Smith' },
                        consultorPhone: { type: 'string', example: '+55 11 99999-9999' },
                        cash_discount: { type: 'number', example: 5 },
                        delivery_value: { type: 'number', example: 50 },
                        client_info: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                telefone: { type: 'string' }
                            }
                        },
                        sections: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    section_name: { type: 'string', example: 'Living Room' },
                                    section_margin: { type: 'number', example: 10 },
                                    section_discount: { type: 'number', example: 0 },
                                    products: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                product_name: { type: 'string' },
                                                product_id: { type: 'string' },
                                                brand: { type: 'string' },
                                                price: { type: 'number' },
                                                margin: { type: 'number' },
                                                discount: { type: 'number' },
                                                quantity: { type: 'number' },
                                                type: { type: 'string' },
                                                total: { type: 'number' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                Product: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        product_code: { type: 'string' },
                        description: { type: 'string' },
                        brand_name: { type: 'string' },
                        base_price: { type: 'number' },
                        imageurl: { type: 'string' }
                    }
                },
                Brand: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        name: { type: 'string' },
                        importedAt: { type: 'string', format: 'date-time' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        uid: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string' },
                        isAdmin: { type: 'boolean' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Files to scan for OpenAPI JSDoc comments
    apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
