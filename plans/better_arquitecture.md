Full-Stack Code Quality & Architecture Improvement Plan
A comprehensive roadmap to elevate your auto-report application from junior to mid-senior level development standards, with MongoDB integration and professional full-stack practices.

📊 Current State Analysis
Strengths
✅ Well-structured frontend components
✅ Custom hooks for state management (

useReportState
)
✅ Type-safe with TypeScript interfaces
✅ Clean separation of concerns (components, hooks, utils, types)
✅ PDF generation working with @react-pdf/renderer
✅ Basic API route implemented (CEP lookup)
Areas for Improvement
❌ No backend architecture - Only Next.js API routes, no proper backend
❌ No database - All data is ephemeral (lost on refresh)
❌ No error handling strategy - Console.logs and basic try-catch
❌ No validation layer - Client-side only, no schema validation
❌ No testing - Zero test coverage
❌ Mock data in components - Product lookup uses hardcoded mock
❌ No authentication - Anyone can access/generate reports
❌ No environment configuration - Hardcoded values
❌ State management - Using custom hooks, could be more robust
❌ No logging/monitoring - No observability
❌ No API versioning - Future breaking changes will be problematic
🎯 Recommended Improvements by Category
1. Backend Architecture & MongoDB Integration
IMPORTANT

Priority: CRITICAL - This is the foundation for everything else

Current Issues
Product data is mocked in the frontend
No report history persistence
No centralized business logic
API routes mixed with frontend code
Recommended Structure
auto-report/
├── frontend/                 # Next.js frontend (existing)
├── backend/                  # New Node.js backend
│   ├── src/
│   │   ├── config/          # Environment & database config
│   │   ├── models/          # MongoDB schemas (Mongoose)
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # Express routes
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── services/        # External API calls, complex logic
│   │   ├── utils/           # Helpers, formatters
│   │   ├── validators/      # Joi/Zod schemas
│   │   └── app.ts           # Express app setup
│   ├── tests/               # Unit & integration tests
│   └── package.json
└── docker-compose.yml       # MongoDB + backend containerization
MongoDB Schema Design
Reports Collection:

typescript
{
  _id: ObjectId,
  reportNumber: String,        // Auto-generated (e.g., "RPT-2026-0001")
  clientInfo: {
    name: String,
    telefone: String,
    email: String,
    razaoSocial: String,
    cnpj: String,
    inscricaoEstadual: String,
    endereco: String,
    bairro: String,
    cep: String,
    cidade: String,
    uf: String
  },
  generalInfo: {
    especificador: String,
    consultor: String
  },
  sections: [{
    id: String,
    name: String,
    discount: Number,
    products: [{
      id: String,
      code: String,
      brand: String,
      name: String,
      units: Number,
      margin: Number,
      discount: Number,
      priceBase: Number,
      finalPrice: Number,       // Calculated and stored
      image: String
    }]
  }],
  pricing: {
    subtotalBeforeCash: Number,
    cashDiscount: Number,
    totalValue: Number
  },
  pdfUrl: String,              // S3 or local storage path
  status: String,              // 'draft', 'sent', 'approved', 'rejected'
  createdBy: ObjectId,         // User reference (for multi-user)
  createdAt: Date,
  updatedAt: Date,
  metadata: {
    version: String,
    ipAddress: String,
    userAgent: String
  }
}
Products Collection (Cache):

typescript
{
  _id: ObjectId,
  code: String,                // Unique index
  name: String,
  basePrice: Number,
  brand: String,
  category: String,
  imageUrl: String,
  supplier: String,
  inStock: Boolean,
  lastUpdated: Date,
  externalId: String,          // From external API
  metadata: Object             // Flexible additional data
}
Users Collection (Future):

typescript
{
  _id: ObjectId,
  email: String,               // Unique
  passwordHash: String,
  name: String,
  role: String,                // 'admin', 'consultant', 'viewer'
  permissions: [String],
  isActive: Boolean,
  createdAt: Date,
  lastLogin: Date
}
2. API Design & Route Structure
WARNING

Current API routes lack versioning, proper error handling, and REST conventions

