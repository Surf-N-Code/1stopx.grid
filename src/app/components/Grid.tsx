'use client';

import * as React from "react";
// If you have not yet generated the shadcn/ui Table components, run:
// npx shadcn-ui@latest add table
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

// Placeholder data type
interface RowData {
  name: string;
  email: string;
  role: string;
}

// Placeholder data
const initialData: RowData[] = [
  { name: "Alice", email: "alice@example.com", role: "Admin" },
  { name: "Bob", email: "bob@example.com", role: "User" },
  { name: "Charlie", email: "charlie@example.com", role: "Editor" },
];

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
] as const;
type ColumnKey = typeof columns[number]["key"];

const ROWS_PER_PAGE = 2;
const DEFAULT_WIDTHS: Record<string, number> = {
  name: 160,
  email: 220,
  role: 120,
};

type CellCoord = { rowIndex: number; colKey: string };

function cellCoordEquals(a: CellCoord, b: CellCoord) {
  return a.rowIndex === b.rowIndex && a.colKey === b.colKey;
}

interface GridProps {
  csvData?: string[][] | null;
  dbData?: { columns: { id: number; heading: string }[]; rows: string[][] } | null;
}

export const Grid: React.FC<GridProps> = ({ csvData, dbData }) => {
  // If dbData is present, use its columns and rows
  const dbHeaders = dbData && dbData.columns ? dbData.columns.map((c) => c.heading) : null;
  const dbRows = dbData && dbData.rows ? dbData.rows : null;
  const dbColKeys = dbHeaders ? dbHeaders.map((h, i) => `col${i}`) : [];
  const dbColMap = dbHeaders ? dbHeaders.reduce((acc, h, i) => { acc[`col${i}`] = h; return acc; }, {} as Record<string, string>) : {};
  const dbWidths = dbColKeys.reduce((acc, k) => { acc[k] = 160; return acc; }, {} as Record<string, number>);

  // If csvData is present, use its headers and rows
  const csvHeaders = csvData && csvData.length > 0 ? csvData[0] : null;
  const csvRows = csvData && csvData.length > 1 ? csvData.slice(1) : null;
  const csvColKeys = csvHeaders ? csvHeaders.map((h, i) => `col${i}`) : [];
  const csvColMap = csvHeaders ? csvHeaders.reduce((acc, h, i) => { acc[`col${i}`] = h; return acc; }, {} as Record<string, string>) : {};
  const csvWidths = csvColKeys.reduce((acc, k) => { acc[k] = 160; return acc; }, {} as Record<string, number>);

  // State
  const [sortBy, setSortBy] = React.useState<string>(dbColKeys[0] || csvColKeys[0] || "name");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("asc");
  const [page, setPage] = React.useState(0);
  const [colWidths, setColWidths] = React.useState<Record<string, number>>(
    dbData ? dbWidths : csvData ? csvWidths : DEFAULT_WIDTHS
  );
  const [selectedCells, setSelectedCells] = React.useState<CellCoord[]>([]);
  const resizingCol = React.useRef<string | null>(null);
  const startX = React.useRef(0);
  const startWidth = React.useRef(0);

  // Data for rendering
  const dataRows = dbRows || csvRows || initialData.map(row => [row.name, row.email, row.role]);
  const colKeys = dbData ? dbColKeys : csvData ? csvColKeys : columns.map(c => c.key);
  const colLabels = dbData ? (dbHeaders || []) : csvData ? (csvHeaders || []) : columns.map(c => c.label);

  // Sorting
  const sortedData = React.useMemo(() => {
    if (!csvData) {
      // Sort placeholder data by key
      const idx = colKeys.indexOf(sortBy);
      return [...dataRows].sort((a, b) => {
        if (a[idx] < b[idx]) return sortDir === "asc" ? -1 : 1;
        if (a[idx] > b[idx]) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      // Sort csvData by column index
      const idx = colKeys.indexOf(sortBy);
      return [...dataRows].sort((a, b) => {
        if ((a[idx] || "") < (b[idx] || "")) return sortDir === "asc" ? -1 : 1;
        if ((a[idx] || "") > (b[idx] || "")) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
  }, [sortBy, sortDir, dataRows, colKeys, csvData]);

  const pageCount = Math.ceil(sortedData.length / ROWS_PER_PAGE);
  const pagedData = sortedData.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE);

  const handleSort = (col: string) => {
    if (sortBy === col) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
    setPage(0); // Reset to first page on sort
  };

  const handlePrev = () => setPage((p) => Math.max(0, p - 1));
  const handleNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));

  // Column resizing handlers
  const onMouseDown = (e: React.MouseEvent, col: string) => {
    resizingCol.current = col;
    startX.current = e.clientX;
    startWidth.current = colWidths[col];
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!resizingCol.current) return;
    const delta = e.clientX - startX.current;
    setColWidths((prev) => ({
      ...prev,
      [resizingCol.current!]: Math.max(60, startWidth.current + delta),
    }));
  };

  const onMouseUp = () => {
    resizingCol.current = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  React.useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // Cell selection logic
  const handleCellClick = (rowIdx: number, colKey: string, e: React.MouseEvent) => {
    const cell = { rowIndex: rowIdx + page * ROWS_PER_PAGE, colKey };
    if (e.shiftKey && selectedCells.length > 0) {
      // Range select
      const last = selectedCells[selectedCells.length - 1];
      const allCells: CellCoord[] = [];
      const minRow = Math.min(last.rowIndex, cell.rowIndex);
      const maxRow = Math.max(last.rowIndex, cell.rowIndex);
      const minCol = Math.min(colKeys.indexOf(last.colKey), colKeys.indexOf(cell.colKey));
      const maxCol = Math.max(colKeys.indexOf(last.colKey), colKeys.indexOf(cell.colKey));
      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          allCells.push({ rowIndex: r, colKey: colKeys[c] });
        }
      }
      setSelectedCells(allCells);
    } else if (e.metaKey || e.ctrlKey) {
      // Multi-select
      setSelectedCells((prev) => {
        const exists = prev.some((c) => cellCoordEquals(c, cell));
        if (exists) {
          return prev.filter((c) => !cellCoordEquals(c, cell));
        } else {
          return [...prev, cell];
        }
      });
    } else {
      // Single select
      setSelectedCells([cell]);
    }
  };

  const isCellSelected = (rowIdx: number, colKey: string) => {
    return selectedCells.some((c) => c.rowIndex === rowIdx + page * ROWS_PER_PAGE && c.colKey === colKey);
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white dark:bg-gray-900">
      <Table className="min-w-full divide-y divide-gray-200">
        <TableHeader className="bg-gray-50 dark:bg-gray-800">
          <TableRow>
            {colLabels.map((label, i) => (
              <TableHead
                key={colKeys[i]}
                style={{ width: colWidths[colKeys[i]], minWidth: 60 }}
                className="px-0 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider cursor-pointer select-none relative group"
              >
                <button
                  className="w-full text-left font-semibold flex items-center gap-1 px-4"
                  onClick={() => handleSort(colKeys[i])}
                  aria-label={`Sort by ${label}`}
                  style={{ userSelect: "none" }}
                >
                  {label}
                  {sortBy === colKeys[i] && (
                    <span className="ml-1 text-xs">
                      {sortDir === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
                {/* Resize handle */}
                <div
                  onMouseDown={(e) => onMouseDown(e, colKeys[i])}
                  className="absolute top-0 right-0 h-full w-2 cursor-col-resize group-hover:bg-gray-200 dark:group-hover:bg-gray-700 transition"
                  style={{ zIndex: 10 }}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pagedData.map((row, i) => (
            <TableRow
              key={i}
              className={i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
            >
              {colKeys.map((colKey, j) => (
                <TableCell
                  key={colKey}
                  style={{ width: colWidths[colKey], minWidth: 60 }}
                  className={`px-4 py-2 whitespace-nowrap transition-colors duration-75 ${isCellSelected(i, colKey) ? 'bg-blue-200 dark:bg-blue-700/60 ring-2 ring-blue-400' : ''}`}
                  tabIndex={0}
                  onClick={(e) => handleCellClick(i, colKey, e)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleCellClick(i, colKey, e as any);
                  }}
                  aria-selected={isCellSelected(i, colKey)}
                  role="gridcell"
                >
                  {row[j]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center p-2">
        <button
          className="px-3 py-1 rounded border text-xs font-medium disabled:opacity-50"
          onClick={handlePrev}
          disabled={page === 0}
        >
          Previous
        </button>
        <span className="text-xs text-gray-600 dark:text-gray-300">
          Page {page + 1} of {pageCount}
        </span>
        <button
          className="px-3 py-1 rounded border text-xs font-medium disabled:opacity-50"
          onClick={handleNext}
          disabled={page >= pageCount - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}; 