"""
Minimal test server for data transformation endpoints in IDXR system
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import uvicorn
import os

# Import transformation service
from services.data_transformation_service import DataTransformationService, FieldType, TransformationType

app = FastAPI(
    title="IDXR Data Transformation Test Server",
    description="Test server for data transformation endpoints",
    version="1.0.0",
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

# Initialize transformation service
data_transformation_service = DataTransformationService()

# Request models
class DataMappingRequest(BaseModel):
    mapping_data: Dict[str, Any] = Field(..., description="Data mapping configuration")

class DataTransformationRequest(BaseModel):
    data: List[Dict[str, Any]] = Field(..., description="Data to transform")
    mapping_config: Dict[str, Any] = Field(..., description="Mapping configuration")

class FieldSuggestionRequest(BaseModel):
    sample_data: List[Dict[str, Any]] = Field(..., description="Sample data for analysis")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Data Transformation Test Server"}

# ========== DATA TRANSFORMATION ENDPOINTS ==========

@app.post("/api/v1/transformations/create-mapping")
async def create_data_mapping(request: DataMappingRequest):
    """Create a new data mapping configuration"""
    try:
        mapping_config = await data_transformation_service.create_mapping_config(request.mapping_data)
        
        return {
            "status": "success",
            "mapping_config": {
                "mapping_name": mapping_config.mapping_name,
                "description": mapping_config.description,
                "field_count": len(mapping_config.field_mappings),
                "transformation_count": len(mapping_config.global_transformations)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create mapping configuration: {str(e)}"
        )

@app.post("/api/v1/transformations/validate-mapping")
async def validate_data_mapping(request: DataMappingRequest):
    """Validate a data mapping configuration"""
    try:
        mapping_config = await data_transformation_service.create_mapping_config(request.mapping_data)
        validation_result = await data_transformation_service.validate_mapping_config(mapping_config)
        
        return {
            "status": "success",
            "validation": validation_result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate mapping configuration: {str(e)}"
        )

@app.post("/api/v1/transformations/apply")
async def apply_data_transformations(request: DataTransformationRequest):
    """Apply data transformations to a dataset"""
    try:
        mapping_config = await data_transformation_service.create_mapping_config(request.mapping_config)
        transformed_data = await data_transformation_service.apply_transformations(request.data, mapping_config)
        
        return {
            "status": "success",
            "transformed_data": transformed_data,
            "record_count": len(transformed_data),
            "transformation_summary": {
                "original_fields": len(request.data[0]) if request.data else 0,
                "transformed_fields": len(transformed_data[0]) if transformed_data else 0,
                "applied_mappings": len(mapping_config.field_mappings),
                "applied_transformations": len(mapping_config.global_transformations)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to apply transformations: {str(e)}"
        )

@app.post("/api/v1/transformations/suggest-fields")
async def suggest_field_mappings(request: FieldSuggestionRequest):
    """Analyze sample data and suggest field mappings"""
    try:
        suggestions = await data_transformation_service.get_field_suggestions(request.sample_data)
        
        return {
            "status": "success",
            "suggestions": suggestions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate field suggestions: {str(e)}"
        )

@app.get("/api/v1/transformations/field-types")
async def get_available_field_types():
    """Get available field types for mapping"""
    try:
        field_types = [
            {
                "value": field_type.value,
                "name": field_type.name.replace("_", " ").title(),
                "description": f"Standard {field_type.value.replace('_', ' ')} field"
            }
            for field_type in FieldType
        ]
        
        return {
            "status": "success",
            "field_types": field_types
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get field types: {str(e)}"
        )

@app.get("/api/v1/transformations/transformation-types")
async def get_available_transformation_types():
    """Get available transformation types"""
    try:
        transformation_types = [
            {
                "value": trans_type.value,
                "name": trans_type.name.replace("_", " ").title(),
                "description": f"{trans_type.value.replace('_', ' ').title()} transformation"
            }
            for trans_type in TransformationType
        ]
        
        return {
            "status": "success",
            "transformation_types": transformation_types
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get transformation types: {str(e)}"
        )

if __name__ == "__main__":
    uvicorn.run(
        "test_transformations:app",
        host="0.0.0.0",
        port=3002,
        reload=True
    )