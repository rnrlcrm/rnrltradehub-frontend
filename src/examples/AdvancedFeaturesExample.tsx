import React, { useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  DatePicker,
  MultiSelect,
  FileUploader,
  QuickActionsPanel,
  AuditDrawer,
  KeyboardShortcuts,
  useQuickActions,
  useAuditDrawer,
  useKeyboardShortcuts,
  Badge,
} from '../components/ui/shadcn';
import {
  FileText,
  Users,
  Settings,
  Calendar,
  Upload,
  Command,
  History,
  Keyboard,
} from 'lucide-react';

export const AdvancedFeaturesExample: React.FC = () => {
  // DatePicker state
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // MultiSelect state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // FileUploader state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Quick Actions
  const quickActions = useQuickActions();
  const actions = [
    {
      id: 'new-contract',
      label: 'New Contract',
      description: 'Create a new sales contract',
      icon: FileText,
      keywords: ['create', 'sales', 'sc'],
      onSelect: () => alert('Creating new contract...'),
    },
    {
      id: 'add-client',
      label: 'Add Client',
      description: 'Register a new client',
      icon: Users,
      keywords: ['client', 'customer', 'vendor'],
      onSelect: () => alert('Adding new client...'),
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open application settings',
      icon: Settings,
      keywords: ['config', 'preferences'],
      onSelect: () => alert('Opening settings...'),
    },
  ];

  // Audit Drawer
  const auditDrawer = useAuditDrawer();
  
  // Add sample audit entries
  React.useEffect(() => {
    auditDrawer.addEntry({
      action: 'Created',
      user: 'John Doe',
      details: 'Initial contract creation',
      changes: [
        { field: 'Status', oldValue: '', newValue: 'Draft' },
        { field: 'Amount', oldValue: '', newValue: '₹1,000,000' },
      ],
    });
    auditDrawer.addEntry({
      action: 'Updated',
      user: 'Jane Smith',
      details: 'Updated contract terms',
      changes: [
        { field: 'Status', oldValue: 'Draft', newValue: 'Active' },
        { field: 'Payment Terms', oldValue: '30 days', newValue: '45 days' },
      ],
    });
  }, []);

  // Keyboard Shortcuts
  const shortcuts = [
    {
      id: 'search',
      keys: ['Ctrl', 'K'],
      description: 'Open global search',
      category: 'Navigation',
      action: () => alert('Opening search...'),
    },
    {
      id: 'quick-actions',
      keys: ['Ctrl', 'Shift', 'K'],
      description: 'Open quick actions',
      category: 'Navigation',
      action: () => quickActions.setOpen(true),
    },
    {
      id: 'new-contract',
      keys: ['Ctrl', 'N'],
      description: 'Create new contract',
      category: 'Actions',
      action: () => alert('Creating new contract...'),
    },
    {
      id: 'save',
      keys: ['Ctrl', 'S'],
      description: 'Save current changes',
      category: 'Actions',
      action: () => alert('Saving...'),
    },
    {
      id: 'audit',
      keys: ['Ctrl', 'H'],
      description: 'View audit history',
      category: 'View',
      action: () => auditDrawer.setOpen(true),
    },
  ];

  const keyboardShortcutsHook = useKeyboardShortcuts(shortcuts);

  const multiSelectOptions = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
    { value: '4', label: 'Option 4' },
    { value: '5', label: 'Option 5' },
  ];

  return (
    <>
      <PageShell
        title="Advanced Features Demo"
        description="Showcase of DatePicker, MultiSelect, FileUploader, Quick Actions, Audit Drawer, and Keyboard Shortcuts"
        breadcrumbs={[
          { label: 'Home' },
          { label: 'Examples' },
          { label: 'Advanced Features' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => keyboardShortcutsHook.setOpen(true)}>
              <Keyboard className="mr-2 h-4 w-4" />
              Shortcuts (?)
            </Button>
            <Button variant="outline" onClick={() => quickActions.setOpen(true)}>
              <Command className="mr-2 h-4 w-4" />
              Quick Actions (Ctrl+Shift+K)
            </Button>
            <Button onClick={() => auditDrawer.setOpen(true)}>
              <History className="mr-2 h-4 w-4" />
              View History (Ctrl+H)
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {/* New Components Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* DatePicker */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  DatePicker Component
                </CardTitle>
                <CardDescription>
                  Select dates with a beautiful calendar interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Date</label>
                  <DatePicker
                    date={selectedDate}
                    onDateChange={setSelectedDate}
                    placeholder="Pick a date"
                  />
                </div>
                {selectedDate && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    <p className="text-sm">
                      <strong>Selected:</strong> {selectedDate.toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MultiSelect */}
            <Card>
              <CardHeader>
                <CardTitle>MultiSelect Component</CardTitle>
                <CardDescription>
                  Select multiple options with search and badges
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Options</label>
                  <MultiSelect
                    options={multiSelectOptions}
                    value={selectedOptions}
                    onChange={setSelectedOptions}
                    placeholder="Select multiple..."
                  />
                </div>
                {selectedOptions.length > 0 && (
                  <div className="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                    <p className="text-sm">
                      <strong>Selected ({selectedOptions.length}):</strong>{' '}
                      {selectedOptions.join(', ')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* FileUploader */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                FileUploader Component
              </CardTitle>
              <CardDescription>
                Drag & drop file upload with preview and management
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploader
                value={uploadedFiles}
                onChange={setUploadedFiles}
                accept="image/*,.pdf,.doc,.docx"
                maxFiles={5}
                maxSize={10 * 1024 * 1024}
              />
            </CardContent>
          </Card>

          {/* Features Info */}
          <Card>
            <CardHeader>
              <CardTitle>Functional UX Enhancements</CardTitle>
              <CardDescription>Try out the new features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <Command className="h-8 w-8 text-primary-500 mb-2" />
                  <h4 className="font-semibold mb-1">Quick Actions</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Press Ctrl+Shift+K to open the quick actions panel
                  </p>
                  <Badge variant="outline">Ctrl+Shift+K</Badge>
                </div>

                <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <History className="h-8 w-8 text-primary-500 mb-2" />
                  <h4 className="font-semibold mb-1">Audit History</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Press Ctrl+H to view version history and changes
                  </p>
                  <Badge variant="outline">Ctrl+H</Badge>
                </div>

                <div className="p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg">
                  <Keyboard className="h-8 w-8 text-primary-500 mb-2" />
                  <h4 className="font-semibold mb-1">Keyboard Shortcuts</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    Press ? to view all available keyboard shortcuts
                  </p>
                  <Badge variant="outline">?</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageShell>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        actions={actions}
        open={quickActions.open}
        onOpenChange={quickActions.setOpen}
      />

      {/* Audit Drawer */}
      <AuditDrawer
        open={auditDrawer.open}
        onOpenChange={auditDrawer.setOpen}
        entries={auditDrawer.entries}
        title="Contract History"
      />

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts
        shortcuts={shortcuts}
        open={keyboardShortcutsHook.open}
        onOpenChange={keyboardShortcutsHook.setOpen}
      />
    </>
  );
};
