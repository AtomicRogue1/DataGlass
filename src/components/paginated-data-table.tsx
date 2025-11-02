"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PaginatedDataTable({
  data,
  page,
  setPage,
  rowsPerPage = 10,
}: {
  data: Record<string, string>[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  rowsPerPage?: number;
}) {
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageData = data.slice(start, end);

  return (
    <div className="overflow-x-auto mt-8 border rounded-xl w-[40vw] pl-2 pr-2 pb-2 flex-2 mr-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2 text-left font-bold border-b">Index</TableHead>
            {columns.map((col) => (
              <TableHead key={col} className="py-2 text-left font-bold border-b">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageData.map((row, i) => (
            <TableRow key={start + i} className="border-b">
              <TableCell>{start + i + 1}</TableCell>
              {columns.map((col) => (
                <TableCell key={col} className="px-4 py-2">
                  {row[col] ?? ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex items-center justify-between mt-4">
        <button
          className="px-3 py-1 rounded border border-white-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded disabled:opacity-50 border border-white-50"
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
