from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import statistics
import uvicorn
import re
from datetime import datetime
import random

# Create FastAPI app
app = FastAPI(title="DataGlass API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== HELPER FUNCTIONS ====================

def is_datetime_column(column_data: List[Any]) -> bool:
    """
    Classify if a column contains date/time data
    """
    if not column_data:
        return False
    
    # Sample first few non-null values
    sample_values = [val for val in column_data[:min(10, len(column_data))] 
                    if val is not None and str(val).strip() != '']
    
    if not sample_values:
        return False
    
    datetime_patterns = [
        r'\d{4}-\d{1,2}-\d{1,2}',  # YYYY-MM-DD
        r'\d{1,2}/\d{1,2}/\d{4}',  # MM/DD/YYYY or DD/MM/YYYY
        r'\d{1,2}-\d{1,2}-\d{4}',  # MM-DD-YYYY or DD-MM-YYYY
        r'\d{4}/\d{1,2}/\d{1,2}',  # YYYY/MM/DD
        r'\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}',  # DD Mon YYYY
        r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}',  # Mon DD, YYYY
        r'\d{4}-\d{1,2}-\d{1,2}\s+\d{1,2}:\d{1,2}',  # YYYY-MM-DD HH:MM
        r'\d{1,2}:\d{1,2}:\d{1,2}',  # HH:MM:SS (time only)
        r'\d{1,2}:\d{1,2}\s+(AM|PM|am|pm)',  # HH:MM AM/PM
    ]
    
    datetime_count = 0
    
    for value in sample_values:
        value_str = str(value).strip()
        
        # Check against regex patterns
        for pattern in datetime_patterns:
            if re.search(pattern, value_str, re.IGNORECASE):
                datetime_count += 1
                break
        else:
            # Try parsing with common datetime formats
            common_formats = [
                '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d',
                '%m-%d-%Y', '%d-%m-%Y', '%Y-%m-%d %H:%M:%S',
                '%m/%d/%Y %H:%M:%S', '%Y-%m-%d %H:%M',
                '%B %d, %Y', '%b %d, %Y', '%d %B %Y',
                '%H:%M:%S', '%H:%M'
            ]
            
            for fmt in common_formats:
                try:
                    datetime.strptime(value_str, fmt)
                    datetime_count += 1
                    break
                except ValueError:
                    continue
    
    # Consider it a datetime column if more than 70% of sampled values match
    return (datetime_count / len(sample_values)) > 0.7

# ==================== MODELS ====================

class DataRequest(BaseModel):
    data: List[Dict[str, Any]]
    isNumeric: Dict[str, bool]

class StatsResponse(BaseModel):
    success: bool
    stats: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

