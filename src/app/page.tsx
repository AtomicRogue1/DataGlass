"use client"

import React from 'react';
import "@/app/globals.css";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function FileUploader({ onDataParsed }: { onDataParsed: (data: unknown[]) => void })
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
        onDataParsed(results.data);
      },
      error: (err) => {
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
}

export default function HomePage() {
  const [data, setData] = useState<unknown[]>([]);
  return (
    <div className="m-15">
      <FileUploader onDataParsed={setData}/>
    </div>
  )
}

