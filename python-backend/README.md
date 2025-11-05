# DataGlass Python Backend

FastAPI backend for CSV data analysis and AI-powered chart recommendations.

## Setup

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate virtual environment:**
   ```bash
   # Windows
   .\venv\Scripts\Activate

   # Mac/Linux
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create `.env` file:**
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

## Run the server

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Endpoints

### `GET /`
Health check endpoint

### `POST /api/upload-csv`
Upload and parse CSV file
- **Body:** `multipart/form-data` with file
- **Returns:** JSON data with columns and rows

### `POST /api/stats`
Calculate statistics for a column
- **Body:** `{ data: [], column: "columnName" }`
- **Returns:** mean, median, mode, min, max, std, count

### `POST /api/analyze`
AI-powered chart recommendations
- **Body:** `{ prompt: "your metadata prompt" }`
- **Returns:** JSON mapping columns to chart types

## Development

The server runs with auto-reload enabled. Edit `main.py` and it will automatically restart.

## Production

For production deployment:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Consider using:
- **Gunicorn** for process management
- **Docker** for containerization
- **Railway/Render/AWS** for hosting
