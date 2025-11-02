"use client";

import React, { useCallback, useState, useEffect } from "react";
import "@/app/globals.css";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { useData } from "@/contexts/data-context";
import { useRouter } from "next/navigation";


function FileUploader({ onDataParsed }: { onDataParsed: (data: Record<string, string>[]) => void }) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setFileName(file.name);
      setError(null);

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          onDataParsed(results.data as Record<string, string>[]);
        },
        error: () => setError("Failed to parse CSV. Please check file format."),
      });
    },
    [onDataParsed]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
  });

  return (
    <div
      {...getRootProps()}
      className={`border-3 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${isDragActive ? "border-blue-500" : "border-white-300"
        }`}
    >
      <input {...getInputProps()} />
      <p className={isDragActive ? "text-blue-500 font-medium" : "text-white-600"}>
        {isDragActive
          ? "Drop your file here..."
          : "Drag & drop a CSV file here, or "}
        {!isDragActive && <span className="text-blue-600 underline">browse</span>}
      </p>
      {fileName && <p className="mt-2 text-sm">📄 {fileName}</p>}
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}


export default function Page() {
  const { setCsvData, setHasData } = useData();
  const router = useRouter();
  const [isFading, setIsFading] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);

  // Fade in on mount
  useEffect(() => {
    setIsFadingIn(true);
  }, []);

  const handleDataParsed = useCallback((data: Record<string, string>[]) => {
    // Save data to context
    setCsvData(data);
    setHasData(data.length > 0);
    // Trigger fade-out then navigate
    setIsFading(true);
    // Match this delay to the transition duration below
    setTimeout(() => {
      router.push("/dashboard");
    }, 500);
  }, [router, setCsvData, setHasData]);

  return (
    <div className={`m-15 transition-opacity duration-500 ${isFading ? "opacity-0 pointer-events-none select-none" : isFadingIn ? "opacity-100" : "opacity-0"}`}>
      <FileUploader onDataParsed={handleDataParsed} />
    </div>
  );
}
