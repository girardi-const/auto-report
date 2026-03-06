# Auto Report Backend API

Backend API for the Girardi Auto Report System built with Express, MongoDB, and TypeScript.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your `.env` file with your credentials:
   - MongoDB connection string
   - API keys
   - Firebase service account (if using authentication)

### Running the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

### Environment Variables

See `.env.example` for all required environment variables.

Critical variables:
- `MONGODB_URI` - MongoDB connection string
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret for JWT tokens (change in production!)
- `ALLOWED_ORIGINS` - CORS allowed origins

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Mongoose models
│   ├── controllers/     # Route controllers
│   ├── routes/          # Express routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── validators/      # Zod validation schemas
│   ├── utils/           # Utility functions
│   ├── types/           # TypeScript types
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── logs/                # Application logs
├── uploads/             # Uploaded files
└── dist/                # Compiled JavaScript
```

## 🔌 API Endpoints

### Health Check
- `GET /health` - Server health status

### API Root
- `GET /api/v1` - API information

### Coming Soon
- `/api/v1/reports` - Report CRUD operations
- `/api/v1/products` - Product management
- `/api/v1/auth` - Authentication

## 🛠️ Development

### Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

### Code Style

- TypeScript with strict mode
- ESLint for linting
- Prettier for formatting

## 📝 License

MIT
