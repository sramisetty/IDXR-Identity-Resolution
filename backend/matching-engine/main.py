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
from algorithms.ai_hybrid import AIHybridMatcher
from utils.database import DatabaseConnection
from utils.cache import CacheManager
from utils.logger import setup_logger

# Import advanced services
from services.security_service import SecurityService, PrivacyService, ComplianceService
from services.admin_service import AdminService
from services.data_quality_service import DataQualityService
from services.reporting_service import ReportingService
from services.realtime_processor import RealtimeProcessor
from services.household_services import HouseholdDetector

load_dotenv()

app = FastAPI(
    title="IDXR Identity Cross-Resolution System",
    description="Enterprise-Grade Identity Cross-Resolution System with AI/ML, Real-time Processing, and Comprehensive Security",
    version="2.1.0",
    docs_url="/docs",
    redoc_url="/redoc"
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
ai_hybrid_matcher = AIHybridMatcher()

# Initialize advanced services
security_service = SecurityService()
privacy_service = PrivacyService()
compliance_service = ComplianceService()
admin_service = AdminService()
data_quality_service = DataQualityService()
reporting_service = ReportingService()
realtime_processor = RealtimeProcessor()
household_detector = HouseholdDetector()

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
    timestamp: str

# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "IDXR Identity Cross-Resolution System",
        "version": "2.1.0",
        "status": "operational",
        "features": [
            "AI/ML Hybrid Matching",
            "Real-time Processing",
            "Enterprise Security",
            "Household Detection",
            "Data Quality Validation",
            "Comprehensive Reporting",
            "Compliance Management"
        ],
        "timestamp": datetime.utcnow().isoformat() + "Z"
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
            "timestamp": datetime.utcnow().isoformat() + "Z"
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
        # Cache disabled for demo
        # cache_key = f"identity:{request.transaction_id}"
        # cached_result = await cache.get(cache_key)
        # 
        # if cached_result:
        #     logger.info(f"Cache hit for transaction {request.transaction_id}")
        #     return cached_result
        
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
        
        # 4. Use AI hybrid matching for enhanced accuracy
        if request.use_ml:
            ai_matches = await ai_hybrid_matcher.match_identity(demo_data)
            matches.extend(ai_matches)
            
            # Apply ML enhancement to all matches
            if matches:
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
            timestamp=datetime.utcnow().isoformat() + "Z"
        )
        
        # Cache disabled for demo
        # await cache.set(cache_key, response.dict(), expire=300)  # 5 minutes
        
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
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        return stats
    except Exception as e:
        logger.error(f"Error fetching statistics: {str(e)}")
        return {"error": str(e)}

# ========== ADMIN AND MANAGEMENT ENDPOINTS ==========

@app.get("/api/v1/admin/dashboard")
async def get_admin_dashboard():
    """Get comprehensive admin dashboard data"""
    try:
        dashboard_data = await admin_service.get_dashboard_data()
        return dashboard_data
    except Exception as e:
        logger.error(f"Dashboard error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard data retrieval failed: {str(e)}"
        )

@app.get("/api/v1/admin/system/diagnostics")
async def get_system_diagnostics():
    """Run comprehensive system diagnostics"""
    try:
        diagnostics = admin_service.get_system_diagnostics()
        return diagnostics
    except Exception as e:
        logger.error(f"Diagnostics error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"System diagnostics failed: {str(e)}"
        )

@app.get("/api/v1/admin/users")
async def list_users(include_inactive: bool = False):
    """List all users in the system"""
    try:
        users = admin_service.user_manager.list_users(include_inactive=include_inactive)
        return {"users": users, "count": len(users)}
    except Exception as e:
        logger.error(f"User listing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User listing failed: {str(e)}"
        )

@app.post("/api/v1/admin/users")
async def create_user(username: str, email: str, role: str, created_by: str = "admin"):
    """Create a new user account"""
    try:
        user = admin_service.user_manager.create_user(username, email, role, created_by)
        return {"status": "created", "user": user}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"User creation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"User creation failed: {str(e)}"
        )

# ========== SECURITY AND COMPLIANCE ENDPOINTS ==========

@app.get("/api/v1/security/compliance/{framework}")
async def get_compliance_status(framework: str):
    """Get compliance status for specific framework"""
    try:
        assessment = compliance_service.assess_compliance(framework)
        return assessment
    except Exception as e:
        logger.error(f"Compliance assessment error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance assessment failed: {str(e)}"
        )

