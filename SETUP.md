# Uboho Dashboard - Setup Guide

This guide will help you set up and run the Uboho Dashboard project locally.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.0.0 or higher)
  - Download from: https://nodejs.org/
  - Verify installation: `node --version`
- **npm** (usually comes with Node.js)
  - Verify installation: `npm --version`
- **Git** (for cloning the repository)
  - Download from: https://git-scm.com/

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Uboho-Dashboard
```

### 2. Install Dependencies

Run one of the following commands to install all required packages:

```bash
# Using npm
npm install

# Or using yarn (if you prefer)
yarn install

# Or using pnpm (if you prefer)
pnpm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Dependencies

### Core Dependencies

- **React** (v19.0.0) - Frontend framework
- **React DOM** (v19.0.0) - React rendering library
- **React Router DOM** (v7.5.3) - Client-side routing

### UI and Styling

- **Bootstrap** (v5.3.5) - CSS framework for responsive design

### Charts and Visualization

- **Chart.js** (v4.4.9) - JavaScript charting library
- **React Chart.js 2** (v5.3.0) - React wrapper for Chart.js
- **Recharts** (v2.15.3) - Composable charting library for React

### Maps

- **Leaflet** (v1.9.4) - Interactive maps library
- **React Leaflet** (v5.0.0) - React components for Leaflet maps

### Build Tools and Configuration

- **@craco/craco** (v7.1.0) - Configuration layer for Create React App

### Development Dependencies

- **Vite** (v6.3.1) - Build tool and development server
- **@vitejs/plugin-react** (v4.3.4) - Vite plugin for React
- **ESLint** (v9.22.0) - JavaScript linting tool
- **@eslint/js** (v9.22.0) - ESLint JavaScript configurations
- **eslint-plugin-react-hooks** (v5.2.0) - ESLint rules for React Hooks
- **eslint-plugin-react-refresh** (v0.4.19) - ESLint plugin for React Refresh
- **globals** (v16.0.0) - Global identifiers for ESLint
- **@types/react** (v19.0.10) - TypeScript definitions for React
- **@types/react-dom** (v19.0.4) - TypeScript definitions for React DOM

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint for code quality
- `npm run preview` - Preview production build locally

## Project Structure

```
Uboho-Dashboard/
├── public/           # Static assets (images, icons, etc.)
├── src/
│   ├── components/   # Reusable React components
│   ├── pages/        # Page components
│   ├── utils/        # Utility functions
│   ├── fonts/        # Custom fonts
│   └── assets/       # Application assets
├── package.json      # Project dependencies and scripts
├── vite.config.js    # Vite configuration
└── eslint.config.js  # ESLint configuration
```

## Features

- **Dashboard Overview** - Patient statistics and analytics
- **Patient Management** - Add, view, and manage patient data
- **Interactive Maps** - Location-based patient tracking using Leaflet
- **Data Visualization** - Charts and graphs using Chart.js and Recharts
- **Search Functionality** - Global search across all application data
- **Responsive Design** - Mobile-friendly interface using Bootstrap
- **Admin Panel** - Administrative functions and settings
- **Message System** - Communication features
- **Real-time Updates** - Live data updates and notifications

## Troubleshooting

### Common Issues

1. **Node.js version issues**

   - Ensure you're using Node.js version 18.0.0 or higher
   - Use `node --version` to check your current version

2. **Package installation fails**

   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`, then run `npm install` again

3. **Development server won't start**

   - Check if port 5173 is already in use
   - Try running on a different port: `npm run dev -- --port 3000`

4. **Map not loading**
   - Ensure internet connection is available (Leaflet requires external tile servers)
   - Check browser console for any JavaScript errors

### Getting Help

If you encounter any issues:

1. Check the browser console for error messages
2. Ensure all dependencies are properly installed
3. Verify that your Node.js version meets the requirements
4. Check if all required environment variables are set (if any)

## License

[Add your license information here]

## Contributing

[Add contribution guidelines here]
