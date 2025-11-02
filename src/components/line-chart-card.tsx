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
} from "@/components/ui/card"
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

function LineChartCard({ data, columnName }: { 
    data: Record<string, string>[];
    columnName: string;
}) {
    // Extract column data
    const columnValues = data.map((row, index) => ({
        x: index + 1,
        y: parseFloat(row[columnName]) || 0
    }));
    
    const labels = columnValues.map(v => v.x.toString());
    const values = columnValues.map(v => v.y);
    
    // Generate random bright color (avoiding dark colors)
    const r = Math.floor(Math.random() * 156) + 50; 
    const g = Math.floor(Math.random() * 156) + 50; 
    const b = Math.floor(Math.random() * 156) + 50; 
    
    const chartData = {
        labels,
        datasets: [{
            label: columnName,
            data: values,
            fill: false,
            borderColor: `rgb(${r}, ${g}, ${b})`,
            backgroundColor: `rgba(${r}, ${g}, ${b}, 0.5)`,
            tension: 0.1
        }]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom' as const
            },
            title: {
                display: true,
                text: `${columnName} Trend`
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{columnName}</CardTitle>
                <CardDescription>Line Chart</CardDescription>
            </CardHeader>
            <CardContent>
                <Line data={chartData} options={options} />
            </CardContent>
        </Card>
    )
}

export default LineChartCard
