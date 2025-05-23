'use client';

import Image from "next/image";
import { Grid } from "@/components/Grid";
import { CSVUpload } from "./components/CSVUpload";
import * as React from "react";

interface Column {
  id: number;
  heading: string;
  dataType: 'text' | 'number' | 'email' | 'url';
  aiPrompt?: string;
}

export default function Home() {
  const [tableData, setTableData] = React.useState<{ columns: Column[]; rows: string[][] } | null>(null);
  const [loadingTable, setLoadingTable] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleImport = async ({ tableId }: { tableId: number; projectId: number }) => {
    setLoadingTable(true);
    setError(null);
    try {
      const res = await fetch(`/api/table/${tableId}`);
      const data = await res.json();
      if (res.ok && data.columns && data.rows) {
        setTableData(data);
      } else {
        setError(data.error || 'Failed to fetch table data.');
      }
    } catch (e) {
      setError('Failed to fetch table data.');
    } finally {
      setLoadingTable(false);
    }
  };

  const handleColumnsChange = async () => {
    if (!tableData) return;
    handleImport({ tableId: tableData.columns[0].id, projectId: 0 });
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <CSVUpload onImport={handleImport} />
        <div className="w-full max-w-5xl">
          {loadingTable ? (
            <div className="text-blue-600 text-sm">Loading table data...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : (
            <Grid dbData={tableData} tableId={tableData?.columns[0]?.id} onColumnsChange={handleColumnsChange} />
          )}
        </div>
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
