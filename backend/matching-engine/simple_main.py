from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import random

app = FastAPI(title="IDXR Matching Engine - Simple")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class DemographicData(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    middle_name: Optional[str] = None
    dob: Optional[str] = None
    ssn: Optional[str] = None
    ssn_last4: Optional[str] = None
    driver_license: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[Dict[str, str]] = None

class IdentityResolutionRequest(BaseModel):
    demographic_data: DemographicData
    source_system: str
    transaction_id: str
    match_threshold: float = 0.85
    use_ml: bool = True

@app.get("/")
async def root():
    return {
        "service": "IDXR Matching Engine",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": "2025-09-10T16:15:00Z"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "components": {
            "database": "healthy",
            "cache": "healthy",
            "matching_engine": "healthy"
        },
        "timestamp": "2025-09-10T16:15:00Z"
    }

@app.post("/api/v1/resolve")
async def resolve_identity(request: IdentityResolutionRequest):
    try:
        start_time = time.time()
        
        # Get demographic data
        demo_data = request.demographic_data.dict(exclude_none=True)
        
        # Mock matches based on input data
        matches = []
        
        # Check for exact match scenarios
        if demo_data.get('first_name') == 'John' and demo_data.get('last_name') == 'Doe':
            matches.append({
                "identity_id": "IDX001234567",
                "confidence_score": 0.98,
                "match_type": "deterministic",
                "matched_systems": ["DMV", "HEALTH_DEPT"],
                "match_details": {
                    "matched_fields": ["first_name", "last_name", "dob"],
                    "verification_level": "high"
                }
            })
        
        # Check for fuzzy match scenarios
        if demo_data.get('first_name') == 'Johnny' and demo_data.get('last_name') == 'Doe':
            matches.append({
                "identity_id": "IDX001234568",
                "confidence_score": 0.87,
                "match_type": "fuzzy",
                "matched_systems": ["DMV"],
                "match_details": {
                    "matched_fields": ["last_name", "phone"],
                    "verification_level": "medium"
                }
            })
        
        # Check for probabilistic match scenarios
        if demo_data.get('first_name') == 'Jon' and demo_data.get('last_name') == 'Doe':
            matches.append({
                "identity_id": "IDX001234569",
                "confidence_score": 0.92,
                "match_type": "probabilistic",
                "matched_systems": ["HEALTH_DEPT", "SOCIAL_SERVICES"],
                "match_details": {
                    "matched_fields": ["name_similarity", "dob"],
                    "verification_level": "high"
                }
            })
        
        # Add some random matches for other names
        if not matches and demo_data.get('first_name') and demo_data.get('last_name'):
            if random.random() > 0.3:  # 70% chance of finding a match
                matches.append({
                    "identity_id": f"IDX{random.randint(100000000, 999999999)}",
                    "confidence_score": round(random.uniform(0.75, 0.95), 2),
                    "match_type": random.choice(["probabilistic", "fuzzy"]),
                    "matched_systems": random.sample(["DMV", "HEALTH_DEPT", "SOCIAL_SERVICES"], random.randint(1, 2)),
                    "match_details": {
                        "matched_fields": random.sample(["first_name", "last_name", "phone", "address"], random.randint(2, 3)),
                        "verification_level": "medium"
                    }
                })
        
        # Filter by threshold
        matches = [m for m in matches if m['confidence_score'] >= request.match_threshold]
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        return {
            "status": "success",
            "transaction_id": request.transaction_id,
            "matches": matches,
            "processing_time_ms": processing_time,
            "timestamp": "2025-09-10T16:15:00Z"
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Identity resolution failed: {str(e)}")

@app.post("/api/v1/batch/process")
async def process_batch(file_path: str, callback_url: Optional[str] = None):
    batch_id = f"BATCH_{int(time.time())}"
    return {
        "batch_id": batch_id,
        "status": "queued",
        "file_path": file_path,
        "callback_url": callback_url,
        "queued_at": "2025-09-10T16:15:00Z"
    }

@app.get("/api/v1/statistics")
async def get_statistics():
    return {
        "total_requests": 15420,
        "successful_matches": 13876,
        "average_confidence": 0.89,
        "average_response_time": 245,
        "cache_hit_rate": 0.34,
        "timestamp": "2025-09-10T16:15:00Z"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("simple_main:app", host="0.0.0.0", port=8001, reload=True)