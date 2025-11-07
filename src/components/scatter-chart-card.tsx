/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
    LineElement,
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
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface ScatterChartCardProps {
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    title: string;
}

function ScatterChartCard({ data, xAxisKey, yAxisKey, title }: ScatterChartCardProps) {
    // Process data for scatter chart
    const processedData = data
        .map(item => ({
            x: parseFloat(item[xAxisKey]),
            y: parseFloat(item[yAxisKey])
        }))
        .filter(item => !isNaN(item.x) && !isNaN(item.y));

    const chartConfig = {
        datasets: [{
            label: `${xAxisKey} vs ${yAxisKey}`,
            data: processedData,
            backgroundColor: 'rgba(239, 68, 68, 0.6)',
            borderColor: 'rgba(239, 68, 68, 1)',
            pointRadius: 5,
            pointHoverRadius: 7,
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
            }
        },
        scales: {
            x: {
                type: 'linear' as const,
                position: 'bottom' as const,
                title: {
                    display: true,
                    text: xAxisKey
                }
            },
            y: {
                title: {
                    display: true,
                    text: yAxisKey
                }
            }
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Scatter Chart</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div style={{ height: '300px' }}>
                    <Scatter data={chartConfig} options={options} />
                </div>
            </CardContent>
        </Card>
    )
}

export default ScatterChartCard