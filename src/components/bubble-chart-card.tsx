/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import {
    Chart as ChartJS,
    LinearScale,
    PointElement,
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
import { Bubble } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface BubbleChartCardProps {
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    title: string;
    sizeKey?: string;
}

function BubbleChartCard({ data, xAxisKey, yAxisKey, title, sizeKey }: BubbleChartCardProps) {
    // Process data for bubble chart
    const processedData = data
        .map((item, index) => ({
            x: parseFloat(item[xAxisKey]),
            y: parseFloat(item[yAxisKey]),
            r: sizeKey ? Math.max(5, parseFloat(item[sizeKey]) / 10) : 10 + (index % 15)
        }))
        .filter(item => !isNaN(item.x) && !isNaN(item.y));

    const chartConfig = {
        datasets: [{
            label: sizeKey ? `${xAxisKey} vs ${yAxisKey} (size: ${sizeKey})` : `${xAxisKey} vs ${yAxisKey}`,
            data: processedData,
            backgroundColor: 'rgba(6, 182, 212, 0.6)',
            borderColor: 'rgba(6, 182, 212, 1)',
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
                <CardDescription>Bubble Chart</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div style={{ height: '400px' }}>
                    <Bubble data={chartConfig} options={options} />
                </div>
            </CardContent>
        </Card>
    )
}

export default BubbleChartCard