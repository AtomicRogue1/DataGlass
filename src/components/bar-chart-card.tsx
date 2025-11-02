import React from 'react'
import {
    Chart as ChartJS, 
    CategoryScale,
    LinearScale,
    BarElement,
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
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

function BarChartCard({ data, columnName }: { 
    data: Record<string, string>[];
    columnName: string;
}) {
    // Extract column data
    const columnValues = data.map(row => row[columnName]);
    
    // Create frequency map for the data
    const frequency: Record<string, number> = {};
    columnValues.forEach(value => {
        if (value !== undefined && value !== null && value !== '') {
            frequency[value] = (frequency[value] || 0) + 1;
        }
    });
    
    const labels = Object.keys(frequency);
    const values = Object.values(frequency);
    
    // Generate random bright colors for each bar (avoiding dark colors)
    const backgroundColors = labels.map(() => {
        const r = Math.floor(Math.random() * 156) + 100; // 100-255
        const g = Math.floor(Math.random() * 156) + 100; // 100-255
        const b = Math.floor(Math.random() * 156) + 100; // 100-255
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    });
    
    const borderColors = backgroundColors.map(color => 
        color.replace('0.6', '1')
    );
    
    const chartData = {
        labels,
        datasets: [{
            label: columnName,
            data: values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
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
                text: `${columnName} Distribution`
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
            }
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{columnName}</CardTitle>
                <CardDescription>Bar Chart</CardDescription>
            </CardHeader>
            <CardContent>
                <Bar data={chartData} options={options} />
            </CardContent>
        </Card>
    )
}

export default BarChartCard