@app.get("/api/v1/security/compliance/report")
async def get_compliance_report():
    """Get comprehensive compliance report"""
    try:
        report = compliance_service.generate_compliance_report()
        return report
    except Exception as e:
        logger.error(f"Compliance report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Compliance report generation failed: {str(e)}"
        )

@app.get("/api/v1/security/audit/logs")
async def get_audit_logs(start_date: str, end_date: str):
    """Get security audit logs for date range"""
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        logs = security_service.generate_audit_log(start, end)
        return {"logs": logs, "count": len(logs)}
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
        )
    except Exception as e:
        logger.error(f"Audit log error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audit log retrieval failed: {str(e)}"
        )

# ========== DATA QUALITY ENDPOINTS ==========

@app.post("/api/v1/data-quality/validate")
async def validate_data_quality(data: Dict[str, Any]):
    """Validate data quality for identity records"""
    try:
        validation_result = await data_quality_service.validate_identity_data(data)
        return validation_result
    except Exception as e:
        logger.error(f"Data validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data validation failed: {str(e)}"
        )

@app.get("/api/v1/data-quality/report")
async def get_data_quality_report():
    """Get comprehensive data quality report"""
    try:
        report = await data_quality_service.generate_quality_report()
        return report
    except Exception as e:
        logger.error(f"Data quality report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Data quality report generation failed: {str(e)}"
        )

# ========== HOUSEHOLD DETECTION ENDPOINTS ==========

@app.post("/api/v1/households/detect")
async def detect_households(identities: List[Dict[str, Any]]):
    """Detect household relationships among identities"""
    try:
        households = await household_detector.detect_households(identities)
        return {
            "households": [household.__dict__ for household in households],
            "count": len(households)
        }
    except Exception as e:
        logger.error(f"Household detection error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Household detection failed: {str(e)}"
        )

@app.get("/api/v1/households/{household_id}/relationships")
async def get_household_relationships(household_id: str):
    """Get relationship analysis for a specific household"""
    try:
        relationships = await household_detector.analyze_relationships(household_id)
        return relationships
    except Exception as e:
        logger.error(f"Relationship analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Relationship analysis failed: {str(e)}"
        )

# ========== REPORTING ENDPOINTS ==========

@app.get("/api/v1/reports/performance")
async def get_performance_report(days: int = 30):
    """Get system performance report"""
    try:
        report = await reporting_service.generate_performance_report(days)
        return report
    except Exception as e:
        logger.error(f"Performance report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Performance report generation failed: {str(e)}"
        )

@app.get("/api/v1/reports/matching")
async def get_matching_report(start_date: str, end_date: str):
    """Get matching effectiveness report"""
    try:
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        report = await reporting_service.generate_matching_report(start, end)
        return report
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid date format. Use ISO format (YYYY-MM-DD)"
        )
    except Exception as e:
        logger.error(f"Matching report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Matching report generation failed: {str(e)}"
        )

@app.get("/api/v1/reports/executive")
async def get_executive_report():
    """Get executive dashboard report"""
    try:
        report = await reporting_service.generate_executive_report()
        return report
    except Exception as e:
        logger.error(f"Executive report error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Executive report generation failed: {str(e)}"
        )

# ========== REAL-TIME PROCESSING ENDPOINTS ==========

@app.post("/api/v1/realtime/process")
async def submit_realtime_request(request_data: Dict[str, Any], priority: str = "normal"):
    """Submit request for real-time processing"""
    try:
        result = await realtime_processor.process_request(request_data, priority)
        return result
    except Exception as e:
        logger.error(f"Real-time processing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Real-time processing failed: {str(e)}"
        )

@app.get("/api/v1/realtime/status")
async def get_realtime_status():
    """Get real-time processing system status"""
    try:
        status_info = await realtime_processor.get_system_status()
        return status_info
    except Exception as e:
        logger.error(f"Real-time status error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Real-time status retrieval failed: {str(e)}"
        )

@app.get("/api/v1/realtime/queue")
async def get_queue_status():
    """Get processing queue status"""
    try:
        queue_status = realtime_processor.get_queue_status()
        return queue_status
    except Exception as e:
        logger.error(f"Queue status error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Queue status retrieval failed: {str(e)}"
        )

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