Recommended API Routes
# Products
GET    /api/v1/products/search?code=123          # Search product by code
GET    /api/v1/products/:id                      # Get product by ID
POST   /api/v1/products/sync                     # Sync with external API
GET    /api/v1/products/brands                   # Get all brands
# Reports
POST   /api/v1/reports                           # Create new report (save draft)
GET    /api/v1/reports                           # List reports (pagination, filters)
GET    /api/v1/reports/:id                       # Get specific report
PUT    /api/v1/reports/:id                       # Update report
DELETE /api/v1/reports/:id                       # Delete report
POST   /api/v1/reports/:id/generate-pdf          # Generate PDF for report
GET    /api/v1/reports/:id/pdf                   # Download PDF
POST   /api/v1/reports/:id/duplicate             # Duplicate report
# Address (existing, needs improvement)
GET    /api/v1/address/cep/:cep                  # Lookup address by CEP
# Analytics (Future)
GET    /api/v1/analytics/reports/summary         # Report statistics
GET    /api/v1/analytics/products/popular        # Most used products
# Users (Future with Auth)
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
API Response Format Standardization
typescript
// Success Response
{
  success: true,
  data: { /* actual data */ },
  meta: {
    timestamp: "2026-02-12T19:19:46-03:00",
    version: "v1"
  }
}
// Error Response
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input data",
    details: [
      { field: "clientInfo.email", message: "Invalid email format" }
    ]
  },
  meta: {
    timestamp: "2026-02-12T19:19:46-03:00",
    version: "v1",
    requestId: "req_abc123"  // For tracking
  }
}
// Paginated Response
{
  success: true,
  data: [ /* items */ ],
  pagination: {
    page: 1,
    limit: 20,
    total: 150,
    totalPages: 8,
    hasNext: true,
    hasPrev: false
  }
}
3. Error Handling & Validation
IMPORTANT

Professional error handling is the difference between junior and senior code

Global Error Handler (Backend)
typescript
// middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
  }
}
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    });
  }
  // Custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details
      }
    });
  }
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: err.message
      }
    });
  }
  // Default 500 error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { details: err.message })
    }
  });
};
Validation with Zod
typescript
// validators/reportValidator.ts
import { z } from 'zod';
export const ClientInfoSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  telefone: z.string().regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Invalid phone format'),
  email: z.string().email('Invalid email'),
  razaoSocial: z.string().optional(),
  cnpj: z.string().regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'Invalid CNPJ').optional(),
  inscricaoEstadual: z.string().optional(),
  endereco: z.string().min(5),
  bairro: z.string().min(2),
  cep: z.string().regex(/^\d{5}-\d{3}$/, 'Invalid CEP'),
  cidade: z.string().min(2),
  uf: z.string().length(2, 'UF must be 2 characters')
});
export const ProductSchema = z.object({
  code: z.string().min(1),
  brand: z.string().min(1),
  name: z.string().min(3),
  units: z.number().int().positive(),
  margin: z.number().min(0).max(100),
  discount: z.number().min(0).max(100),
  priceBase: z.number().positive()
});
export const CreateReportSchema = z.object({
  clientInfo: ClientInfoSchema,
  generalInfo: z.object({
    especificador: z.string().min(3),
    consultor: z.string().min(3)
  }),
  sections: z.array(z.object({
    name: z.string().min(1),
    discount: z.number().min(0).max(100),
    products: z.array(ProductSchema).min(1, 'Each section must have at least one product')
  })).min(1, 'Report must have at least one section'),
  cashDiscount: z.number().min(0).max(100)
});
Frontend Error Boundaries
typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}
interface State {
  hasError: boolean;
  error: Error | null;
}
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Send to error tracking service (Sentry, LogRocket, etc.)
  }
  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
4. Environment Configuration
CAUTION

Never hardcode API URLs, secrets, or configuration

Backend .env
env
# Server
NODE_ENV=development
PORT=3001
API_VERSION=v1
# MongoDB
MONGODB_URI=mongodb://localhost:27017/auto-report
MONGODB_DB_NAME=auto-report
# External APIs
PRODUCT_API_URL=https://api.supplier.com
PRODUCT_API_KEY=your_api_key_here
VIACEP_API_URL=https://viacep.com.br/ws
# JWT (for future auth)
JWT_SECRET=your_secret_key_change_in_production
JWT_EXPIRES_IN=7d
# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880  # 5MB
# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
# Logging
LOG_LEVEL=debug
LOG_FILE_PATH=./logs/app.log
# Email (future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
Frontend .env.local
env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_APP_NAME=Girardi - Sistema de Relatórios
NEXT_PUBLIC_ENVIRONMENT=development
Config Manager
typescript
// backend/src/config/index.ts
import dotenv from 'dotenv';
import path from 'path';
dotenv.config();
interface Config {
  env: string;
  port: number;
  mongodb: {
    uri: string;
    dbName: string;
  };
  externalApis: {
    productApi: {
      url: string;
      apiKey: string;
    };
    viaCep: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
}
const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/auto-report',
    dbName: process.env.MONGODB_DB_NAME || 'auto-report',
  },
  externalApis: {
    productApi: {
      url: process.env.PRODUCT_API_URL || '',
      apiKey: process.env.PRODUCT_API_KEY || '',
    },
    viaCep: process.env.VIACEP_API_URL || 'https://viacep.com.br/ws',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};
