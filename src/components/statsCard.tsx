"use client";

import React from 'react'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

const median = (data: Record<string, string>[], column: string): number => {
    const nums = data.map(row => Number(row[column])).filter(v => !isNaN(v));
    if (!nums.length) return 0;
    nums.sort((a, b) => a - b);
    const mid = Math.floor(nums.length / 2);
    return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
};

const min = (data: Record<string, string>[], column: string): number => {
    const nums = data.map(row => Number(row[column])).filter(v => !isNaN(v));
    return nums.length ? Math.min(...nums) : 0;
};

const max = (data: Record<string, string>[], column: string): number => {
    const nums = data.map(row => Number(row[column])).filter(v => !isNaN(v));
    return nums.length ? Math.max(...nums) : 0;
};

const mean = (data: Record<string, string>[], column: string): number => {
    let sum = 0;
    let count = 0;
    data.forEach((row: Record<string, string>) => {
        const val = Number(row[column]);
        if (!isNaN(val)) {
            sum += val;
            count++;
        }
    });
    return count > 0 ? sum / count : 0;
}

export default function StatsCard({ data, isNumericCol }: { 
    data: Record<string, string>[];
    isNumericCol: Record<string, boolean>;
}) {
    const [selectedCol, setSelectedCol] = React.useState<string>("");
    if (!data || !Array.isArray(data) || data.length === 0 || !isNumericCol) {
        return null;
    }
    const columns = Object.keys(data[0] || {});

    return (
        <div className="flex-1 bg-red mt-8 ml-[1rem]">
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
                                <SelectItem key={col} value={col}>{col}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {selectedCol && isNumericCol[selectedCol] && (
                        <>
                            <p className="mt-4">Mean: {mean(data, selectedCol).toFixed(2)}</p>
                            <p className="mt-4">Median: {median(data, selectedCol).toFixed(2)}</p>
                            <p className="mt-4">Min: {min(data, selectedCol).toFixed(2)}</p>
                            <p className="mt-4">Max: {max(data, selectedCol).toFixed(2)}</p>
                        </>
                    )}
                    {selectedCol && !isNumericCol[selectedCol] && (
                        <>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}