"use client"

import React, { createContext, useContext, useState } from 'react';

type DataContextType = {
  hasData: boolean;
  setHasData: (value: boolean) => void;
  csvData: Record<string, string>[];
  setCsvData: (data: Record<string, string>[]) => void;
  chartRecommendations: Record<string, string>;
  setChartRecommendations: (recommendations: Record<string, string>) => void;
  initialDataProcessingDone: boolean;
  setInitialDataProcessingDone: (value: boolean) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [hasData, setHasData] = useState(false);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [chartRecommendations, setChartRecommendations] = useState<Record<string, string>>({});
  const [initialDataProcessingDone, setInitialDataProcessingDone] = useState<boolean>(false);

  return (
    <DataContext.Provider value={{ 
      hasData, 
      setHasData, 
      csvData, 
      setCsvData,
      chartRecommendations,
      setChartRecommendations,
      initialDataProcessingDone,
      setInitialDataProcessingDone
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
