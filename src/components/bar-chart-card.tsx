/* eslint-disable @typescript-eslint/no-explicit-any */
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
    CardAction
} from "@/components/ui/card"
import {
    Button
} from "@/components/ui/button"
import { Trash2 } from 'lucide-react';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface BarChartCardProps {
    data: any[];
    xAxisKey: string;
    yAxisKey: string;
    title: string;
    chartKey: string;
    onDelete: (chartKey: string) => void;
}

function BarChartCard({ data, xAxisKey, yAxisKey, title, chartKey, onDelete }: BarChartCardProps) {
    // Process data based on yAxisKey
    const processedData = () => {
        if (yAxisKey.toLowerCase().includes('count')) {
            // Count occurrences of each value in xAxisKey
            const frequency: Record<string, number> = {};
            data.forEach(row => {
                let value = String(row[xAxisKey] || 'Unknown');
                
                // Check if this looks like a date and format it
                if (isDateLike(value)) {
                    value = formatDate(value);
                }
                
                frequency[value] = (frequency[value] || 0) + 1;
            });
            
            // If we have too many categories, group them or take top N
            const entries = Object.entries(frequency);
            if (entries.length > 20) {
                // Sort by frequency and take top 15
                const sortedEntries = entries.sort((a, b) => b[1] - a[1]).slice(0, 15);
                const result: Record<string, number> = {};
                sortedEntries.forEach(([key, val]) => {
                    result[key] = val;
                });
                return result;
            }
            
            return frequency;
        } else {
            // Use actual values
            const result: Record<string, number> = {};
            data.forEach(row => {
                let xValue = String(row[xAxisKey] || 'Unknown');
                
                // Check if this looks like a date and format it
                if (isDateLike(xValue)) {
                    xValue = formatDate(xValue);
                }
                
                const yValue = parseFloat(row[yAxisKey]) || 0;
                result[xValue] = yValue;
            });
            return result;
        }
    };
    
    // Helper function to check if a string looks like a date
    const isDateLike = (str: string): boolean => {
        // Check for common date patterns
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
            /^\d{2}[-/]\d{2}[-/]\d{4}/, // MM-DD-YYYY or MM/DD/YYYY
            /^\d{4}[-/]\d{2}[-/]\d{2}/, // YYYY-MM-DD or YYYY/MM/DD
            /^\d{2}[-/]\d{2}[-/]\d{2}/, // MM-DD-YY or MM/DD/YY
        ];
        
        return datePatterns.some(pattern => pattern.test(str)) || !isNaN(Date.parse(str));
    };
    
    // Helper function to format dates nicely
    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                // Format as MMM DD or MMM YYYY depending on data density
                return date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: '2-digit'
                });
            }
        } catch {
            // If date parsing fails, return original string
        }
        return dateStr;
    };

    const frequency = processedData();
    const labels = Object.keys(frequency);
    const values = Object.values(frequency);
    
    // Generate random bright colors for each bar
    const backgroundColors = labels.map(() => {
        const r = Math.floor(Math.random() * 156) + 100;
        const g = Math.floor(Math.random() * 156) + 100;
        const b = Math.floor(Math.random() * 156) + 100;
        return `rgba(${r}, ${g}, ${b}, 0.6)`;
    });
    
    const borderColors = backgroundColors.map(color => 
        color.replace('0.6', '1')
    );
    
    const chartData = {
        labels,
        datasets: [{
            label: yAxisKey,
            data: values,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1
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
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    maxTicksLimit: 10,
                    font: {
                        size: 10
                    }
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0
                }
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
                <CardDescription>Bar Chart</CardDescription>
                <CardAction>
                    <Button variant={'ghost'} onClick={handleDelete}>
                        <Trash2 className="h-[1.2rem] w-[1.2rem]"/>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent className="p-6">
                <div style={{ height: '300px' }}>
                    <Bar data={chartData} options={options} />
                </div>
            </CardContent>
        </Card>
    )
}

export default BarChartCard