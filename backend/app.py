from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import statistics
import uvicorn
import re
from datetime import datetime
import random

app = FastAPI(title="DataGlass API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== CONSTANTS ====================

DATETIME_PATTERNS = [
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

DATETIME_FORMATS = [
    '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d',
    '%m-%d-%Y', '%d-%m-%Y', '%Y-%m-%d %H:%M:%S',
    '%m/%d/%Y %H:%M:%S', '%Y-%m-%d %H:%M',
    '%B %d, %Y', '%b %d, %Y', '%d %B %Y',
    '%H:%M:%S', '%H:%M'
]

CHART_PROBABILITY = 0.7
DATETIME_THRESHOLD = 0.7
MAX_PIE_CATEGORIES = 8
MIN_PIE_CATEGORIES = 2
MAX_BUBBLE_CATEGORIES = 10

# ==================== HELPER FUNCTIONS ====================

def get_clean_column_values(data: List[Dict[str, Any]], column: str) -> List[Any]:
    """Extract non-null, non-empty values from a column."""
    return [row.get(column) for row in data 
            if row.get(column) is not None and str(row.get(column)).strip() != '']

def is_datetime_column(column_data: List[Any]) -> bool:
    """Classify if a column contains date/time data."""
    if not column_data:
        return False
    
    # Sample first few non-null values
    sample_values = [val for val in column_data[:min(10, len(column_data))] 
                    if val is not None and str(val).strip() != '']
    
    if not sample_values:
        return False
    
    datetime_count = 0
    
    for value in sample_values:
        value_str = str(value).strip()
        
        # Check against regex patterns
        if _matches_datetime_pattern(value_str):
            datetime_count += 1
        elif _matches_datetime_format(value_str):
            datetime_count += 1
    
    # Consider it a datetime column if more than threshold of sampled values match
    return (datetime_count / len(sample_values)) > DATETIME_THRESHOLD

def _matches_datetime_pattern(value_str: str) -> bool:
    """Check if value matches any datetime regex pattern."""
    for pattern in DATETIME_PATTERNS:
        if re.search(pattern, value_str, re.IGNORECASE):
            return True
    return False

def _matches_datetime_format(value_str: str) -> bool:
    """Try parsing value with common datetime formats."""
    for fmt in DATETIME_FORMATS:
        try:
            datetime.strptime(value_str, fmt)
            return True
        except ValueError:
            continue
    return False

def has_repeated_values(values: List[Any]) -> bool:
    """Check if a list has repeated values (not all unique)."""
    unique_values = set(str(val) for val in values)
    return len(unique_values) < len(values)

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

def calculate_numeric_stats(values: List[Any]) -> Dict[str, Any]:
    """Calculate statistics for numeric columns."""
    numeric_values = []
    for val in values:
        try:
            numeric_values.append(float(val))
        except (ValueError, TypeError):
            continue
    
    if not numeric_values:
        return {"count": 0, "type": "numeric_invalid"}
    
    return {
        "count": len(numeric_values),
        "mean": round(statistics.mean(numeric_values), 2),
        "median": round(statistics.median(numeric_values), 2),
        "min": min(numeric_values),
        "max": max(numeric_values),
        "std": round(statistics.stdev(numeric_values), 2) if len(numeric_values) > 1 else 0,
        "type": "numeric"
    }

def calculate_categorical_stats(values: List[Any]) -> Dict[str, Any]:
    """Calculate statistics for categorical columns."""
    unique_values = list(set(str(val) for val in values))
    value_counts = {}
    for val in values:
        val_str = str(val)
        value_counts[val_str] = value_counts.get(val_str, 0) + 1
    
    # Find mode (most common value)
    mode = max(value_counts.items(), key=lambda x: x[1]) if value_counts else ("", 0)
    
    return {
        "count": len(values),
        "unique": len(unique_values),
        "mode": mode[0],
        "mode_count": mode[1],
        "top_values": sorted(value_counts.items(), key=lambda x: x[1], reverse=True)[:5],
        "type": "categorical"
    }

@app.post("/stats")
async def get_stats(request: DataRequest) -> StatsResponse:
    try:
        data = request.data
        is_numeric = request.isNumeric
        
        if not data:
            return StatsResponse(success=False, error="No data provided")
        
        stats = {}
        columns = list(data[0].keys()) if data else []
        
        for column in columns:
            values = get_clean_column_values(data, column)
            
            if not values:
                stats[column] = {"count": 0, "type": "empty"}
                continue
                
            if is_numeric.get(column, False):
                stats[column] = calculate_numeric_stats(values)
            else:
                stats[column] = calculate_categorical_stats(values)
        
        return StatsResponse(success=True, stats=stats)
        
    except Exception as e:
        return StatsResponse(success=False, error=str(e))

def classify_columns(data: List[Dict[str, Any]], is_numeric: Dict[str, bool]) -> Dict[str, List[str]]:
    """Classify columns into numeric, categorical, and datetime types."""
    columns = list(data[0].keys()) if data else []
    
    numeric_columns = []
    categorical_columns = []
    datetime_columns = []
    
    for col in columns:
        column_values = get_clean_column_values(data, col)
        
        if is_numeric.get(col, False):
            numeric_columns.append(col)
        elif is_datetime_column(column_values):
            datetime_columns.append(col)
        else:
            categorical_columns.append(col)
    
    return {
        "numeric": numeric_columns,
        "categorical": categorical_columns,
        "datetime": datetime_columns
    }

def create_chart_recommendation(chart_type: str, title: str, x_axis: str, y_axis: str = None, 
                              data_key: str = None, description: str = "") -> Dict[str, str]:
    """Create a standardized chart recommendation object."""
    recommendation = {
        "type": chart_type,
        "title": title,
        "description": description
    }
    
    if data_key:
        recommendation["dataKey"] = data_key
    else:
        recommendation["xAxis"] = x_axis
        if y_axis:
            recommendation["yAxis"] = y_axis
    
    return recommendation

def get_basic_chart_recommendations(data: List[Dict[str, Any]], column_types: Dict[str, List[str]]) -> List[Dict[str, str]]:
    """Generate basic chart recommendations for single columns."""
    recommendations = []
    
    # Bar Charts for categorical data
    for cat_col in column_types["categorical"][:2]:
        column_values = [str(row.get(cat_col, '')) for row in data 
                        if row.get(cat_col) is not None and row.get(cat_col) != '']
        
        if has_repeated_values(column_values) and random.random() < CHART_PROBABILITY:
            recommendations.append(create_chart_recommendation(
                "bar", f"Distribution of {cat_col}", cat_col, "count",
                description=f"Shows the frequency of different values in {cat_col}"
            ))
    
    # Time series charts
    if column_types["datetime"] and column_types["numeric"]:
        for dt_col in column_types["datetime"][:1]:
            for num_col in column_types["numeric"][:2]:
                if random.random() < CHART_PROBABILITY:
                    # Line chart
                    recommendations.append(create_chart_recommendation(
                        "line", f"{num_col} over Time", dt_col, num_col,
                        description=f"Shows the trend of {num_col} over time ({dt_col})"
                    ))
                    
                if random.random() < CHART_PROBABILITY and len(recommendations) < 10:
                    # Area chart
                    recommendations.append(create_chart_recommendation(
                        "area", f"{num_col} Area over Time", dt_col, num_col,
                        description=f"Shows the area under {num_col} over time ({dt_col})"
                    ))
                    break  # Only one area chart per datetime column
    
    # Pie Charts
    for cat_col in column_types["categorical"]:
        column_values = [str(row.get(cat_col, '')) for row in data 
                        if row.get(cat_col) is not None and row.get(cat_col) != '']
        unique_values = set(column_values)
        
        if (MIN_PIE_CATEGORIES <= len(unique_values) <= MAX_PIE_CATEGORIES and 
            has_repeated_values(column_values) and random.random() < CHART_PROBABILITY):
            recommendations.append(create_chart_recommendation(
                "pie", f"Composition of {cat_col}", None, None, cat_col,
                description=f"Shows the proportion of different {cat_col} categories"
            ))
            break  # Only one pie chart
    
    return recommendations

def get_combination_chart_recommendations(data: List[Dict[str, Any]], column_types: Dict[str, List[str]], 
                                        is_numeric: Dict[str, bool]) -> List[Dict[str, str]]:
    """Generate chart recommendations for column combinations."""
    recommendations = []
    columns = column_types["numeric"] + column_types["categorical"] + column_types["datetime"]
    
    for i, col1 in enumerate(columns):
        for col2 in columns[i+1:]:
            col1_values = get_clean_column_values(data, col1)
            col2_values = get_clean_column_values(data, col2)
            
            col1_is_numeric = is_numeric.get(col1, False)
            col2_is_numeric = is_numeric.get(col2, False)
            col1_is_datetime = is_datetime_column(col1_values)
            col2_is_datetime = is_datetime_column(col2_values)
            
            # Numeric vs Numeric - Scatter Plot
            if col1_is_numeric and col2_is_numeric and random.random() < CHART_PROBABILITY:
                recommendations.append(create_chart_recommendation(
                    "scatter", f"{col1} vs {col2}", col1, col2,
                    description=f"Shows the relationship between {col1} and {col2}"
                ))
            
            # Categorical vs Numeric - Grouped Bar Chart
            elif not col1_is_numeric and not col1_is_datetime and col2_is_numeric:
                if has_repeated_values(col1_values) and random.random() < CHART_PROBABILITY:
                    recommendations.append(create_chart_recommendation(
                        "bar", f"{col2} by {col1}", col1, col2,
                        description=f"Shows {col2} values grouped by {col1} categories"
                    ))
            
            # Numeric vs Categorical - Grouped Bar Chart
            elif col1_is_numeric and not col2_is_numeric and not col2_is_datetime:
                if has_repeated_values(col2_values) and random.random() < CHART_PROBABILITY:
                    recommendations.append(create_chart_recommendation(
                        "bar", f"{col1} by {col2}", col2, col1,
                        description=f"Shows {col1} values grouped by {col2} categories"
                    ))
            
            # Categorical vs Categorical - Bubble Chart
            elif (not col1_is_numeric and not col1_is_datetime and 
                  not col2_is_numeric and not col2_is_datetime):
                unique_col1 = set(str(val) for val in col1_values)
                unique_col2 = set(str(val) for val in col2_values)
                
                if (len(unique_col1) <= MAX_BUBBLE_CATEGORIES and len(unique_col2) <= MAX_BUBBLE_CATEGORIES and 
                    has_repeated_values(col1_values) and has_repeated_values(col2_values) and 
                    random.random() < CHART_PROBABILITY):
                    recommendations.append(create_chart_recommendation(
                        "bubble", f"{col1} vs {col2} Distribution", col1, col2,
                        description=f"Shows the distribution of {col1} and {col2} combinations"
                    ))
    
    return recommendations

@app.post("/chart-recommendations")
async def get_chart_recommendations(request: DataRequest) -> ChartResponse:
    """Get chart recommendations based on data structure."""
    try:
        data = request.data
        is_numeric = request.isNumeric
        
        if not data:
            return ChartResponse(success=False, error="No data provided")
        
        # Classify columns
        column_types = classify_columns(data, is_numeric)
        
        # Get basic recommendations
        recommendations = get_basic_chart_recommendations(data, column_types)
        
        # Get combination recommendations
        combination_recommendations = get_combination_chart_recommendations(data, column_types, is_numeric)
        recommendations.extend(combination_recommendations)
        
        return ChartResponse(success=True, recommendations=recommendations[:10])  # Limit to 10 recommendations
        
    except Exception as e:
        return ChartResponse(success=False, error=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)