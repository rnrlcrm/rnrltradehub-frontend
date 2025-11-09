# RNRL Trade Hub Frontend

A React-based frontend application for RNRL ERP Trade Hub built with Vite and TypeScript.

## Project Structure

```
rnrltradehub-frontend/
├── src/                          # Source code directory
│   ├── components/               # React components
│   │   ├── forms/               # Form components for data entry
│   │   ├── layout/              # Layout components (Header, Sidebar)
│   │   └── ui/                  # Reusable UI components (Card, Modal, Form, Table, icons)
│   ├── pages/                   # Page components
│   ├── data/                    # Data and mock data files
│   ├── hooks/                   # Custom React hooks
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   └── index.tsx                # Application entry point
├── index.html                   # HTML template
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

## Technology Stack

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **ESLint** - Code linting

## Folder Organization

### `/src/components/`
Contains all reusable React components organized by type:
- **forms/** - Form components for various data entry screens
- **layout/** - Layout components like Header and Sidebar
- **ui/** - Basic UI components like Card, Modal, Table, etc.

### `/src/pages/`
Contains page-level components that represent different views/routes in the application.

### `/src/data/`
Contains data files, mock data, and data utilities.

### `/src/hooks/`
Contains custom React hooks for shared logic.

## Contributing

When adding new components or features, please follow the existing folder structure to maintain consistency.
