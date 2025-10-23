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
    plugins
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

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'bottom' as const
        },
        title: {
            display: true,
            text: 'Chart JS Line Chart'
        }
    }
};


const dataToDisplay = {
    labels,
    datasets: [{
        label: 'My first graph',
        data: [23,76,34],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.05
    }]


}

function BarChartCard({ data, isNumericCol }: { 
    data: Record<string, string>[];
    isNumericCol: Record<string, boolean>;
}) {

    const labels = ['A','B','C'];
    
  return (
    <Line/>
  )
}

export default BarChartCard