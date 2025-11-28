/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardAction
} from "@/components/ui/card"
import {
    Button
} from "@/components/ui/button"
import { Trash2 } from 'lucide-react';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface LineChartCardProps {
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    title: string;
    chartKey: string;
    onDelete: (chartKey: string) => void;
}

function LineChartCard({ data, xAxisKey, yAxisKey, title, chartKey, onDelete }: LineChartCardProps) {
    // Helper function to check if a string looks like a date
    const isDateLike = (str: string): boolean => {
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
            /^\d{2}[-/]\d{2}[-/]\d{4}/, // MM-DD-YYYY or MM/DD/YYYY
            /^\d{4}[-/]\d{2}[-/]\d{2}/, // YYYY-MM-DD or YYYY/MM/DD
        ];
        return datePatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
    };

    // Process data for line chart
    const processedData = () => {
        if (xAxisKey === 'index') {
            return data.map((item, index) => ({
                x: index + 1,
                y: parseFloat(item[yAxisKey]) || 0
            }));
        } else {
            const processedItems = data.map(item => ({
                x: item[xAxisKey],
                y: parseFloat(item[yAxisKey]) || 0,
                originalX: item[xAxisKey]
            }));

            // If x-axis looks like dates, sort by date and format labels
            if (processedItems.length > 0 && isDateLike(String(processedItems[0].originalX))) {
                return processedItems
                    .sort((a, b) => new Date(a.originalX).getTime() - new Date(b.originalX).getTime())
                    .map(item => ({
                        x: new Date(item.originalX).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                        }),
                        y: item.y
                    }));
            }

            return processedItems.map(item => ({ x: item.x, y: item.y }));
        }
    };

    const chartData = processedData();
    const labels = chartData.map(item => item.x);
    const values = chartData.map(item => item.y);

    const chartConfig = {
        labels,
        datasets: [{
            label: yAxisKey,
            data: values,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: 'rgb(59, 130, 246)',
            pointRadius: 4,
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
                title: {
                    display: true,
                    text: xAxisKey
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 0,
                    maxTicksLimit: 8,
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                title: {
                    display: true,
                    text: yAxisKey
                },
                beginAtZero: true
            }
        }
    };

    const handleDelete = () => {
        if(onDelete)
        {
            onDelete(chartKey);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Line Chart</CardDescription>
                <CardAction>
                    <Button variant={'ghost'} onClick={handleDelete}>
                        <Trash2 className="h-[1.2rem] w-[1.2rem]"/>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="p-6">
                <div style={{ height: '400px' }}>
                    <Line data={chartConfig} options={options} />
                </div>
            </CardContent>
        </Card>
    )
}

export default LineChartCard