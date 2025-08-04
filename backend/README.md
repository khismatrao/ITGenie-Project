# Backend Setup Guide

This README provides instructions to set up and run the backend for the ITGenie Project.

## Prerequisites
- Python 3.11 or higher
- Git
- Windows PowerShell (recommended)

## 1. Clone the Repository
```
git clone <repository-url>
cd ITGenie-Project/backend
```

## 2. Create and Activate Virtual Environment
```
python -m venv venv
.\venv\Scripts\Activate
```

## 3. Install Dependencies
```
pip install --upgrade pip
pip install -r requirements.txt
```

## 4. Configuration
- Edit `backend/app/config.py` to set environment variables or other settings as needed.

## 5. Run the Backend
```
python app/main.py
or
uvicorn app.main:app --reload
```

## 6. Project Structure
- `backend/app/` - Main backend application code
- `backend/app/models/` - Data models and schemas
- `backend/requirements.txt` - Python dependencies

## 7. Additional Notes
- To add new dependencies, update `requirements.txt` and run `pip install -r requirements.txt` again.
- For troubleshooting, check the logs and ensure all environment variables are set correctly.

---
For further assistance, contact the project maintainer.
