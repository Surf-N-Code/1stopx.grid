'use client';

import * as React from 'react';
import type { JSX } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { COLUMN_SCRIPTS } from '@/lib/utils/column-scripts';

interface Column {
  id: number;
  heading: string;
  dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
  aiPrompt?: string;
  isManagement?: boolean;
  useWebSearch?: boolean;
  scriptToPopulate?: string;
  scriptRequiredFields?: string;
}

interface AddColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    heading: string;
    dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
    aiPrompt?: string;
    useWebSearch?: boolean;
    scriptToPopulate?: string;
    scriptRequiredFields?: string;
  }) => Promise<void>;
  editColumn?: Column;
  existingColumns: Column[];
}

export function AddColumnModal({
  open,
  onOpenChange,
  onSubmit,
  editColumn,
  existingColumns,
}: AddColumnModalProps) {
  const [heading, setHeading] = React.useState(editColumn?.heading || '');
  const [dataType, setDataType] = React.useState<
    'text' | 'number' | 'email' | 'url' | 'boolean'
  >(editColumn?.dataType || 'text');
  const [aiPrompt, setAiPrompt] = React.useState(editColumn?.aiPrompt || '');
  const [useWebSearch, setUseWebSearch] = React.useState(
    editColumn?.useWebSearch || false
  );
  const [scriptToPopulate, setScriptToPopulate] = React.useState<string>(
    editColumn?.scriptToPopulate || 'none'
  );
  const [error, setError] = React.useState<string | null>(null);
  const [showRequiredColumnsDialog, setShowRequiredColumnsDialog] =
    React.useState(false);
  const [scriptRequiredFields, setScriptRequiredFields] = React.useState<
    Record<string, number>
  >({});
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [highlightedText, setHighlightedText] =
    React.useState<JSX.Element | null>(null);

  React.useEffect(() => {
    if (editColumn) {
      setHeading(editColumn.heading);
      setDataType(editColumn.dataType);
      setAiPrompt(editColumn.aiPrompt || '');
      setUseWebSearch(editColumn.useWebSearch || false);
      setScriptToPopulate(editColumn.scriptToPopulate || 'none');
    } else {
      setHeading('');
      setDataType('text');
      setAiPrompt('');
      setUseWebSearch(false);
      setScriptToPopulate('none');
    }
  }, [editColumn]);

  // Check for required columns when script is selected
  React.useEffect(() => {
    if (scriptToPopulate && scriptToPopulate !== 'none') {
      const script = COLUMN_SCRIPTS.find((s) => s.id === scriptToPopulate);
      if (script?.requiredColumns?.length) {
        // Initialize required columns with empty selections
        const requiredColumns = script.requiredColumns.reduce(
          (acc, col) => ({
            ...acc,
            [col.content]: 0,
          }),
          {}
        );
        setScriptRequiredFields(requiredColumns);
        setShowRequiredColumnsDialog(true);
      }
    }
  }, [scriptToPopulate]);

  // Function to highlight column references
  const highlightColumnReferences = (text: string) => {
    const columnNames = existingColumns.map((col) => col.heading.toLowerCase());
    const pattern = /{{([^}]+)}}/g;
    let lastIndex = 0;
    const elements: JSX.Element[] = [];
    let match;

    while ((match = pattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        elements.push(
          <span key={`text-${lastIndex}`}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }

      const columnName = match[1].trim().toLowerCase();
      const isValidColumn = columnNames.includes(columnName);

      // Add the matched text with appropriate styling
      elements.push(
        <span
          key={`col-${match.index}`}
          className={
            isValidColumn
              ? 'text-blue-500 font-medium'
              : 'text-red-500 font-medium'
          }
          title={isValidColumn ? 'Valid column reference' : 'Unknown column'}
        >
          {match[0]}
        </span>
      );

      lastIndex = pattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>{text.slice(lastIndex)}</span>
      );
    }

    return <>{elements}</>;
  };

  // Update highlighted text when aiPrompt changes
  React.useEffect(() => {
    setHighlightedText(highlightColumnReferences(aiPrompt));
  }, [aiPrompt, existingColumns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!heading.trim()) {
      setError('Column heading is required');
      return;
    }

    // Check if heading already exists (case-insensitive)
    const headingExists = existingColumns.some(
      (col) =>
        col.heading.toLowerCase() === heading.toLowerCase() &&
        (!editColumn || col.id !== editColumn.id)
    );

    if (headingExists) {
      setError('A column with this heading already exists');
      return;
    }

    // Check if all required columns are selected for the script
    if (scriptToPopulate && scriptToPopulate !== 'none') {
      const script = COLUMN_SCRIPTS.find((s) => s.id === scriptToPopulate);
      if (script?.requiredColumns?.length) {
        const allColumnsSelected = script.requiredColumns.every(
          (col) => scriptRequiredFields[col.content]
        );
        if (!allColumnsSelected) {
          setError('Please select all required columns for the script');
          setShowRequiredColumnsDialog(true);
          return;
        }
      }
    }

    try {
      // Convert scriptRequiredFields to the new format
      let scriptRequiredFieldsJson: string | undefined;
      if (scriptToPopulate && scriptToPopulate !== 'none') {
        const script = COLUMN_SCRIPTS.find((s) => s.id === scriptToPopulate);
        if (script?.requiredColumns?.length) {
          const requiredFields = script.requiredColumns.map((col) => ({
            field:
              existingColumns.find(
                (c) => c.id === scriptRequiredFields[col.content]
              )?.heading || '',
            description: col.description,
          }));
          scriptRequiredFieldsJson = JSON.stringify(requiredFields);
        }
      }

      await onSubmit({
        heading: heading.trim(),
        dataType,
        aiPrompt: aiPrompt.trim() || undefined,
        useWebSearch,
        scriptToPopulate:
          scriptToPopulate === 'none' ? undefined : scriptToPopulate,
        scriptRequiredFields: scriptRequiredFieldsJson,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add column');
    }
  };

  const handleScriptChange = (value: string) => {
    setScriptToPopulate(value);
    setScriptRequiredFields({});

    if (value !== 'none') {
      const script = COLUMN_SCRIPTS.find((s) => s.id === value);
      if (script?.requiredColumns?.length) {
        // Initialize required columns with empty selections
        const initialColumns = script.requiredColumns.reduce(
          (acc, col) => ({
            ...acc,
            [col.content]: 0,
          }),
          {}
        );
        setScriptRequiredFields(initialColumns);
        // Show the dialog immediately
        setShowRequiredColumnsDialog(true);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editColumn ? 'Edit Column' : 'Add New Column'}
          </DialogTitle>
          <DialogDescription>
            {editColumn
              ? 'Modify the column settings below.'
              : 'Add a new column to your table.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="heading" className="text-sm font-medium">
              Column Heading
            </label>
            <Input
              id="heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Enter column heading"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="dataType" className="text-sm font-medium">
              Data Type
            </label>
            <Select
              value={dataType}
              onValueChange={(
                value: 'text' | 'number' | 'email' | 'url' | 'boolean'
              ) => setDataType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="boolean">Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="scriptToPopulate" className="text-sm font-medium">
              Column Script
            </label>
            <Select value={scriptToPopulate} onValueChange={handleScriptChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a script (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {COLUMN_SCRIPTS.map((script) => (
                  <SelectItem key={script.id} value={script.id}>
                    {script.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="aiPrompt" className="text-sm font-medium">
              AI Prompt (Optional)
            </label>
            <div className="relative">
              <Textarea
                id="aiPrompt"
                ref={textareaRef}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Enter AI prompt for data generation. Use {{columnName}} to reference other column values."
                className="font-mono bg-transparent text-black selection:bg-blue-400/20 caret-gray-900 dark:caret-white resize-none"
              />
              {/* <div 
                className="absolute inset-0 pointer-events-none font-mono p-1 whitespace-pre-wrap overflow-hidden"
                aria-hidden="true"
              >
                {highlightedText}
              </div> */}
            </div>
            <p className="text-sm text-muted-foreground">
              Use {'{{'} columnName {'}}'} syntax to reference other column
              values in your prompt. Available columns will be highlighted in
              blue.
            </p>
            {existingColumns.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Available columns:{' '}
                {existingColumns.map((col) => col.heading).join(', ')}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useWebSearch"
              checked={useWebSearch}
              onChange={(e) => setUseWebSearch(e.target.checked)}
              className="rounded border-gray-300"
            />
            <label htmlFor="useWebSearch" className="text-sm font-medium">
              Use Web Search
            </label>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editColumn ? 'Save Changes' : 'Add Column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Required Columns Dialog */}
      <Dialog
        open={showRequiredColumnsDialog}
        onOpenChange={(open) => {
          if (!open) {
            // Check if all required columns are selected
            const script = COLUMN_SCRIPTS.find(
              (s) => s.id === scriptToPopulate
            );
            const allColumnsSelected = script?.requiredColumns?.every(
              (col) => scriptRequiredFields[col.content]
            );
            if (!allColumnsSelected) {
              setError('Please select all required columns');
              return;
            }
          }
          setShowRequiredColumnsDialog(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Required Columns</DialogTitle>
            <DialogDescription>
              This script requires additional columns to function. Please select
              the corresponding columns from your data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {scriptToPopulate &&
              scriptToPopulate !== 'none' &&
              COLUMN_SCRIPTS.find(
                (s) => s.id === scriptToPopulate
              )?.requiredColumns?.map((requiredCol) => (
                <div key={requiredCol.content} className="space-y-2">
                  <Label htmlFor={`required-${requiredCol.content}`}>
                    {requiredCol.content}
                    <span className="text-sm text-muted-foreground ml-2">
                      ({requiredCol.description})
                    </span>
                  </Label>
                  <Select
                    value={
                      scriptRequiredFields[requiredCol.content]?.toString() ||
                      ''
                    }
                    onValueChange={(value) =>
                      setScriptRequiredFields((prev) => ({
                        ...prev,
                        [requiredCol.content]: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${requiredCol.content}`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {existingColumns.map((col) => (
                        <SelectItem key={col.id} value={col.id.toString()}>
                          {col.heading}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRequiredColumnsDialog(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
