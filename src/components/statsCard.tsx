"use client";

import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

export default function StatsCard({
  metadata,
  data,
}: {
  metadata: Metadata;
  data: Record<string, string>[];
}) {
  const [selectedCol, setSelectedCol] = React.useState<string>("");

  if (!data || !Array.isArray(data) || data.length === 0 || !metadata) return null;

  const columns = Object.keys(data[0] || {});

  const colMeta = selectedCol ? metadata[selectedCol] : null;

  return (
    <div className="flex-1 mt-8 ml-4">
      <Card>
        <CardHeader>
          <CardTitle>Stats</CardTitle>
          <CardDescription>Pick a column to know more about it.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedCol} onValueChange={setSelectedCol}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              {columns.map((col) => (
                <SelectItem key={col} value={col}>
                  {col}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {colMeta && colMeta.isNumeric && (
            <div className="mt-4 space-y-1">
              <p>Mean: {colMeta.mean?.toFixed(2)}</p>
              <p>Median: {colMeta.median?.toFixed(2)}</p>
              <p>
                Mode: {colMeta.mode ?? "N/A"}
              </p>
              <p>Standard Deviation: {colMeta.standardDeviation?.toFixed(2)}</p>
            </div>
          )}

          {colMeta && !colMeta.isNumeric && (
            <div className="mt-4 space-y-1">
              <p>
                Mode: {colMeta.mode ?? "N/A"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
