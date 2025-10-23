"use client";

import React, { useCallback, useState, useEffect, useMemo } from "react";
import "@/app/globals.css";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import StatsCard from "@/components/statsCard";
import BarChartCard from "@/components/bar-chart-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Heading1 } from "lucide-react";

type Metadata = Record<
  string,
  {
    isNumeric: boolean;
    mean?: number;
    median?: number;
    mode?: string | number;
    standardDeviation?: number;
  }
>;

type APIResponse = {
  success: boolean;
  answer?: string;
  error?: string;
};

function calculateColumnStats(data: Record<string, string>[]) {
  if (!data || data.length === 0) return {};

  const columns = Object.keys(data[0]);
  const metadata: Record<
    string,
    {
      isNumeric: boolean;
      mean?: number;
      median?: number;
      mode?: string | number;
      standardDeviation?: number;
    }
  > = {};

  columns.forEach((col) => {
    const values = data.map((row) => row[col]).filter((v) => v !== undefined && v !== null);

    // Check if all values are numeric
    const numericValues = values.map((v) => Number(v)).filter((v) => !isNaN(v));
    const isNumeric = numericValues.length === values.length;

    // Mode calculation (works for both numeric and string)
    const freq: Record<string, number> = {};
    values.forEach((val) => {
      const key = val.toString();
      freq[key] = (freq[key] || 0) + 1;
    });
    const maxFreq = Math.max(...Object.values(freq));
    const modeArray = Object.keys(freq).filter((key) => freq[key] === maxFreq);
    const mode = modeArray[0]; // take first if multiple modes

    const colMeta: typeof metadata[string] = { isNumeric, mode };

    if (isNumeric) {
      // Mean
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

      // Median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? (sorted[mid - 1] + sorted[mid]) / 2
          : sorted[mid];

      // Standard Deviation
      const variance =
        numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
        numericValues.length;
      const standardDeviation = Math.sqrt(variance);

      colMeta.mean = mean;
      colMeta.median = median;
      colMeta.standardDeviation = standardDeviation;
    }

    metadata[col] = colMeta;
  });

  return metadata;
}

async function sendToAPI(metadata: Metadata): Promise<APIResponse | null> {
  const prompt = `
    Below is data about my columns: whether they are numeric or not, mean, median, mode, and standard deviation.

    ${JSON.stringify(metadata, null, 2)}

    Tell me for each column what kind of graph is best. 
    Here are options you have to choose from: 
    Bar Graph, Line Chart, Bubble Chart, Scatter Chart, Pie Chart, Area Chart. 

    Answer in JSON only.
  `;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })   // ✅ sending prompt to API route
    });

    const result = await response.json();
    console.log("API Response:", result);
    return result;
  } 
  catch (err) {
    console.error("Error sending data: ", err);
    return null;
  }
}

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

function PaginatedDataTable({
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
  const [answer, setAnswer] = useState<string>("");

  const metadata = useMemo(() => calculateColumnStats(data), [data]);

  useEffect(() => {
    if(Object.keys(metadata).length > 0){
      (async () => {
        const result = await sendToAPI(metadata);
        if(result?.answer) setAnswer(result.answer);
      })();
    }
  }, [metadata]);

  useEffect(()=>{
    if(answer !== "")
    alert(answer)
  },[answer])

  return (
    <div className="m-15">
      <FileUploader onDataParsed={setData} />
      <div className="flex flex-row">
        {data.length > 0 && <PaginatedDataTable data={data} page={page} setPage={setPage} />}
        {data.length > 0 && <StatsCard metadata={metadata} data={data} />}
      </div>
    </div>
  );
}
