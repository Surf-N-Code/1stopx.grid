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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface Column {
  id: number;
  heading: string;
  dataType: 'text' | 'number' | 'email' | 'url' | 'boolean';
  aiPrompt?: string;
  useWebSearch?: boolean;
}

interface AddColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<Column, 'id'>) => Promise<void>;
  editColumn?: Column | undefined;
  existingColumns?: Column[];
}

export function AddColumnModal({ open, onOpenChange, onSubmit, editColumn, existingColumns = [] }: AddColumnModalProps) {
  const [heading, setHeading] = React.useState(editColumn?.heading || '');
  const [dataType, setDataType] = React.useState<Column['dataType']>(editColumn?.dataType || 'text');
  const [aiPrompt, setAiPrompt] = React.useState(editColumn?.aiPrompt || '');
  const [useWebSearch, setUseWebSearch] = React.useState(editColumn?.useWebSearch || false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [highlightedText, setHighlightedText] = React.useState<JSX.Element | null>(null);

  React.useEffect(() => {
    if (editColumn) {
      setHeading(editColumn.heading);
      setDataType(editColumn.dataType);
      setAiPrompt(editColumn.aiPrompt || '');
      setUseWebSearch(editColumn.useWebSearch || false);
    } else {
      setHeading('');
      setDataType('text');
      setAiPrompt('');
      setUseWebSearch(false);
    }
  }, [editColumn]);

  // Function to highlight column references
  const highlightColumnReferences = (text: string) => {
    const columnNames = existingColumns.map(col => col.heading.toLowerCase());
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
          className={isValidColumn ? "text-blue-500 font-medium" : "text-red-500 font-medium"}
          title={isValidColumn ? "Valid column reference" : "Unknown column"}
        >
          {match[0]}
        </span>
      );

      lastIndex = pattern.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      elements.push(
        <span key={`text-${lastIndex}`}>
          {text.slice(lastIndex)}
        </span>
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
    setIsSubmitting(true);
    try {
      await onSubmit({
        heading,
        dataType,
        aiPrompt: aiPrompt || undefined,
        useWebSearch,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editColumn ? 'Edit Column' : 'Add New Column'}</DialogTitle>
          <DialogDescription>
            {editColumn
              ? 'Edit the column details below.'
              : 'Add a new column to your table.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="heading">Column Heading</Label>
              <Input
                id="heading"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Enter column heading"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Data Type</Label>
              <Select
                value={dataType}
                onValueChange={(value: Column['dataType']) => setDataType(value)}
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
            <div className="grid gap-2">
              <Label htmlFor="aiPrompt">AI Prompt (Optional)</Label>
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
                Use {'{{'} columnName {'}}' } syntax to reference other column values in your prompt. Available columns will be highlighted in blue.
              </p>
              {existingColumns.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  Available columns: {existingColumns.map(col => col.heading).join(', ')}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useWebSearch"
                checked={useWebSearch}
                onCheckedChange={(checked) => setUseWebSearch(checked as boolean)}
              />
              <Label htmlFor="useWebSearch" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Enable web search for AI responses
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || !heading}
            >
              {isSubmitting ? 'Saving...' : editColumn ? 'Save Changes' : 'Add Column'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 