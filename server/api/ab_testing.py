from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
from pathlib import Path

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/ab-testing-data")
async def get_ab_testing_data():
    try:
        # Using relative path from the server directory
        csv_path = Path(__file__).parent.parent.parent / "database" / "ab_testing" / "ad_performance.csv"
        
        # Read CSV file using pandas
        df = pd.read_csv(csv_path)
        
        # Convert DataFrame to list of dictionaries
        data = df.to_dict('records')
        
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
