'use client';

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface GridProps {
  dbData?: { columns: { id: number; heading: string }[]; rows: string[][] } | null;
}

export const Grid: React.FC<GridProps> = ({ dbData }) => {
  if (!dbData) return null;

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {dbData.columns.map((column) => (
              <TableHead key={column.id}>{column.heading}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dbData.rows.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <TableCell 
                  key={`${rowIndex}-${cellIndex}`}
                  className="px-4 py-2 whitespace-nowrap overflow-hidden text-ellipsis max-h-[1.5em]"
                >
                  {cell}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}; 