export default config;
5. State Management Improvements
TIP

Your custom hook is good, but can be enhanced for complex state

Current Approach (Good for Small Apps)
Custom 

useReportState
 hook
Props drilling through components
Recommended: Zustand (Mid-level)
typescript
// store/reportStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
interface ReportStore {
  // State
  clientInfo: ClientInfo;
  sections: Section[];
  cashDiscount: number;
  
  // Actions
  updateClientInfo: (field: keyof ClientInfo, value: string) => void;
  addSection: () => void;
  removeSection: (id: string) => void;
  addProduct: (sectionId: string) => void;
  updateProduct: (sectionId: string, productId: string, updates: Partial<Product>) => void;
  
  // Async actions
  saveReport: () => Promise<void>;
  loadReport: (id: string) => Promise<void>;
}
export const useReportStore = create<ReportStore>()(
  devtools(
    persist(
      (set, get) => ({
        clientInfo: initialClientInfo,
        sections: [],
        cashDiscount: 0,
        
        updateClientInfo: (field, value) =>
          set((state) => ({
            clientInfo: { ...state.clientInfo, [field]: value }
          })),
        
        addSection: () =>
          set((state) => ({
            sections: [...state.sections, {
              id: crypto.randomUUID(),
              name: `Nova Seção ${state.sections.length + 1}`,
              discount: 0,
              products: []
            }]
          })),
        
        saveReport: async () => {
          const state = get();
          try {
            const response = await fetch('/api/v1/reports', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(state)
            });
            if (!response.ok) throw new Error('Failed to save');
            const data = await response.json();
            // Handle success
          } catch (error) {
            // Handle error
          }
        }
      }),
      { name: 'report-storage' }
    )
  )
);
6. Testing Strategy
IMPORTANT

No tests = technical debt = production bugs

Testing Pyramid
E2E Tests (10%)
                  /               \
            Integration Tests (30%)
          /                         \
    Unit Tests (60%)
Backend Tests
typescript
// tests/unit/services/reportService.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ReportService } from '../../../src/services/reportService';
import { mockReportData } from '../../fixtures/reports';
describe('ReportService', () => {
  let reportService: ReportService;
  
  beforeEach(() => {
    reportService = new ReportService();
  });
  
  describe('calculateTotals', () => {
    it('should calculate correct subtotal with product discounts', () => {
      const result = reportService.calculateTotals(mockReportData);
      expect(result.subtotal).toBe(15000);
    });
    
    it('should apply cash discount correctly', () => {
      const result = reportService.calculateTotals({
        ...mockReportData,
        cashDiscount: 10
      });
      expect(result.total).toBe(13500);
    });
  });
  
  describe('validateReport', () => {
    it('should reject report with empty sections', () => {
      expect(() => {
        reportService.validateReport({ ...mockReportData, sections: [] });
      }).toThrow('Report must have at least one section');
    });
  });
});
Frontend Tests
typescript
// components/__tests__/ReportForm.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReportForm from '../ReportForm';
describe('ReportForm', () => {
  it('should add new section when button clicked', () => {
    render(<ReportForm />);
    
    const addButton = screen.getByText(/criar nova seção/i);
    fireEvent.click(addButton);
    
    expect(screen.getByText(/nova seção 1/i)).toBeInTheDocument();
  });
  
  it('should validate client info before generating PDF', async () => {
    render(<ReportForm />);
    
    const generateButton = screen.getByText(/gerar pdf/i);
    fireEvent.click(generateButton);
    
    // Should show validation errors
    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument();
  });
});
E2E Tests (Playwright)
typescript
// e2e/report-generation.spec.ts
import { test, expect } from '@playwright/test';
test('complete report generation flow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  
  // Fill client info
  await page.fill('input[name="clientInfo.name"]', 'Test Client');
  await page.fill('input[name="clientInfo.email"]', 'test@example.com');
  
  // Add section
  await page.click('text=Criar Nova Seção');
  
  // Add product
  await page.click('text=Adicionar Produto');
  await page.fill('input[placeholder="TENTE: 123"]', '123');
  
  // Wait for product to load
  await expect(page.locator('text=Torneira Gourmet Flexível')).toBeVisible();
  
  // Generate PDF
  await page.click('text=Gerar PDF');
  
  // Verify download
  const download = await page.waitForEvent('download');
  expect(download.suggestedFilename()).toContain('Orcamento');
});
7. Logging & Monitoring
typescript
// utils/logger.ts
import winston from 'winston';
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}
export { logger };
8. Security Improvements
CAUTION

