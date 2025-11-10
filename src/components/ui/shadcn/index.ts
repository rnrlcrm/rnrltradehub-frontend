/**
 * Design System Components Index
 * 
 * Central export point for all design system components
 */

// Form Components
export { Button, buttonVariants } from './button';
export type { ButtonProps } from './button';

export { Input } from './input';
export type { InputProps } from './input';

export { Label } from './label';

export { Textarea } from './textarea';
export type { TextareaProps } from './textarea';

export { Switch } from './switch';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from './select';

export { DatePicker } from './datepicker';
export type { DatePickerProps } from './datepicker';

export { MultiSelect } from './multiselect';
export type { MultiSelectProps, MultiSelectOption } from './multiselect';

export { FileUploader } from './fileuploader';
export type { FileUploaderProps } from './fileuploader';

// Data Display Components
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';

export { Badge, badgeVariants } from './badge';
export type { BadgeProps } from './badge';

export { Avatar } from './avatar';
export type { AvatarProps } from './avatar';

// Feedback Components
export { Alert, AlertTitle, AlertDescription } from './alert';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './dialog';

export { Spinner, InlineSpinner } from './spinner';
export type { SpinnerProps } from './spinner';

// Navigation Components
export { Breadcrumbs } from './breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './breadcrumbs';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

// Utility Components
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from './drawer';

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from './tooltip';

export { QuickActionsPanel, useQuickActions } from './quickactions';
export type { QuickActionsPanelProps, QuickAction } from './quickactions';

export { AuditDrawer, useAuditDrawer } from './auditdrawer';
export type { AuditDrawerProps, AuditEntry } from './auditdrawer';

export { KeyboardShortcuts, useKeyboardShortcuts } from './keyboardshortcuts';
export type { KeyboardShortcutsProps, KeyboardShortcut } from './keyboardshortcuts';
