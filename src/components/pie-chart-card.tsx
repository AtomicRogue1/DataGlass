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

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

function PieChartCard({ data, columnName }: { 
    data: Record<string, string>[];
    columnName: string;
}) {
    // Extract column data and create frequency map
    const columnValues = data.map(row => row[columnName]);
    
    const frequency: Record<string, number> = {};
    columnValues.forEach(value => {
        if (value !== undefined && value !== null && value !== '') {
            frequency[value] = (frequency[value] || 0) + 1;
        }
    });
    
    const labels = Object.keys(frequency);
    const values = Object.values(frequency);
    
    // Generate colors
    const backgroundColors = labels.map((_, index) => {
        const hue = (index * 360) / labels.length;
        return `hsla(${hue}, 70%, 60%, 0.6)`;
    });
    
    const borderColors = labels.map((_, index) => {
        const hue = (index * 360) / labels.length;
        return `hsla(${hue}, 70%, 50%, 1)`;
    });
    
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
        }
    };
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{columnName}</CardTitle>
                <CardDescription>Pie Chart</CardDescription>
            </CardHeader>
            <CardContent>
                <Pie data={chartData} options={options} />
            </CardContent>
        </Card>
    )
}

export default PieChartCard