Security must be built-in, not bolted-on

Backend Security Middleware
typescript
// middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
// Rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
// Strict rate limit for PDF generation (expensive operation)
export const pdfLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'PDF generation limit exceeded'
});
// Sanitize user input
export const sanitize = mongoSanitize({
  replaceWith: '_',
});
// Security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
});
Input Sanitization
typescript
// utils/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
export const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = {} as T;
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeInput(value) as any;
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key as keyof T] = sanitizeObject(value);
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  return sanitized;
};
9. Performance Optimizations
Database Indexing
typescript
// models/Report.ts
import mongoose from 'mongoose';
const reportSchema = new mongoose.Schema({
  reportNumber: { type: String, required: true, unique: true, index: true },
  'clientInfo.cnpj': { type: String, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ['draft', 'sent', 'approved'], index: true }
});
// Compound index for common queries
reportSchema.index({ createdAt: -1, status: 1 });
reportSchema.index({ 'clientInfo.name': 'text' }); // Text search
export const Report = mongoose.model('Report', reportSchema);
Frontend Optimizations
typescript
// Lazy load PDF generation
const PDFDocument = lazy(() => import('./PDFDocument'));
// Memoize expensive calculations
const calculateSubtotal = useMemo(() => {
  return sections.reduce((acc, s) => 
    acc + s.products.reduce((sum, p) => 
      sum + (p.priceBase * (1 + p.margin/100) * (1 - p.discount/100) * p.units), 
    0
  ), 0);
}, [sections]);
// Virtualize long lists
import { FixedSizeList } from 'react-window';
10. TypeScript Improvements
Stricter Types
typescript
// types/api.ts
export type ApiResponse<T> = {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    version: string;
  };
} | {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    version: string;
  };
};
// Type-safe API client
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  const data: ApiResponse<T> = await response.json();
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
11. Authentication Strategy for Pre-Defined Users
IMPORTANT

Firebase is excellent for pre-defined users with minimal backend auth logic

Option A: Firebase Authentication (Recommended for Your Use Case)
Firebase is perfect for managing a small set of pre-defined users (consultants, admins) without building authentication from scratch.

Why Firebase for Pre-Defined Users?
✅ Zero auth backend code - Firebase handles everything ✅ Admin SDK - Create/manage users programmatically ✅ Custom claims - Assign roles (admin, consultant, viewer) ✅ Email verification - Built-in ✅ Password reset - Built-in ✅ Security rules - Control data access by role ✅ Free tier - Generous limits for small teams

Firebase Setup
1. Install Dependencies

bash
# Frontend
npm install firebase
npm install firebase-admin  # For admin operations (backend)
# Backend (for verifying tokens)
npm install firebase-admin
2. Initialize Firebase Project

typescript
// frontend/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
3. Backend Firebase Admin SDK