class ChartResponse(BaseModel):
    success: bool
    recommendations: Optional[List[Dict[str, Any]]] = None
    error: Optional[str] = None

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Root endpoint - health check"""
    return {
        "message": "DataGlass FastAPI Backend",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "/stats",
            "/chart-recommendations",
            "/docs"
        ]
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/stats")
async def get_stats(request: DataRequest) -> StatsResponse:
    try:
        data = request.data
        is_numeric = request.isNumeric
        
        if not data:
            return StatsResponse(success=False, error="No data provided")
        
        stats = {}
        
        # Get all column names from first row
        columns = list(data[0].keys()) if data else []
        
        for column in columns:
            # Extract column values (skip None/empty values)
            values = [row.get(column) for row in data if row.get(column) is not None and row.get(column) != '']
            
            if not values:
                stats[column] = {"count": 0, "type": "empty"}
                continue
                
            if is_numeric.get(column, False):
                # Numeric column stats
                numeric_values = []
                for val in values:
                    try:
                        numeric_values.append(float(val))
                    except (ValueError, TypeError):
                        continue
                
                if numeric_values:
                    stats[column] = {
                        "count": len(numeric_values),
                        "mean": round(statistics.mean(numeric_values), 2),
                        "median": round(statistics.median(numeric_values), 2),
                        "min": min(numeric_values),
                        "max": max(numeric_values),
                        "std": round(statistics.stdev(numeric_values), 2) if len(numeric_values) > 1 else 0,
                        "type": "numeric"
                    }
                else:
                    stats[column] = {"count": 0, "type": "numeric_invalid"}
            else:
                # Categorical column stats
                unique_values = list(set(str(val) for val in values))
                value_counts = {}
                for val in values:
                    val_str = str(val)
                    value_counts[val_str] = value_counts.get(val_str, 0) + 1
                
                # Find mode (most common value)
                mode = max(value_counts.items(), key=lambda x: x[1]) if value_counts else ("", 0)
                
                stats[column] = {
                    "count": len(values),
                    "unique": len(unique_values),
                    "mode": mode[0],
                    "mode_count": mode[1],
                    "top_values": sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5],
                    "type": "categorical"
                }
        
        return StatsResponse(success=True, stats=stats)
        
    except Exception as e:
        return StatsResponse(success=False, error=str(e))

@app.post("/chart-recommendations")
async def get_chart_recommendations(request: DataRequest) -> ChartResponse:
    """
    Get chart recommendations based on data structure
    """
    try:
        data = request.data
        is_numeric = request.isNumeric
        
        if not data:
            return ChartResponse(success=False, error="No data provided")
        
        recommendations = []
        columns = list(data[0].keys()) if data else []
        
        # Classify columns into different types
        numeric_columns = []
        categorical_columns = []
        datetime_columns = []
        
        for col in columns:
            column_values = [row.get(col) for row in data if row.get(col) is not None and row.get(col) != '']
            
            if is_numeric.get(col, False):
                numeric_columns.append(col)
            elif is_datetime_column(column_values):
                datetime_columns.append(col)
            else:
                categorical_columns.append(col)
        
        # Bar Chart - for categorical data
        if categorical_columns:
            for cat_col in categorical_columns[:2]:  # Limit to 2 recommendations
                # Check if all values are unique (not useful for bar chart) or have reasonable distribution
                column_values = [str(row.get(cat_col, '')) for row in data if row.get(cat_col) is not None and row.get(cat_col) != '']
                unique_values = set(column_values)
                
                # Only recommend bar chart if not all values are unique (some repetition exists)
                if len(unique_values) < len(column_values) and random.random() < 0.7:
                    recommendations.append({
                        "type": "bar",
                        "title": f"Distribution of {cat_col}",
                        "xAxis": cat_col,
                        "yAxis": "count",
                        "description": f"Shows the frequency of different values in {cat_col}"
                    })
        
        # Line Chart - only for time series (datetime + numeric)
        if datetime_columns and numeric_columns:
            for dt_col in datetime_columns[:1]:  # Limit to first datetime column
                for num_col in numeric_columns[:2]:  # Limit to first 2 numeric columns
                    if random.random() < 0.7:
                        recommendations.append({
                            "type": "line",
                            "title": f"{num_col} over Time",
                            "xAxis": dt_col,
                            "yAxis": num_col,
                            "description": f"Shows the trend of {num_col} over time ({dt_col})"
                        })
        
        # Pie Chart - for categorical data with limited unique values
        for cat_col in categorical_columns:
            column_values = [str(row.get(cat_col, '')) for row in data if row.get(cat_col) is not None and row.get(cat_col) != '']
            unique_values = set(column_values)
            # Good for pie charts: limited unique values AND not all values are unique
            if 2 <= len(unique_values) <= 8 and len(unique_values) < len(column_values) and random.random() < 0.7:
                recommendations.append({
                    "type": "pie",
                    "title": f"Composition of {cat_col}",
                    "dataKey": cat_col,
                    "description": f"Shows the proportion of different {cat_col} categories"
                })
                break  # Only one pie chart
        
        # Area Chart - only for time series (datetime + numeric)
        if datetime_columns and numeric_columns:
            for dt_col in datetime_columns[:1]:  # Limit to first datetime column
                for num_col in numeric_columns[:1]:  # Limit to first numeric column for area
                    if random.random() < 0.7:
                        recommendations.append({
                            "type": "area",
                            "title": f"{num_col} Area over Time",
                            "xAxis": dt_col,
                            "yAxis": num_col,
                            "description": f"Shows the area under {num_col} over time ({dt_col})"
                        })
        
        # Double nested loop for all column combinations (avoiding duplicates)
        for i, col1 in enumerate(columns):
            for j, col2 in enumerate(columns[i+1:], start=i+1):  # Start from i+1 to avoid duplicates
                col1_values = [row.get(col1) for row in data if row.get(col1) is not None and row.get(col1) != '']
                col2_values = [row.get(col2) for row in data if row.get(col2) is not None and row.get(col2) != '']
                
                col1_is_numeric = is_numeric.get(col1, False)
                col2_is_numeric = is_numeric.get(col2, False)
                col1_is_datetime = is_datetime_column(col1_values)
                col2_is_datetime = is_datetime_column(col2_values)
                
                # Numeric vs Numeric - Scatter Plot
                if col1_is_numeric and col2_is_numeric and random.random() < 0.7:
                    recommendations.append({
                        "type": "scatter",
                        "title": f"{col1} vs {col2}",
                        "xAxis": col1,
                        "yAxis": col2,
                        "description": f"Shows the relationship between {col1} and {col2}"
                    })
                
                # Categorical vs Numeric - Bar Chart (grouped)
                elif not col1_is_numeric and not col1_is_datetime and col2_is_numeric:
                    # Check if categorical column has meaningful groupings (not all unique values)
                    unique_col1 = set(str(val) for val in col1_values)
                    if len(unique_col1) < len(col1_values) and random.random() < 0.7:  # Some values repeat
                        recommendations.append({
                            "type": "bar",
                            "title": f"{col2} by {col1}",
                            "xAxis": col1,
                            "yAxis": col2,
                            "description": f"Shows {col2} values grouped by {col1} categories"
                        })
                
                # Numeric vs Categorical - Bar Chart (grouped)
                elif col1_is_numeric and not col2_is_numeric and not col2_is_datetime:
                    # Check if categorical column has meaningful groupings (not all unique values)
                    unique_col2 = set(str(val) for val in col2_values)
                    if len(unique_col2) < len(col2_values) and random.random() < 0.7:  # Some values repeat
                        recommendations.append({
                            "type": "bar",
                            "title": f"{col1} by {col2}",
                            "xAxis": col2,
                            "yAxis": col1,
                            "description": f"Shows {col1} values grouped by {col2} categories"
                        })
                
                # Categorical vs Categorical - Bubble Chart (if both have reasonable unique values)
                elif (not col1_is_numeric and not col1_is_datetime and 
                      not col2_is_numeric and not col2_is_datetime):
                    unique_col1 = set(str(val) for val in col1_values)
                    unique_col2 = set(str(val) for val in col2_values)
                    # Both columns should have reasonable categories AND some repeated values
                    if (len(unique_col1) <= 10 and len(unique_col2) <= 10 and 
                        len(unique_col1) < len(col1_values) and len(unique_col2) < len(col2_values) and 
                        random.random() < 0.7):
                        recommendations.append({
                            "type": "bubble",
                            "title": f"{col1} vs {col2} Distribution",
                            "xAxis": col1,
                            "yAxis": col2,
                            "description": f"Shows the distribution of {col1} and {col2} combinations"
                        })
        
        return ChartResponse(success=True, recommendations=recommendations[:10])  # Limit to 5 recommendations
        
    except Exception as e:
        return ChartResponse(success=False, error=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)