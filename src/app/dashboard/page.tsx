"use client";

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useData } from "@/contexts/data-context";
import { useRouter } from "next/navigation";
import BarChartCard from "@/components/bar-chart-card";
import LineChartCard from "@/components/line-chart-card";
import PieChartCard from "@/components/pie-chart-card";
import AreaChartCard from "@/components/area-chart-card";
import ScatterChartCard from "@/components/scatter-chart-card";
import BubbleChartCard from "@/components/bubble-chart-card";
import StatsCard from "@/components/statsCard";
import PaginatedDataTable from "@/components/paginated-data-table";
import { ApiService } from "@/services/api";
import "@/app/globals.css";

export default function Dashboard() {
  const { hasData, csvData } = useData();
  const [chartRecommendations, setChartRecommendations] = useState<ChartRec[]>([]);
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
    recommendations?: Array<{
      chartType: string;
      columnX: string;
      columnY: string;
    }>;
    error?: string;
  };

  type ChartRec = {
    chartType: string;
    columnX: string;
    columnY: string;
  };

  // Build isNumericCol dictionary from metadata
  const isNumericCol = useMemo(() => {
    const result: Record<string, boolean> = {};
    Object.entries(metadata).forEach(([col, meta]) => {
      result[col] = meta.isNumeric;
    });
    return result;
  }, [metadata]);

  const sendToAPI = useCallback(async (): Promise<APIResponse | null> => {
    try {
      // Call your FastAPI backend through the proxy
      const result = await ApiService.getChartRecommendations(csvData, isNumericCol);
      
      if (result.success && result.recommendations) {
        // Convert FastAPI format to your expected format
        const formattedRecommendations = (result.recommendations as Array<{ type: string; xAxis?: string; yAxis?: string; dataKey?: string }>).map(rec => ({
          chartType: rec.type,
          columnX: rec.xAxis || rec.dataKey || '',
          columnY: rec.yAxis || 'count'
        }));
        
        return {
          success: true,
          recommendations: formattedRecommendations
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to get chart recommendations'
        };
      }
    } 
    catch (err) {
      console.error("Error sending data: ", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Network error'
      };
    }
  }, [csvData, isNumericCol]);

  // Auto-generate charts when arriving on Dashboard if not already generated
  useEffect(() => {
    const generate = async () => {
      if (chartRecommendations.length > 0) return;
      if (!csvData || csvData.length === 0) return;
      if (!metadata || Object.keys(metadata).length === 0) return;
      setIsGenerating(true);
      try {
        const result = await sendToAPI();
        if(result?.success && result?.recommendations) {
          // Store recommendations directly
          setChartRecommendations(result.recommendations);
          setErrorMsg(null);
        } else if (result?.error) {
          console.error("API Error:", result.error);
          setErrorMsg(result.error || "Internal server error");
        } else if (!result) {
          setErrorMsg("Network error while contacting Python backend.");
        }
      } finally {
        setIsGenerating(false);
      }
    };
    generate();
  }, [chartRecommendations, csvData, metadata, sendToAPI]);

  const renderChart = (recommendation: ChartRec, index: number) => {
    const { chartType, columnX, columnY } = recommendation;
    const key = `${chartType}-${columnX}-${columnY}-${index}`;
    
    // Create a proper title from the recommendation
    const getTitle = () => {
      switch(chartType.toLowerCase()) {
        case "bar":
          return `Distribution of ${columnY} over ${columnX}`;
        case "line":
          return `Trend of ${columnY} according to ${columnX}`;
        case "scatter":
          return `${columnX} vs ${columnY}`;
        case "pie":
          return `Composition of ${columnX}`;
        case "area":
          return `Area Chart of ${columnY}`;
        case "bubble":
          return `Bubble Chart: ${columnX} vs ${columnY}`;
        default:
          return `${chartType} Chart`;
      }
    };
    
    switch(chartType.toLowerCase()) {
      case "bar":
        return (
          <BarChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={getTitle()} 
          />
        );
      
      case "line":
        return (
          <LineChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={getTitle()} 
          />
        );
      
      case "scatter":
        return (
          <ScatterChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={getTitle()} 
          />
        );
      
      case "pie":
        return (
          <PieChartCard 
            key={key} 
            data={csvData} 
            dataKey={columnX} 
            title={getTitle()} 
          />
        );
      
      case "area":
        return (
          <AreaChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={getTitle()} 
          />
        );
      
      case "bubble":
        return (
          <BubbleChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={getTitle()} 
          />
        );
      
      // Legacy support for older chart types
      case "barchart":
      case "bar chart":
        return (
          <BarChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={`Bar Chart - ${columnX}`} 
          />
        );
      
      case "timebarchart":
      case "time bar chart":
        return (
          <LineChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={`Time Series - ${columnY}`} 
          />
        );
      
      case "stackedbarchart":
      case "stacked bar chart":
        return (
          <BarChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={`Stacked Bar - ${columnX}`} 
          />
        );
      
      case "scatter chart":
        return (
          <ScatterChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY} 
            title={`Scatter Plot - ${columnX} vs ${columnY}`} 
          />
        );
      
      default:
        // Fallback to bar chart for unknown types
        return (
          <BarChartCard 
            key={key} 
            data={csvData} 
            xAxisKey={columnX} 
            yAxisKey={columnY || 'count'} 
            title={`${chartType} Chart - ${columnX}`} 
          />
        );
    }
  };

  // Use chartRecommendations directly since it's now an array
  const recommendations: ChartRec[] = chartRecommendations;

  return (
    <div className={`m-15 transition-opacity duration-500 ${isFadingOut ? "opacity-0 pointer-events-none" : isFadingIn ? "opacity-100" : "opacity-0"}`}>
      {/* Data preview and stats */}
      <div className="flex flex-row">
        <PaginatedDataTable data={csvData} page={page} setPage={setPage} />
        <StatsCard metadata={metadata} data={csvData} />
      </div>

      {/* Charts */}
      <div className="mt-8">
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {recommendations.map((rec: ChartRec, index: number) => {
              // Line and scatter charts take full width, others share space
              const isWideChart = rec.chartType.toLowerCase() === 'line' || rec.chartType.toLowerCase() === 'scatter';
              const gridSpanClass = isWideChart ? 'col-span-1 xl:col-span-2' : 'col-span-1';
              
              return (
                <div key={index} className={gridSpanClass}>
                  {renderChart(rec, index)}
                </div>
              );
            })}
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