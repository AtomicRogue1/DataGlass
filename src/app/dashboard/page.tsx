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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import "@/app/globals.css";

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
  recommendations?: Array<{
    type: string;
    title: string;
    xAxis?: string;
    yAxis?: string;
    dataKey?: string;
    description?: string;
  }>;
  error?: string;
};

type ChartRec = {
  type: string;
  title: string;
  xAxis?: string;
  yAxis?: string;
  dataKey?: string;
  description?: string;
};

export default function Dashboard() {
  const { hasData, csvData, initialDataProcessingDone, setInitialDataProcessingDone } = useData();
  const [chartRecommendations, setChartRecommendations] = useState<ChartRec[]>([]);
  const [chartIndex, setChartIndex] = useState<string[]>([]);
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Auto-scroll to bottom when new chart recommendations are added
  useEffect(() => {
    const scrollToBottom = () => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth'
      });
    };
    
    // Only scroll if charts were added (not on initial load)
    if (chartRecommendations.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [chartRecommendations]);

  function CornerPopup() {
    const [cornerPopupActive, setCornerPopupActive] = useState(true);
    const [inputValue, setInputValue] = useState("");

    const handleSubmit = async () => {
      if (inputValue.trim()) {
        setIsGeneratingAI(true);
        try {
          const headers = Object.keys(csvData[0] || {});
          const result = await ApiService.getChartRecommendationsAI(inputValue.trim(), headers);

          if (result.success && result.recommendations) {
            // Keep backend format - don't transform
            setChartRecommendations(prev => [...prev, ...(result.recommendations as ChartRec[])]);
            console.log(result.recommendations);
          }
          setInputValue("");
        }
        catch (error) {
          console.error('AI API Error:', error);
        } finally {
          setIsGeneratingAI(false);
        }
      }
    }

    return (
      <motion.div layout className='fixed bottom-[0em] right-[0em] p-0 rounded-tl-[0.625rem] bg-white dark:bg-muted border-white-200 border-1'>
        <AnimatePresence mode='popLayout'>
          {cornerPopupActive ?
            (
              <motion.div
                key="compact"
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                exit={{ opacity: 0, scaleX: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Button className='h-14 w-14' variant={'ghost'} onClick={() => setCornerPopupActive(!cornerPopupActive)}>
                  {isGenerating ? <Loader2 className="h-15 w-15 text-foreground animate-spin" /> : <Sparkles className="h-15 w-15 text-foreground" />}
                </Button>
              </motion.div>
            )
            :
            (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
                className='flex gap-4 px-[1em] py-[1em]'
              >
                <Input
                  className='w-[30em]'
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSubmit();
                    }
                  }}
                  placeholder='Chat with AI for more focussed data visualizations.'
                />
                <Button onClick={(e) => { e.stopPropagation(); handleSubmit(); }} variant={'outline'} disabled={isGeneratingAI}>
                  {isGeneratingAI ? <Loader2 className="h-[1.2rem] w-[1.2rem] text-black dark:text-white animate-spin" />
                    : <Sparkles className="h-[1.2rem] w-[1.2rem] text-black dark:text-white" />}
                </Button>
                <Button onClick={(e) => { e.stopPropagation(); setCornerPopupActive(!cornerPopupActive); }} variant={'outline'}><X className='h-[1.2rem] w-[1.2rem] text-black dark:text-white' /></Button>
              </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    )
  }

  const handleDeleteChartItem = (chartToDelete: string) => {
    // Find which index this key corresponds to
    const indexToRemove = chartIndex.indexOf(chartToDelete);

    if (indexToRemove !== -1) {
      // Remove from both arrays at the same index
      setChartIndex(prev => prev.filter((_, index) => index !== indexToRemove));
      setChartRecommendations(prev => prev.filter((_, index) => index !== indexToRemove));
    }
  };

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
        // Keep backend format - don't transform
        return {
          success: true,
          recommendations: result.recommendations as ChartRec[]
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
      if (initialDataProcessingDone) return;
      if (chartRecommendations.length > 0) return;
      if (!csvData || csvData.length === 0) return;
      if (!metadata || Object.keys(metadata).length === 0) return;
      setIsGenerating(true);
      try {
        const result = await sendToAPI();
        if (result?.success && result?.recommendations) {
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
        setInitialDataProcessingDone(true);
      }
    };
    generate();
  }, [chartRecommendations, csvData, metadata, sendToAPI, initialDataProcessingDone, setInitialDataProcessingDone]);

  useEffect(() => {
    if (chartRecommendations.length > 0) {
      const keys = chartRecommendations.map((rec, index) =>
        `${rec.type}-${rec.xAxis || rec.dataKey || ''}-${rec.yAxis || 'count'}-${index}`
      );
      setChartIndex(keys);
    }
  }, [chartRecommendations]);

  const renderChart = (recommendation: ChartRec, index: number) => {
    const { type: chartType, title, xAxis: columnX, yAxis: columnY, dataKey } = recommendation;
    const key = `${chartType}-${columnX || dataKey || ''}-${columnY || 'count'}-${index}`;

    // Ensure we have valid column names
    const xKey = columnX || dataKey || '';
    const yKey = columnY || 'count';
    const pieKey = dataKey || columnX || '';

    // Use title directly from backend recommendation
    const getTitle = () => {
      return title || `${chartType} Chart`; // Fallback if title is missing
    };

    switch (chartType.toLowerCase()) {
      case "bar":
        return (
          <BarChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      case "line":
        return (
          <LineChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      case "scatter":
        return (
          <ScatterChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      case "pie":
        return (
          <PieChartCard
            key={key}
            data={csvData}
            dataKey={pieKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      case "area":
        return (
          <AreaChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      case "bubble":
        return (
          <BubbleChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );
      case "time bar chart":
        return (
          <LineChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      case "stackedbarchart":
      case "stacked bar chart":
        return (
          <BarChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      case "scatter chart":
        return (
          <ScatterChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );

      default:
        // Fallback to bar chart for unknown types
        return (
          <BarChartCard
            key={key}
            data={csvData}
            xAxisKey={xKey}
            yAxisKey={yKey}
            title={getTitle()}
            chartKey={key}
            onDelete={handleDeleteChartItem}
          />
        );
    }
  };

  // Use chartRecommendations directly since it's now an array
  const recommendations: ChartRec[] = chartRecommendations;

  return (
    <div className={`m-15 rounded-none transition-opacity duration-500 ${isFadingOut ? "opacity-0 pointer-events-none" : isFadingIn ? "opacity-100" : "opacity-0"}`}>
      <CornerPopup />
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
              const isWideChart = rec.type.toLowerCase() === 'line' || rec.type.toLowerCase() === 'scatter';
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