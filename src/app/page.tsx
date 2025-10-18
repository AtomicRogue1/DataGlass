"use client"

import React from 'react';
import "@/app/globals.css";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import StatsCard from '@/components/statsCard';
import Chart from '@/components/chartingTime';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";



function FileUploader({ onDataParsed }: { onDataParsed: (data: Record<string, string>[]) => void })
{
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if(!file) return;
    setFileName(file.name);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        onDataParsed(results.data as Record<string, string>[]);
      },
      error: () => {
        setError("Failed to parse CSV. Please check file format.");
      }
    });
  }, [onDataParsed]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {"text/csv": [".csv"]}
  });

  return (
    <div
      {...getRootProps()}
      className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-500" : "border-white-300"}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-blue-500 font-medium">Drop your file here...</p>
      ) : (
        <p className="text-white-600">
          Drag & drop a CSV file here, or{" "}
          <span className="text-blue-600 underline">browse</span> to upload
        </p>
      )}
      {fileName && <p className="mt-2 text-sm">📄 {fileName}</p>}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  )
};

function PaginatedDataTable({ data, page, setPage, rowsPerPage = 10 }: {
  data: Record<string, string>[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage?: number;
}) {
  if (!data || data.length === 0) return null;
  const columns = Object.keys(data[0] || {});
  
  const isNumericCol: Record<string, boolean> = {};
  columns.forEach(col => {
    isNumericCol[col] = true;
    for (let i = 0; i < data.length; i++) {
      const val = data[i][col];
      
      if (typeof val !== "string" || val.trim() === "" || isNaN(Number(val))) {
        isNumericCol[col] = false;
        break;
      }
    }
  });
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = data.slice(start, end);

  return (
    <div className="overflow-x-auto mt-8 border rounded-xl w-[40vw] pl-[10px] pr-[10px] pb-[10px] flex-2 mr-[1rem]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2 text-left font-bold border-b">Index</TableHead>
            {columns.map((col) => (
              <TableHead key={col} className="py-2 text-left font-bold border-b">{col}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.map((row, i) => (
            <TableRow key={start + i} className="border-b">
              <TableCell>{i}</TableCell>
              {columns.map((col) => (
                <TableCell key={col} className="px-4 py-2">{row[col] ?? ""}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between mt-4">
        <button
          className="px-3 py-1 rounded bg-[#242121] disabled:opacity-50 border border-white-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded bg-[#242121] disabled:opacity-50 border border-white-50"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function Page() {
  const [data, setData] = useState<Record<string, string>[]>([]);
  const [page, setPage] = useState(0);
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const isNumericCol: Record<string, boolean> = {};
  if (data.length > 0) {
    columns.forEach(col => {
      isNumericCol[col] = true;
      for (let i = 0; i < data.length; i++) {
        const val = data[i][col];
        if (typeof val !== "string" || val.trim() === "" || isNaN(Number(val))) {
          isNumericCol[col] = false;
          break;
        }
      }
    });
  }
  return (
    <div className="m-15">
      <FileUploader onDataParsed={setData}/>
      <div className="flex flex-row">
        {data.length > 0 && (<PaginatedDataTable data={data} page={page} setPage={setPage} rowsPerPage={10} />)}
        {data.length > 0 && (<StatsCard isNumericCol={isNumericCol} data={data} />)}
      </div>
      {/* <Chart/> */}
    </div>
  );
}