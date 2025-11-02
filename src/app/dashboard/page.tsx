"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useData } from "@/contexts/data-context";
import { useRouter } from "next/navigation";
import BarChartCard from "@/components/bar-chart-card";
import LineChartCard from "@/components/line-chart-card";
import PieChartCard from "@/components/pie-chart-card";
import StatsCard from "@/components/statsCard";
import PaginatedDataTable from "@/components/paginated-data-table";
import "@/app/globals.css";

export default function Dashboard() {
  const { hasData, csvData, chartRecommendations, setChartRecommendations } = useData();
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    if (!hasData) {
      // Fade out before redirecting
      setIsFadingOut(true);
      setTimeout(() => {
        router.push("/");
      }, 500);
    } else {
      // Trigger fade-in animation when component mounts with data
      setIsFadingIn(true);
    }
  }, [hasData, router]);


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

  const metadata: Metadata = useMemo(() => {
    const data = csvData;
    if (!data || data.length === 0) return {} as Metadata;
  
    const columns = Object.keys(data[0]);
    const md: Metadata = {} as Metadata;
  
    columns.forEach((col) => {
      const values = data.map((row) => row[col]).filter((v) => v !== undefined && v !== null);
  
      const numericValues = values.map((v) => Number(v)).filter((v) => !isNaN(v));
      const isNumeric = numericValues.length === values.length;
  
      const freq: Record<string, number> = {};
      values.forEach((val) => {
        const key = val.toString();
        freq[key] = (freq[key] || 0) + 1;
      });
      const maxFreq = Math.max(...Object.values(freq));
      const modeArray = Object.keys(freq).filter((key) => freq[key] === maxFreq);
      const mode = modeArray[0];
  
      const colMeta: Metadata[string] = { isNumeric, mode };
  
      if (isNumeric) {
        const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
        const sorted = [...numericValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        const variance = numericValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numericValues.length;
        const standardDeviation = Math.sqrt(variance);
        colMeta.mean = mean;
        colMeta.median = median;
        colMeta.standardDeviation = standardDeviation;
      }
  
      md[col] = colMeta;
    });
  
    return md;
  }, [csvData]);

  type APIResponse = {
    success: boolean;
    answer?: string;
    error?: string;
  };

  const sendToAPI = useCallback(async (metadata: Metadata): Promise<APIResponse | null> => {
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
        body: JSON.stringify({ prompt })
      });
  
      const result = await response.json();
      return result;
    } 
    catch (err) {
      console.error("Error sending data: ", err);
      return null;
    }
  }, []);

  // Auto-generate charts when arriving on Dashboard if not already generated
  useEffect(() => {
    const generate = async () => {
      if (Object.keys(chartRecommendations).length > 0) return;
      if (!csvData || csvData.length === 0) return;
      if (!metadata || Object.keys(metadata).length === 0) return;
      setIsGenerating(true);
      try {
        const result = await sendToAPI(metadata);
        if(result?.success && result?.answer) {
          try {
            let jsonString = result.answer.trim();
            const codeBlockMatch = jsonString.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (codeBlockMatch) {
              jsonString = codeBlockMatch[1].trim();
            }
            jsonString = jsonString.trim();
            const parsedAnswer = JSON.parse(jsonString);
            setChartRecommendations(parsedAnswer);
            setErrorMsg(null);
          } catch (e) {
            console.error("Failed to parse answer as JSON:", e);
            console.error("Raw answer was:", result?.answer);
            setErrorMsg("We couldn't understand the AI's response. Try again later.");
          }
        } else if (result?.error) {
          console.error("API Error:", result.error);
          setErrorMsg(result.error || "Internal server error");
        } else if (!result) {
          setErrorMsg("Network error while contacting AI service.");
        }
      } finally {
        setIsGenerating(false);
      }
    };
    generate();
  }, [chartRecommendations, csvData, metadata, sendToAPI, setChartRecommendations]);

  const renderChart = (columnName: string, chartType: string) => {
    switch(chartType) {
      case "Bar Graph":
        return <BarChartCard key={columnName} data={csvData} columnName={columnName} />;
      case "Line Chart":
        return <LineChartCard key={columnName} data={csvData} columnName={columnName} />;
      case "Pie Chart":
        return <PieChartCard key={columnName} data={csvData} columnName={columnName} />;
      case "Area Chart":
        return <LineChartCard key={columnName} data={csvData} columnName={columnName} />;
      case "Scatter Chart":
        return <BarChartCard key={columnName} data={csvData} columnName={columnName} />;
      case "Bubble Chart":
        return <BarChartCard key={columnName} data={csvData} columnName={columnName} />;
      default:
        return <BarChartCard key={columnName} data={csvData} columnName={columnName} />;
    }
  };

  return (
    <div className={`m-15 transition-opacity duration-500 ${isFadingOut ? "opacity-0 pointer-events-none" : isFadingIn ? "opacity-100" : "opacity-0"}`}>
      {/* Data preview and stats */}
      <div className="flex flex-row">
        <PaginatedDataTable data={csvData} page={page} setPage={setPage} />
        <StatsCard metadata={metadata} data={csvData} />
      </div>

      {/* Charts */}
      <div className="mt-8">
        {Object.keys(chartRecommendations).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(chartRecommendations).map(([columnName, chartType]) => (
              <div key={columnName}>
                {renderChart(columnName, chartType)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-gray-400">
            {errorMsg ? (
              <span className="text-red-400">{errorMsg}</span>
            ) : (
              isGenerating ? "Generating charts..." : "Charts will appear here once generated."
            )}
          </div>
        )}
      </div>
    </div>
  );
}