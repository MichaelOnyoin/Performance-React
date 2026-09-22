# HLB Jim Roberts Performance Hub — React Frontend

## Run
1. Copy `.env.example` to `.env` and confirm the FastAPI URL.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the Vite URL (normally http://localhost:5173).

## Required FastAPI CORS configuration
Add this to `app/main.py` after creating the FastAPI app:
```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Restart FastAPI after the change.

## Current screens
- JWT login
- Partner dashboard with team chart and employee ranking
- KPI entry/edit/submit
- Employee register
- Monthly KPI generation

## Backend alignment
This project uses the existing endpoints in the supplied FastAPI starter. Manager review UI can be added once a reviewer-specific listing endpoint and identity-to-employee ownership checks are implemented. Before production, use Microsoft Entra ID, PostgreSQL, HTTPS, audit logs, strict backend authorization, pinned package versions and accessibility/security testing.
