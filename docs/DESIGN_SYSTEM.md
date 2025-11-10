# ERP Design System Documentation

## Overview

This design system provides a comprehensive set of reusable components and design tokens following enterprise-grade patterns inspired by SAP Fiori 3.0, Odoo 17 Enterprise, Oracle Fusion Cloud, and Microsoft Dynamics 365.

## Design Principles

- **Consistency**: Single source of truth for all visual elements
- **Clean Whitespace**: Proper spacing and breathing room
- **Soft Shadows**: Subtle depth with muted colors
- **High Data Density**: Efficient information display
- **Predictable Layouts**: Standardized component patterns
- **Responsive First**: Adaptive layouts for all screen sizes

## Design Tokens

All design tokens are defined in `src/design-system/tokens.ts`. These tokens drive the Tailwind configuration.

### Color Palette

#### Primary Colors (IBM Blue / SAP Fiori Blue)
- `primary-500`: #0F62FE (Main brand color)
- Range: `primary-50` to `primary-900`

#### Accent Colors (Teal)
- `accent-500`: #009688 (Highlight color)
- Range: `accent-50` to `accent-900`

#### Neutral Colors
- `neutral-50`: #F9FAFB (Lightest)
- `neutral-200`: #E5E7EB (Borders)
- `neutral-900`: #111827 (Text)

#### Semantic Colors
- **Success**: `#10B981`
- **Warning**: `#F59E0B`
- **Error**: `#EF4444`
- **Info**: `#3B82F6`

### Typography

**Font Family**: Inter, Roboto, Noto Sans

**Font Sizes**:
- `text-xs`: 12px
- `text-sm`: 14px (Body text)
- `text-base`: 16px (Subtitle)
- `text-xl`: 20px (Title)

**Font Weights**:
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

### Spacing Scale

Based on 8px grid:
- `4px`, `8px`, `16px`, `24px`, `32px`

### Border Radius
- `rounded-md`: 8px (Default for cards, modals, inputs)

### Shadows
- `shadow`: 0 2px 6px rgba(0,0,0,0.1) (Default soft shadow)

## Component Library

### Layout Components

#### PageShell
Provides consistent page structure with breadcrumbs, title, description, and actions.

```tsx
<PageShell
  title="Dashboard"
  description="Overview of your ERP system"
  breadcrumbs={[
    { label: 'Home', onClick: () => {} },
    { label: 'Dashboard' }
  ]}
  actions={
    <Button>Add New</Button>
  }
>
  {/* Page content */}
</PageShell>
```

#### Sidebar
Collapsible navigation sidebar with icon + label format and tooltips.

- Responsive design
- Collapsible via menu button
- Role-based navigation items
- Tooltips when collapsed

#### Header
Global header with:
- Organization selector
- Financial year selector
- Global search (Ctrl+K)
- Notifications
- User profile menu

### Form Components

#### Button
```tsx
<Button variant="default" size="default">Click me</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="success">Save</Button>
```

Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `success`, `warning`
Sizes: `default`, `sm`, `lg`, `xl`, `icon`

#### Input
```tsx
<Input type="text" placeholder="Enter text" />
```

#### Label
```tsx
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

#### Select
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Textarea
```tsx
<Textarea placeholder="Enter description" />
```

#### Switch
```tsx
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

### Data Display Components

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Footer actions */}
  </CardFooter>
</Card>
```

#### Badge (Status Chip)
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
```

Variants: `default`, `secondary`, `success`, `warning`, `error`, `info`, `outline`

#### Avatar
```tsx
<Avatar 
  src="/path/to/image.jpg" 
  alt="User Name"
  fallback="UN"
  size="default"
/>
```

Sizes: `sm`, `default`, `lg`, `xl`

### Feedback Components

#### Alert
```tsx
<Alert variant="success">
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>Your changes have been saved.</AlertDescription>
</Alert>
```

Variants: `default`, `success`, `warning`, `error`, `info`

#### Dialog (Modal)
```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
      <DialogDescription>Dialog description</DialogDescription>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Spinner
```tsx
<Spinner label="Loading..." />
<InlineSpinner size="sm" />
```

### Navigation Components

#### Breadcrumbs
```tsx
<Breadcrumbs 
  items={[
    { label: 'Home', onClick: () => navigate('/') },
    { label: 'Settings', onClick: () => navigate('/settings') },
    { label: 'Organization' }
  ]}
/>
```

#### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Utility Components

#### Drawer
Right-side panel for filters, context actions, or info summary.

```tsx
<Drawer>
  <DrawerTrigger asChild>
    <Button>Open Drawer</Button>
  </DrawerTrigger>
  <DrawerContent side="right">
    <DrawerHeader>
      <DrawerTitle>Drawer Title</DrawerTitle>
      <DrawerDescription>Drawer description</DrawerDescription>
    </DrawerHeader>
    {/* Content */}
    <DrawerFooter>
      <Button>Apply</Button>
    </DrawerFooter>
  </DrawerContent>
</Drawer>
```

#### Tooltip
```tsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>Hover me</TooltipTrigger>
    <TooltipContent>
      <p>Tooltip content</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

## Utility Functions

### cn() - Class Name Utility
Combines `clsx` and `tailwind-merge` for intelligent class merging.

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-classes',
  condition && 'conditional-classes',
  className // User-provided classes
)} />
```

## Dark Mode Support

The design system includes CSS variables for dark mode theming. Toggle dark mode by adding/removing the `dark` class on the root element.

```tsx
// Toggle dark mode
document.documentElement.classList.toggle('dark');
```

## Responsive Breakpoints

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Best Practices

### Component Usage
1. Always use design system components over custom implementations
2. Maintain consistent spacing using the 8px grid
3. Use semantic color variants (success, warning, error, info)
4. Leverage the PageShell component for page layouts

### Accessibility
1. All interactive components include proper ARIA labels
2. Focus states are clearly visible
3. Keyboard navigation is fully supported
4. Color contrast meets WCAG AA standards

### Performance
1. Components are tree-shakeable
2. Use lazy loading for heavy components
3. Optimize images and assets
4. Minimize bundle size with code splitting

## Migration Guide

To migrate existing components to the design system:

1. Replace inline Tailwind classes with design tokens
2. Use shadcn/ui components instead of custom UI elements
3. Wrap pages with PageShell for consistent layout
4. Update color classes to use the new palette
5. Replace custom modals/dialogs with Dialog component

## Future Enhancements

- [ ] Toast notification system
- [ ] Data table with TanStack Table
- [ ] Form validation with React Hook Form + Zod
- [ ] Charts with Recharts
- [ ] Date picker component
- [ ] Multi-select component
- [ ] File uploader component
- [ ] Advanced search with filters
- [ ] Quick actions panel
- [ ] Auto-save functionality
- [ ] Keyboard shortcuts system
