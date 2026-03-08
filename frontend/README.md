# Auto Report – Frontend

This repository contains the **frontend application** for the Auto Report system.  
It is built with **Next.js** and provides the user interface for generating and visualizing automated reports.

## Project Overview

Auto Report is a modern, full-stack sales reporting platform designed to streamline the creation of professional product catalogs and sales quotes. This system allows users to organize products into custom sections, manage pricing with dynamic margins, and generate high-quality PDF and Excel exports.

---

## Tech Stack

- **Next.js** - React framework for production
- **React** - UI library
- **TypeScript** (96.3%) - Type-safe development
- **Tailwind CSS** (0.9%) - Utility-first CSS framework
- **JavaScript** (2.8%) - Dynamic functionality
- **REST API integration** - Backend communication

---

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

First, install the dependencies:

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open your browser at:

```
http://localhost:3000
```

The page will automatically reload when you edit the code.

### Project Structure

```
app/            # Next.js pages and routing
components/     # Reusable UI components
lib/            # Utility functions and helpers
styles/         # Global styles
public/         # Static assets
```

---

## Environment Variables

Create a file called `.env.local` in the root of the project.

### Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

This should point to the Auto Report backend API.

---

## Available Scripts

### Start development server

```bash
npm run dev
```

### Build the project

```bash
npm run build
```

### Start production server

```bash
npm run start
```

### Run linting

```bash
npm run lint
```

---

## Deployment

The easiest way to deploy this project is with **Vercel**.

### Steps:

1. Connect this repository to Vercel
2. Configure environment variables
3. Deploy

For more information, visit: [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)

---

## License

MIT