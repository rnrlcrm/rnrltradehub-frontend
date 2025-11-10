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
│   ├── utils/                   # Utility functions (CCI calculations, GST, notifications)
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   └── index.tsx                # Application entry point
├── docs/                        # Documentation
│   └── CCI_SETTING_MASTER.md   # CCI Setting Master developer guide
├── index.html                   # HTML template
├── package.json                 # Project dependencies
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## Key Features

### CCI Setting Master
A comprehensive configuration system for Cotton Corporation of India (CCI) trade operations:
- **Zero Hardcoded Values**: All financial parameters are configurable
- **Version Tracking**: Full audit trail of settings used in calculations
- **Dynamic Calculations**: EMD, carrying charges, late lifting, moisture adjustments
- **Buyer Type Support**: Different rates for KVIC, Private Mills, and Traders
- **Historical Accuracy**: Old invoices retain settings valid at creation time

📖 **[View CCI Setting Master Documentation](docs/CCI_SETTING_MASTER.md)**

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
- **ui/** - Basic UI components like Card, Modal, Table, CciCalculationDisplay, etc.

### `/src/pages/`
Contains page-level components that represent different views/routes in the application.

### `/src/data/`
Contains data files, mock data, and data utilities.

### `/src/hooks/`
Contains custom React hooks for shared logic.

### `/src/utils/`
Contains utility functions:
- **cciCalculations.ts** - CCI Setting Master calculation functions
- **gstCalculations.ts** - GST calculation utilities
- **notifications.ts** - Notification helpers
- **automation.ts** - Automation utilities

### `/docs/`
Contains project documentation:
- **CCI_SETTING_MASTER.md** - Comprehensive guide for CCI Setting Master integration

## CCI Calculations

All CCI-related calculations use the CCI Setting Master configuration. Example:

```typescript
import { 
  getActiveCciSetting, 
  calculateEmdAmount,
  calculateCarryingCharge 
} from './utils/cciCalculations';

// Get active setting for a date
const setting = getActiveCciSetting(cciTerms, '2024-07-15');

// Calculate EMD
const emdAmount = calculateEmdAmount(setting, invoiceAmount, 'privateMill');

// Calculate carrying charges
const carryingCharge = calculateCarryingCharge(setting, netInvoice, 45);
```

See [CCI Setting Master Documentation](docs/CCI_SETTING_MASTER.md) for complete usage guide.

## Contributing

When adding new components or features, please follow the existing folder structure to maintain consistency.