typescript
// backend/src/config/firebase-admin.ts
import admin from 'firebase-admin';
const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}'
);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
export const adminAuth = admin.auth();
Creating Pre-Defined Users (Admin Script)
typescript
// backend/scripts/createUsers.ts
import { adminAuth } from '../config/firebase-admin';
interface UserToCreate {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'consultant' | 'viewer';
}
const predefinedUsers: UserToCreate[] = [
  {
    email: 'admin@girardi.com',
    password: 'SecurePassword123!',
    displayName: 'Administrador',
    role: 'admin'
  },
  {
    email: 'consultor1@girardi.com',
    password: 'Consultor123!',
    displayName: 'João Silva',
    role: 'consultant'
  },
  {
    email: 'consultor2@girardi.com',
    password: 'Consultor123!',
    displayName: 'Maria Santos',
    role: 'consultant'
  }
];
async function createPredefinedUsers() {
  for (const user of predefinedUsers) {
    try {
      // Create user
      const userRecord = await adminAuth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.displayName,
        emailVerified: true, // Pre-verify internal users
      });
      // Set custom claims (role)
      await adminAuth.setCustomUserClaims(userRecord.uid, {
        role: user.role
      });
      console.log(`✅ Created user: ${user.email} (${user.role})`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error.message);
      }
    }
  }
}
createPredefinedUsers();
Frontend Auth Context
typescript
// frontend/contexts/AuthContext.tsx
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
interface AuthContextType {
  user: User | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Get custom claims (role)
        const idTokenResult = await user.getIdTokenResult();
        setUserRole(idTokenResult.claims.role as string || null);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };
  const signOut = async () => {
    await firebaseSignOut(auth);
  };
  return (
    <AuthContext.Provider value={{ user, userRole, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
Login Component
typescript
// frontend/components/LoginForm.tsx
'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/'); // Redirect to dashboard
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError('Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Login - Sistema Girardi</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white py-2 rounded hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
Protected Routes
typescript
// frontend/components/ProtectedRoute.tsx
'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && requiredRole && !requiredRole.includes(userRole || '')) {
      router.push('/unauthorized');
    }
  }, [user, userRole, loading, router, requiredRole]);
  if (loading) {
    return <div>Carregando...</div>;
  }
  if (!user) {
    return null;
  }
  if (requiredRole && !requiredRole.includes(userRole || '')) {
    return null;
  }
  return <>{children}</>;
}
// Usage in page
// app/page.tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';
import ReportForm from '@/components/ReportForm';
export default function Home() {
  return (
    <ProtectedRoute requiredRole={['admin', 'consultant']}>
      <div className="min-h-screen bg-muted">
        <ReportForm />
      </div>
    </ProtectedRoute>
  );
}
Backend Token Verification
typescript
// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../config/firebase-admin';
interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
  };
}
export const authenticateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No token provided' }
    });
  }
  const token = authHeader.substring(7);
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      role: decodedToken.role || 'viewer'
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
    });
  }
};
// Role-based middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      });
    }
    next();
  };
};
// Usage
app.post('/api/v1/reports', authenticateUser, requireRole(['admin', 'consultant']), createReport);
Frontend API Client with Auth
typescript
// frontend/lib/apiClient.ts
import { auth } from './firebase';
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const user = auth.currentUser;
  const token = user ? await user.getIdToken() : null;
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options?.headers,
    },
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error.message);
  }
  return data.data;
}
MongoDB Integration with Firebase UIDs
typescript
// backend/src/models/Report.ts
const reportSchema = new mongoose.Schema({
  // ... existing fields
  createdBy: { 
    type: String,  // Firebase UID
    required: true,
    index: true 
  },
  createdByEmail: String,
  createdByRole: String,
  // ... rest of schema
});
// When creating report
const createReport = async (req: AuthRequest, res: Response) => {
  const report = new Report({
    ...req.body,
    createdBy: req.user!.uid,
    createdByEmail: req.user!.email,
    createdByRole: req.user!.role
  });
  
  await report.save();
  // ...
};
Option B: Clerk (Easiest, Premium Features)
TIP

Clerk is the easiest solution but requires a paid plan for production

Pros:
✅ Pre-built UI components
✅ Zero configuration
✅ Built-in user management dashboard
✅ Organizations/teams support
✅ Amazing DX
Cons:
❌ Paid after 10,000 monthly active users
❌ Less customizable than Firebase
bash
npm install @clerk/nextjs
typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="pt-BR">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
// Protected page
import { auth } from '@clerk/nextjs';
export default async function Dashboard() {
  const { userId } = auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return <ReportForm />;
}
Option C: NextAuth.js (Self-Hosted, Free)
NOTE

NextAuth is great for credentials-based auth without external services

Pros:
✅ Completely free
✅ Self-hosted
✅ Supports multiple providers
✅ Session management
Cons:
❌ More backend code
❌ Need to manage user storage yourself
❌ Session management complexity
bash
npm install next-auth
typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { User } from '@/models/User';
const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await User.findOne({ email: credentials?.email });
        
        if (!user || !await user.comparePassword(credentials?.password)) {
          return null;
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
      }
      return session;
    }
  }
});
export { handler as GET, handler as POST };
Option D: Custom JWT (Full Control)
CAUTION

Only if you need complete control and understand security implications

This is what I outlined in the original plan - requires building everything yourself.

