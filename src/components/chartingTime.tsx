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
            position: 'top' as const
        },
        title: {
            display: true,
            text: 'Chart JS Line Chart'
        }
    }
};

const labels = ['A','B','C'];

const data = {
    labels,
    datasets: [{
        label: 'My first graph',
        data: [23,76,34],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.05
    }]


}

function chartingTime() {
  return (
    <Line options={options} data={data}/>
  )
}

export default chartingTime