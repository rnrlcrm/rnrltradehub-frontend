# RNRL Trade Hub Frontend

A React-based frontend application for RNRL ERP Trade Hub built with Vite and TypeScript. Features an enterprise-grade design system following patterns from SAP Fiori 3.0, Odoo 17, Oracle Fusion Cloud, and Microsoft Dynamics 365.

## 🎨 Design System

A comprehensive design system with:
- **Design Tokens**: Single source of truth for colors, typography, spacing
- **Component Library**: 20+ enterprise-grade UI components built with Radix UI
- **Responsive Layouts**: Mobile-first, adaptive designs
- **Dark Mode**: Full theme support with CSS variables
- **Accessibility**: WCAG AA compliant components

📖 **[View Design System Documentation](docs/DESIGN_SYSTEM.md)**  
📝 **[View Implementation Summary](DESIGN_SYSTEM_IMPLEMENTATION.md)**

## Project Structure

```
rnrltradehub-frontend/
├── src/                          # Source code directory
│   ├── design-system/            # Design tokens and theme
│   ├── components/               # React components
│   │   ├── forms/               # Form components for data entry
│   │   ├── layout/              # Layout components (Header, Sidebar, PageShell)
│   │   └── ui/
│   │       └── shadcn/          # Enterprise UI components
│   ├── pages/                   # Page components
│   ├── data/                    # Data and mock data files
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   ├── utils/                   # Utility functions (CCI calculations, GST, notifications)
│   ├── examples/                # Component examples
│   ├── types.ts                 # TypeScript type definitions
│   ├── App.tsx                  # Main application component
│   ├── index.tsx                # Application entry point
│   └── index.css                # Global styles
├── docs/                        # Documentation
│   ├── DESIGN_SYSTEM.md         # Design system documentation
│   └── CCI_SETTING_MASTER.md   # CCI Setting Master developer guide
├── index.html                   # HTML template
├── package.json                 # Project dependencies
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite configuration
└── README.md                    # This file
```

## Key Features

### Enterprise Design System
A complete design system with:
- **20+ UI Components**: Button, Input, Select, Card, Dialog, Drawer, etc.
- **Collapsible Sidebar**: Space-efficient navigation with tooltips
- **Global Search**: Quick access with Ctrl+K
- **Responsive Grid**: 12-column adaptive layout
- **Theme Support**: Light/dark mode ready
- **Accessibility**: Screen reader friendly, keyboard navigation

### Core Business Modules

#### Quality Inspection & Inventory
- **Quality Inspection**: Multi-parameter quality checks with approve/reject/resample workflows
- **Inventory Management**: Multi-location warehouse tracking with quality grades
- **Document Management**: Upload with OCR summary support for inspection reports
- **Audit Trail**: Complete history of all quality actions

📖 **[View Quality & Inventory Documentation](ERP_MODULES_DOCUMENTATION.md#quality-inspection--inventory)**

#### Logistics & Delivery
- **Delivery Order Management**: Create, assign, track, and manage deliveries
- **Transport Tracking**: Vehicle, driver, and route management
- **Status Workflow**: Pending → Assigned → In Transit → Delivered
- **Document Upload**: Delivery challan, LR copy, e-way bills with OCR

📖 **[View Logistics Documentation](ERP_MODULES_DOCUMENTATION.md#logistics--delivery)**

#### Ledger & Reconciliation
- **Ledger Management**: Account balances, party-wise transactions, debit/credit tracking
- **Reconciliation**: Party, contract, and period reconciliation with discrepancy tracking
- **Export Options**: PDF and Excel export for all financial reports
- **Real-time Balances**: Live outstanding and overdue tracking

📖 **[View Ledger & Reconciliation Documentation](ERP_MODULES_DOCUMENTATION.md#ledger--accounts)**

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

- **React** (v18+) - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** (v3) - Utility-first CSS framework
- **Radix UI** - Headless accessible components
- **Lucide React** - Icon library (400+ icons)
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **TanStack Table** - Advanced data tables
- **Recharts** - Data visualization
- **ESLint** - Code linting

## Design System Components

### Layout
- `PageShell` - Consistent page wrapper with breadcrumbs
- `Sidebar` - Collapsible navigation
- `Header` - Global header with search

### Form Components
- `Button` - 8 variants, 5 sizes
- `Input` - Text input with validation states
- `Select` - Dropdown with search
- `Textarea` - Multi-line input
- `Switch` - Toggle component
- `Label` - Accessible labels

### Data Display
- `Card` - Container with sections
- `Badge` - Status chips
- `Avatar` - User avatars

### Feedback
- `Alert` - Notification banners
- `Dialog` - Modal dialogs
- `Spinner` - Loading indicators

### Navigation
- `Breadcrumbs` - Navigation trail
- `Tabs` - Tabbed interface

### Utilities
- `Drawer` - Side panels
- `Tooltip` - Hover tooltips

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
