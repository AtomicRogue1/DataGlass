/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PieChartCardProps {
    data: any[];
    dataKey: string;
    title: string;
}

function PieChartCard({ data, dataKey, title }: PieChartCardProps) {
    // Count occurrences of each value
    const frequency: Record<string, number> = {};
    data.forEach(row => {
        const value = String(row[dataKey] || 'Unknown');
        frequency[value] = (frequency[value] || 0) + 1;
    });

    const labels = Object.keys(frequency);
    const values = Object.values(frequency);

    // Generate colors
    const colors = [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Green
        'rgba(245, 158, 11, 0.8)',   // Yellow
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(139, 92, 246, 0.8)',   // Purple
        'rgba(6, 182, 212, 0.8)',    // Cyan
        'rgba(132, 204, 22, 0.8)',   // Lime
        'rgba(249, 115, 22, 0.8)',   // Orange
    ];

    const borderColors = colors.map(color => color.replace('0.8', '1'));

    const chartConfig = {
        labels,
        datasets: [{
            data: values,
            backgroundColor: colors.slice(0, labels.length),
            borderColor: borderColors.slice(0, labels.length),
            borderWidth: 1,
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const
            },
            title: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.raw;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Pie Chart</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div style={{ height: '300px' }}>
                    <Pie data={chartConfig} options={options} />
                </div>
            </CardContent>
        </Card>
    )
}

export default PieChartCard