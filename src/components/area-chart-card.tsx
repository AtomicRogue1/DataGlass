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
    Filler,
} from 'chart.js';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AreaChartCardProps {
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    title: string;
}

function AreaChartCard({ data, xAxisKey, yAxisKey, title }: AreaChartCardProps) {
    // Process data for area chart
    const processedData = () => {
        if (xAxisKey === 'index') {
            return data.map((item, index) => ({
                x: index + 1,
                y: parseFloat(item[yAxisKey]) || 0
            }));
        } else {
            return data.map(item => ({
                x: item[xAxisKey],
                y: parseFloat(item[yAxisKey]) || 0
            }));
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
            borderColor: 'rgba(139, 92, 246, 1)',
            backgroundColor: 'rgba(139, 92, 246, 0.3)',
            borderWidth: 2,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: 'rgba(139, 92, 246, 1)',
            pointBorderColor: 'rgba(139, 92, 246, 1)',
            pointRadius: 3,
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

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>Area Chart</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div style={{ height: '300px' }}>
                    <Line data={chartConfig} options={options} />
                </div>
            </CardContent>
        </Card>
    )
}

export default AreaChartCard