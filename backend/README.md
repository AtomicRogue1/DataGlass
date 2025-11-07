# FastAPI Backend Setup Guide

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Setup Environment
Edit `backend/.env` and add your API keys:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```

### 3. Run Your FastAPI Server
```bash
cd backend
python app.py
```

Your API will be available at: http://localhost:8000

### 4. Test Your API
- Health check: http://localhost:8000/
- API docs: http://localhost:8000/docs (FastAPI auto-generates this!)

## 🔧 Where to Work

### Backend Development
- **Main API file**: `backend/app.py`
- **Add your logic** in the `/api/analyze` endpoint
- **Add new endpoints** by following the existing pattern

### Frontend Connection
- **API service**: `src/services/api.ts`
- **Usage example**: Already imported in your dashboard

## 📝 Example Usage in Frontend

```typescript
import { ApiService } from "@/services/api";

// In your component:
const handleAnalyze = async () => {
  const result = await ApiService.analyzeData("Your prompt here");
  if (result.success) {
    console.log(result.answer);
  } else {
    console.error(result.error);
  }
};
```

## 🛠 Next Steps

1. **Start your FastAPI server**: `cd backend && python app.py`
2. **Implement your analyze logic** in `backend/app.py`
3. **Connect OpenAI** or add any other logic you need
4. **Update frontend** to call `ApiService.analyzeData()` instead of the old API

## 📚 Resources

- FastAPI docs: https://fastapi.tiangolo.com/
- API testing: http://localhost:8000/docs
- Your backend logs will show in the terminal where you run `python app.py`

Happy coding! 🎉