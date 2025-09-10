from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

from algorithms.deterministic import DeterministicMatcher
from algorithms.probabilistic import ProbabilisticMatcher
from algorithms.ml_enhanced import MLEnhancedMatcher
from algorithms.fuzzy import FuzzyMatcher
from utils.database import DatabaseConnection
from utils.cache import CacheManager
from utils.logger import setup_logger

load_dotenv()

app = FastAPI(
    title="IDXR Matching Engine",
    description="Identity Cross-Resolution Matching Engine API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
logger = setup_logger("matching_engine")
db = DatabaseConnection()
cache = CacheManager()

# Initialize matchers
deterministic_matcher = DeterministicMatcher()
probabilistic_matcher = ProbabilisticMatcher()
ml_matcher = MLEnhancedMatcher()
fuzzy_matcher = FuzzyMatcher()

# Request/Response Models
class DemographicData(BaseModel):
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    middle_name: Optional[str] = Field(None, description="Middle name")
    dob: Optional[str] = Field(None, description="Date of birth (YYYY-MM-DD)")
    ssn: Optional[str] = Field(None, description="Social Security Number")
    ssn_last4: Optional[str] = Field(None, description="Last 4 digits of SSN")
    driver_license: Optional[str] = Field(None, description="Driver's license number")
    phone: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    address: Optional[Dict[str, str]] = Field(None, description="Address information")

class IdentityResolutionRequest(BaseModel):
    demographic_data: DemographicData
    source_system: str = Field(..., description="Source system identifier")
    transaction_id: str = Field(..., description="Unique transaction identifier")
    match_threshold: float = Field(0.85, description="Minimum confidence threshold")
    use_ml: bool = Field(True, description="Use ML-enhanced matching")

class MatchResult(BaseModel):
    identity_id: str
    confidence_score: float
    match_type: str
    matched_systems: List[str]
    match_details: Dict[str, Any]

class IdentityResolutionResponse(BaseModel):
    status: str
    transaction_id: str
    matches: List[MatchResult]
    processing_time_ms: int
    timestamp: datetime

# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "IDXR Matching Engine",
        "version": "1.0.0",
        "status": "operational",
        "timestamp": datetime.utcnow()
    }

@app.get("/health")
async def health_check():
    try:
        # Check database connection
        db_status = await db.check_connection()
        
        # Check cache connection
        cache_status = await cache.check_connection()
        
        return {
            "status": "healthy" if db_status and cache_status else "degraded",
            "components": {
                "database": "healthy" if db_status else "unhealthy",
                "cache": "healthy" if cache_status else "unhealthy",
                "matching_engine": "healthy"
            },
            "timestamp": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.post("/api/v1/resolve", response_model=IdentityResolutionResponse)
async def resolve_identity(request: IdentityResolutionRequest):
    """
    Resolve identity based on provided demographic data
    """
    start_time = datetime.utcnow()
    
    try:
        # Check cache first
        cache_key = f"identity:{request.transaction_id}"
        cached_result = await cache.get(cache_key)
        
        if cached_result:
            logger.info(f"Cache hit for transaction {request.transaction_id}")
            return cached_result
        
        # Prepare demographic data
        demo_data = request.demographic_data.dict(exclude_none=True)
        
        # Run matching algorithms
        matches = []
        
        # 1. Try deterministic matching first
        det_matches = await deterministic_matcher.match(demo_data)
        if det_matches:
            matches.extend(det_matches)
            logger.info(f"Found {len(det_matches)} deterministic matches")
        
        # 2. If no exact matches, try probabilistic
        if not matches or max(m['confidence_score'] for m in matches) < 0.95:
            prob_matches = await probabilistic_matcher.match(demo_data)
            matches.extend(prob_matches)
            logger.info(f"Found {len(prob_matches)} probabilistic matches")
        
        # 3. Apply fuzzy matching for edge cases
        fuzzy_matches = await fuzzy_matcher.match(demo_data)
        matches.extend(fuzzy_matches)
        
        # 4. Use ML enhancement if enabled
        if request.use_ml and matches:
            matches = await ml_matcher.enhance_matches(demo_data, matches)
        
        # Filter by threshold and deduplicate
        matches = [m for m in matches if m['confidence_score'] >= request.match_threshold]
        matches = deduplicate_matches(matches)
        
        # Sort by confidence score
        matches.sort(key=lambda x: x['confidence_score'], reverse=True)
        
        # Limit to top 10 matches
        matches = matches[:10]
        
        # Format response
        formatted_matches = [
            MatchResult(
                identity_id=m['identity_id'],
                confidence_score=m['confidence_score'],
                match_type=m['match_type'],
                matched_systems=m.get('matched_systems', []),
                match_details=m.get('match_details', {})
            )
            for m in matches
        ]
        
        # Calculate processing time
        processing_time = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        
        response = IdentityResolutionResponse(
            status="success",
            transaction_id=request.transaction_id,
            matches=formatted_matches,
            processing_time_ms=processing_time,
            timestamp=datetime.utcnow()
        )
        
        # Cache the result
        await cache.set(cache_key, response.dict(), expire=300)  # 5 minutes
        
        # Log metrics
        logger.info(f"Resolution completed: transaction={request.transaction_id}, "
                   f"matches={len(formatted_matches)}, time={processing_time}ms")
        
        return response
        
    except Exception as e:
        logger.error(f"Error resolving identity: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Identity resolution failed: {str(e)}"
        )

@app.post("/api/v1/batch/process")
async def process_batch(file_path: str, callback_url: Optional[str] = None):
    """
    Process a batch of identities
    """
    try:
        # This would typically queue the batch job
        batch_id = f"BATCH_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Queue batch processing job (implementation would use Celery/RQ)
        # queue_batch_job(batch_id, file_path, callback_url)
        
        return {
            "batch_id": batch_id,
            "status": "queued",
            "file_path": file_path,
            "callback_url": callback_url,
            "queued_at": datetime.utcnow()
        }
    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch processing failed: {str(e)}"
        )

@app.get("/api/v1/statistics")
async def get_statistics():
    """
    Get matching engine statistics
    """
    try:
        stats = {
            "total_requests": await cache.get("stats:total_requests") or 0,
            "successful_matches": await cache.get("stats:successful_matches") or 0,
            "average_confidence": await cache.get("stats:avg_confidence") or 0,
            "average_response_time": await cache.get("stats:avg_response_time") or 0,
            "cache_hit_rate": await cache.get("stats:cache_hit_rate") or 0,
            "timestamp": datetime.utcnow()
        }
        return stats
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        return {"error": str(e)}

def deduplicate_matches(matches: List[Dict]) -> List[Dict]:
    """
    Remove duplicate matches based on identity_id
    """
    seen = set()
    unique_matches = []
    
    for match in matches:
        if match['identity_id'] not in seen:
            seen.add(match['identity_id'])
            unique_matches.append(match)
    
    return unique_matches

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development"
    )