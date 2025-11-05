from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import numpy as np
import random
from scipy.stats import spearmanr, chi2_contingency
from typing import Dict, List
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DataGlass API", version="1.0.0")

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== MODELS ====================

class StatsRequest(BaseModel):
    data: list[dict]
    column: str


class AnalyzeRequest(BaseModel):
    data: List[Dict[str, str]]
    isNumericCol: Dict[str, bool]


class ChartRecommendation(BaseModel):
    chartType: str
    columnX: str
    columnY: str


# ==================== HELPER FUNCTIONS ====================

def is_date_column(df: pd.DataFrame, col: str) -> bool:
    """Check if a column contains date-like values"""
    try:
        # Try to parse as datetime
        pd.to_datetime(df[col], errors='coerce')
        # If more than 50% of values are valid dates, consider it a date column
        valid_dates = pd.to_datetime(df[col], errors='coerce').notna().sum()
        return valid_dates / len(df) > 0.5
    except:
        return False


def cramers_v(x: pd.Series, y: pd.Series) -> float:
    """Calculate Cramér's V statistic for categorical association"""
    try:
        confusion_matrix = pd.crosstab(x, y)
        chi2 = chi2_contingency(confusion_matrix)[0]
        n = confusion_matrix.sum().sum()
        min_dim = min(confusion_matrix.shape) - 1
        return np.sqrt(chi2 / (n * min_dim)) if min_dim > 0 else 0
    except:
        return 0


def get_unique_count(series: pd.Series) -> int:
    """Get count of unique values in a series"""
    return series.nunique()


# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "DataGlass Python API",
        "version": "1.0.0"
    }


@app.post("/api/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    """
    Upload CSV file, parse with pandas, return JSON data
    
    Returns:
        - success: bool
        - data: list of row dictionaries
        - columns: list of column names
        - rowCount: number of rows
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV")
        
        # Read and parse CSV
        df = pd.read_csv(file.file)
        
        # Convert to records
        data = df.to_dict(orient="records")
        columns = df.columns.tolist()
        
        return {
            "success": True,
            "data": data,
            "columns": columns,
            "rowCount": len(df)
        }
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty")
    except pd.errors.ParserError:
        raise HTTPException(status_code=400, detail="Failed to parse CSV. Check file format.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")


@app.post("/api/stats")
async def compute_stats(req: StatsRequest):
    """
    Calculate statistics for a specific column
    
    Returns mean, median, mode, min, max, std, count for numeric columns
    """
    try:
        df = pd.DataFrame(req.data)
        
        if req.column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{req.column}' not found")
        
        # Convert to numeric, coerce errors to NaN
        col_data = pd.to_numeric(df[req.column], errors='coerce').dropna()
        
        if len(col_data) == 0:
            raise HTTPException(status_code=400, detail=f"Column '{req.column}' has no numeric data")
        
        # Calculate mode (can have multiple values)
        mode_result = col_data.mode()
        mode_value = mode_result.tolist() if len(mode_result) > 0 else []
        
        return {
            "success": True,
            "column": req.column,
            "stats": {
                "mean": float(col_data.mean()),
                "median": float(col_data.median()),
                "mode": mode_value,
                "min": float(col_data.min()),
                "max": float(col_data.max()),
                "std": float(col_data.std()),
                "count": int(len(col_data))
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze")
async def analyze(req: AnalyzeRequest):
    """
    Analyze CSV data and recommend chart types based on statistical analysis
    
    Logic:
    - Time series: If one column is date and rand > 0.5 → timeBarChart
    - Scatter: If both numerical and Spearman correlation > 0.4 → scatter
    - Stacked bar: If both categorical and one has 2-3 categories and Cramér's V > 0.3 → stackedBarChart
    - Bar chart: If one numerical, one categorical and rand > 0.5 → barChart
    
    Returns:
        List of chart recommendations with type and column pairs
    """
    try:
        # Convert data to DataFrame
        df = pd.DataFrame(req.data)
        columns = list(df.columns)
        is_numeric = req.isNumericCol
        
        # Identify date columns
        date_columns = [col for col in columns if is_date_column(df, col)]
        
        recommendations: List[Dict] = []
        
        # Iterate through all column pairs
        for i, col_x in enumerate(columns):
            for col_y in columns[i+1:]:
                
                # Skip if same column
                if col_x == col_y:
                    continue
                
                x_is_numeric = is_numeric.get(col_x, False)
                y_is_numeric = is_numeric.get(col_y, False)
                x_is_date = col_x in date_columns
                y_is_date = col_y in date_columns
                
                # Rule 1: Time series (one date column + random)
                if (x_is_date and not y_is_date) or (y_is_date and not x_is_date):
                    if random.random() > 0.5:
                        date_col = col_x if x_is_date else col_y
                        value_col = col_y if x_is_date else col_x
                        recommendations.append({
                            "chartType": "timeBarChart",
                            "columnX": date_col,
                            "columnY": value_col
                        })
                        continue
                
                # Rule 2: Scatter plot (both numerical + high correlation)
                if x_is_numeric and y_is_numeric:
                    try:
                        x_data = pd.to_numeric(df[col_x], errors='coerce').dropna()
                        y_data = pd.to_numeric(df[col_y], errors='coerce').dropna()
                        
                        # Align indices
                        common_idx = x_data.index.intersection(y_data.index)
                        if len(common_idx) > 2:
                            correlation, _ = spearmanr(x_data[common_idx], y_data[common_idx])
                            
                            if abs(correlation) > 0.4:
                                recommendations.append({
                                    "chartType": "scatter",
                                    "columnX": col_x,
                                    "columnY": col_y
                                })
                                continue
                    except:
                        pass
                
                # Rule 3: Stacked bar (both categorical + one has 2-3 categories + high Cramér's V)
                if not x_is_numeric and not y_is_numeric:
                    x_unique = get_unique_count(df[col_x])
                    y_unique = get_unique_count(df[col_y])
                    
                    if (2 <= x_unique <= 3) or (2 <= y_unique <= 3):
                        cramers = cramers_v(df[col_x], df[col_y])
                        
                        if cramers > 0.3:
                            recommendations.append({
                                "chartType": "stackedBarChart",
                                "columnX": col_x,
                                "columnY": col_y
                            })
                            continue
                
                # Rule 4: Bar chart (one numerical, one categorical + random)
                if (x_is_numeric and not y_is_numeric) or (not x_is_numeric and y_is_numeric):
                    if random.random() > 0.5:
                        cat_col = col_x if not x_is_numeric else col_y
                        num_col = col_y if not y_is_numeric else col_x
                        recommendations.append({
                            "chartType": "barChart",
                            "columnX": cat_col,
                            "columnY": num_col
                        })
                        continue
        
        return {
            "success": True,
            "recommendations": recommendations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