Authentication Comparison Table
Feature	Firebase	Clerk	NextAuth	Custom JWT
Setup Time	30 min	15 min	1 hour	4+ hours
Pre-defined Users	✅ Admin SDK	✅ Dashboard	🟡 Manual DB	🟡 Manual DB
Cost	Free tier generous	Paid for production	Free	Free
Security	⭐⭐⭐⭐⭐	⭐⭐⭐⭐⭐	⭐⭐⭐⭐	⭐⭐⭐ (if done right)
Customization	⭐⭐⭐⭐	⭐⭐⭐	⭐⭐⭐⭐⭐	⭐⭐⭐⭐⭐
Backend Code	Minimal	None	Medium	Heavy
User Management	Firebase Console	Clerk Dashboard	Custom	Custom
Recommendation for Your Use Case
Use Firebase Authentication because:

✅ Perfect for pre-defined users (use Admin SDK to create them)
✅ No backend auth code needed
✅ Free for your scale (small team)
✅ Custom claims for roles (admin, consultant, viewer)
✅ Battle-tested security
✅ Easy integration with MongoDB (store Firebase UID)
✅ Built-in email verification and password reset
Implementation Steps:

Create Firebase project
Run the createUsers.ts script to add your consultants
Wrap your app in AuthProvider
Protect routes with ProtectedRoute component
Add authenticateUser middleware to backend
Store Firebase UID in MongoDB reports
📋 Implementation Roadmap
Phase 1: Foundation (Week 1-2)
 Set up backend folder structure
 Install and configure MongoDB
 Create Mongoose models (Report, Product, User)
 Set up environment configuration
 Implement global error handler
 Add Zod validation schemas
 Create standardized API response format
Phase 2: Core Backend (Week 3-4)
 Implement Reports CRUD API
 Implement Product search/sync API
 Add MongoDB indexing
 Migrate CEP route to backend
 Add request logging
 Implement rate limiting
 Add input sanitization
Phase 3: Frontend Integration (Week 5)
 Create API client utilities
 Replace mock data with real API calls
 Add loading states and error handling
 Implement report saving/loading
 Add error boundaries
 Show validation errors from backend
Phase 4: Testing (Week 6)
 Set up Vitest for backend
 Write unit tests for services
 Write integration tests for API routes
 Set up React Testing Library
 Write component tests
 Set up Playwright for E2E tests
Phase 5: Security & Performance (Week 7)
 Add security middleware (helmet, rate limiting)
 Implement CORS properly
 Add database query optimization
 Implement caching (Redis optional)
 Add frontend performance optimizations
 Set up monitoring (optional: Sentry)
Phase 6: Documentation & Deployment (Week 8)
 Write API documentation (Swagger/OpenAPI)
 Document deployment process
 Set up Docker containers
 Configure production environment
 Set up CI/CD pipeline (GitHub Actions)
 Deploy to production
🚀 Quick Wins (Start Here)
These can be implemented immediately to see quick improvements:

Add proper error handling - Wrap all API calls in try-catch with user-friendly messages
Environment variables - Move hardcoded values to .env files
Input validation - Add Zod schemas for all forms
Error boundary - Wrap app in error boundary component
API response standardization - Create wrapper for all API responses
Loading states - Show spinners for all async operations
TypeScript strict mode - Enable strict: true in 

tsconfig.json
📚 Recommended Technologies
Backend
Framework: Express.js
Database: MongoDB + Mongoose
Validation: Zod
Logging: Winston
Testing: Vitest + Supertest
Security: Helmet, express-rate-limit
Documentation: Swagger/OpenAPI
Frontend
State Management: Zustand (current hooks are fine too)
Forms: React Hook Form + Zod
Testing: Vitest + React Testing Library + Playwright
Error Tracking: Sentry (optional)
DevOps
Containerization: Docker + Docker Compose
CI/CD: GitHub Actions
Hosting: Vercel (frontend) + Railway/Render (backend)
Monitoring: Sentry, LogRocket (optional)
💡 Key Takeaways
The main differences between junior and mid-senior level code are:

Architecture - Proper separation of concerns, clean folder structure
Error Handling - Comprehensive error handling, not just console.log
Validation - Schema-based validation on both client and server
Testing - Automated tests for critical paths
Security - Input sanitization, rate limiting, proper authentication
Observability - Structured logging, error tracking
Type Safety - Strict TypeScript, no any types
Documentation - Clear API docs, code comments where needed
Scalability - Database indexing, caching, performance optimization
Maintainability - Consistent patterns, DRY principle, modular code
Focus on implementing these concepts systematically, and your code quality will dramatically