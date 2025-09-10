"""
Comprehensive Batch Processing Service for IDXR
Handles large-scale identity matching, data validation, and processing jobs
"""

import asyncio
import json
import uuid
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from enum import Enum
import logging
from pathlib import Path
import csv
import io
from dataclasses import dataclass, asdict
import time
import hashlib

from algorithms.deterministic import DeterministicMatcher
from algorithms.probabilistic import ProbabilisticMatcher
from algorithms.fuzzy import FuzzyMatcher
from algorithms.ai_hybrid import AIHybridMatcher
from algorithms.ml_enhanced import MLEnhancedMatcher
from utils.database import DatabaseConnection
from utils.cache import CacheManager
from utils.logger import setup_logger
from .data_source_service import DataSourceService, DataSourceConfig, DataSourceType, FileFormat
from .output_format_service import OutputFormatService, OutputConfig, OutputFormat
from .data_quality_service import DataQualityService, ValidationLevel, DataQuality
from .household_services import HouseholdDetector
from .data_transformation_service import DataTransformationService

logger = setup_logger("batch_processing")

class JobStatus(Enum):
    QUEUED = "queued"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class JobType(Enum):
    IDENTITY_MATCHING = "identity_matching"
    DATA_VALIDATION = "data_validation"
    HOUSEHOLD_DETECTION = "household_detection"
    DATA_QUALITY = "data_quality"
    DEDUPLICATION = "deduplication"
    BULK_EXPORT = "bulk_export"

class JobPriority(Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

@dataclass
class BatchJob:
    job_id: str
    name: str
    job_type: JobType
    status: JobStatus
    priority: JobPriority
    created_by: str
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress: float = 0.0
    total_records: int = 0
    processed_records: int = 0
    successful_records: int = 0
    failed_records: int = 0
    error_message: Optional[str] = None
    input_file_path: Optional[str] = None
    output_file_path: Optional[str] = None
    config: Dict[str, Any] = None
    estimated_completion: Optional[datetime] = None
    data_source_config: Optional[DataSourceConfig] = None
    output_config: Optional[OutputConfig] = None
    
    def to_dict(self):
        return {
            'job_id': self.job_id,
            'name': self.name,
            'job_type': self.job_type.value,
            'status': self.status.value,
            'priority': self.priority.value,
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat(),
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'progress': self.progress,
            'total_records': self.total_records,
            'processed_records': self.processed_records,
            'successful_records': self.successful_records,
            'failed_records': self.failed_records,
            'error_message': self.error_message,
            'input_file_path': self.input_file_path,
            'output_file_path': self.output_file_path,
            'config': self.config,
            'estimated_completion': self.estimated_completion.isoformat() if self.estimated_completion else None
        }

@dataclass
class BatchResult:
    record_id: str
    identity_id: Optional[str]
    confidence_score: Optional[float]
    match_type: Optional[str]
    status: str
    error_message: Optional[str] = None
    processing_time_ms: Optional[int] = None
    matched_systems: Optional[List[str]] = None
    match_details: Optional[Dict[str, Any]] = None

class BatchProcessingService:
    def __init__(self):
        self.jobs: Dict[str, BatchJob] = {}
        self.job_queue: List[str] = []
        self.running_jobs: List[str] = []
        self.max_concurrent_jobs = 3
        self.db = DatabaseConnection()
        self.cache = CacheManager()
        
        # Initialize matchers
        self.deterministic_matcher = DeterministicMatcher()
        self.probabilistic_matcher = ProbabilisticMatcher()
        self.fuzzy_matcher = FuzzyMatcher()
        self.ai_hybrid_matcher = AIHybridMatcher()
        self.ml_matcher = MLEnhancedMatcher()
        
        # Initialize data source and output services
        self.data_source_service = DataSourceService()
        self.output_format_service = OutputFormatService()
        
        # Initialize additional processing services
        self.data_quality_service = DataQualityService()
        self.household_detector = HouseholdDetector()
        self.data_transformation_service = DataTransformationService()
        
        # Job processor task will be started manually when needed
        self._processor_task = None
        
    async def create_batch_job(
        self,
        name: str,
        job_type: JobType,
        created_by: str,
        input_data: Union[str, List[Dict], Dict],
        config: Dict[str, Any] = None,
        priority: JobPriority = JobPriority.NORMAL
    ) -> str:
        """Create a new batch processing job"""
        
        job_id = f"BATCH_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}"
        
        # Process input data
        input_file_path = None
        total_records = 0
        
        if isinstance(input_data, str):
            # File path provided
            input_file_path = input_data
            total_records = await self._count_records_in_file(input_file_path)
        elif isinstance(input_data, list):
            # List of records provided
            input_file_path = await self._save_input_data(job_id, input_data)
            total_records = len(input_data)
        elif isinstance(input_data, dict):
            # Single record provided
            input_file_path = await self._save_input_data(job_id, [input_data])
            total_records = 1
            
        # Create job
        job = BatchJob(
            job_id=job_id,
            name=name,
            job_type=job_type,
            status=JobStatus.QUEUED,
            priority=priority,
            created_by=created_by,
            created_at=datetime.now(),
            total_records=total_records,
            input_file_path=input_file_path,
            config=config or {}
        )
        
        # Calculate estimated completion time
        job.estimated_completion = self._estimate_completion_time(job)
        
        self.jobs[job_id] = job
        self._add_to_queue(job_id)
        
        logger.info(f"Created batch job {job_id}: {name} ({total_records} records)")
        
        return job_id
    
    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a specific batch job"""
        job = self.jobs.get(job_id)
        if not job:
            return None
            
        return job.to_dict()
    
    async def get_all_jobs(
        self,
        status_filter: Optional[JobStatus] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get list of all batch jobs with optional filtering"""
        
        jobs = list(self.jobs.values())
        
        if status_filter:
            jobs = [job for job in jobs if job.status == status_filter]
            
        # Sort by created_at desc
        jobs.sort(key=lambda x: x.created_at, reverse=True)
        
        # Apply pagination
        jobs = jobs[offset:offset + limit]
        
        return [job.to_dict() for job in jobs]
    
    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a batch job"""
        job = self.jobs.get(job_id)
        if not job:
            return False
            
        if job.status in [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED]:
            return False
            
        job.status = JobStatus.CANCELLED
        job.completed_at = datetime.now()
        
        # Remove from queue if queued
        if job_id in self.job_queue:
            self.job_queue.remove(job_id)
            
        # Remove from running jobs if running
        if job_id in self.running_jobs:
            self.running_jobs.remove(job_id)
            
        logger.info(f"Cancelled batch job {job_id}")
        return True
    
    async def pause_job(self, job_id: str) -> bool:
        """Pause a running batch job"""
        job = self.jobs.get(job_id)
        if not job or job.status != JobStatus.RUNNING:
            return False
            
        job.status = JobStatus.PAUSED
        logger.info(f"Paused batch job {job_id}")
        return True
        
    async def resume_job(self, job_id: str) -> bool:
        """Resume a paused batch job"""
        job = self.jobs.get(job_id)
        if not job or job.status != JobStatus.PAUSED:
            return False
            
        job.status = JobStatus.QUEUED
        self._add_to_queue(job_id)
        logger.info(f"Resumed batch job {job_id}")
        return True
    
    async def get_job_results(
        self,
        job_id: str,
        page: int = 1,
        limit: int = 100,
        status_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get results for a completed batch job"""
        
        job = self.jobs.get(job_id)
        if not job:
            return {"error": "Job not found"}
            
        if job.status != JobStatus.COMPLETED:
            return {"error": "Job not completed yet"}
            
        # Load results from output file
        results = await self._load_job_results(job_id, page, limit, status_filter)
        
        return {
            "job_id": job_id,
            "status": "success",
            "page": page,
            "limit": limit,
            "total_records": job.total_records,
            "successful_records": job.successful_records,
            "failed_records": job.failed_records,
            "results": results
        }
    
    async def get_queue_statistics(self) -> Dict[str, Any]:
        """Get current queue statistics"""
        
        active_jobs = [job for job in self.jobs.values() if job.status == JobStatus.RUNNING]
        queued_jobs = [job for job in self.jobs.values() if job.status == JobStatus.QUEUED]
        completed_today = [
            job for job in self.jobs.values() 
            if job.status == JobStatus.COMPLETED and 
            job.completed_at and job.completed_at.date() == datetime.now().date()
        ]
        
        # Calculate processing rate
        processing_rate = await self._calculate_processing_rate()
        
        return {
            "active_jobs": len(active_jobs),
            "queued_jobs": len(queued_jobs),
            "completed_today": len(completed_today),
            "processing_rate_per_hour": processing_rate,
            "total_jobs": len(self.jobs),
            "queue_wait_time_estimate": self._estimate_queue_wait_time()
        }
    
    async def export_job_results(
        self,
        job_id: str,
        format: str = "csv"
    ) -> str:
        """Export job results to specified format"""
        
        job = self.jobs.get(job_id)
        if not job or job.status != JobStatus.COMPLETED:
            raise ValueError("Job not found or not completed")
            
        results = await self._load_all_job_results(job_id)
        
        if format.lower() == "csv":
            return await self._export_to_csv(job_id, results)
        elif format.lower() == "json":
            return await self._export_to_json(job_id, results)
        elif format.lower() == "excel":
            return await self._export_to_excel(job_id, results)
        else:
            raise ValueError("Unsupported export format")
    
    # Private methods
    
    async def _job_processor(self):
        """Background job processor"""
        while True:
            try:
                # Process jobs if we have capacity
                if len(self.running_jobs) < self.max_concurrent_jobs and self.job_queue:
                    job_id = self._get_next_job()
                    if job_id:
                        await self._start_job(job_id)
                
                # Update running jobs
                for job_id in self.running_jobs.copy():
                    await self._update_job_progress(job_id)
                    
                await asyncio.sleep(1)  # Check every second
                
            except Exception as e:
                logger.error(f"Error in job processor: {str(e)}")
                await asyncio.sleep(5)
    
    def _add_to_queue(self, job_id: str):
        """Add job to queue based on priority"""
        job = self.jobs[job_id]
        
        # Insert based on priority
        if job.priority == JobPriority.URGENT:
            self.job_queue.insert(0, job_id)
        elif job.priority == JobPriority.HIGH:
            # Insert after urgent jobs
            urgent_count = sum(1 for jid in self.job_queue if self.jobs[jid].priority == JobPriority.URGENT)
            self.job_queue.insert(urgent_count, job_id)
        else:
            self.job_queue.append(job_id)
    
    def _get_next_job(self) -> Optional[str]:
        """Get next job from queue"""
        if not self.job_queue:
            return None
            
        job_id = self.job_queue.pop(0)
        job = self.jobs.get(job_id)
        
        if job and job.status == JobStatus.QUEUED:
            return job_id
        else:
            # Job might have been cancelled, try next
            return self._get_next_job()
    
    async def _start_job(self, job_id: str):
        """Start processing a job"""
        job = self.jobs[job_id]
        job.status = JobStatus.RUNNING
        job.started_at = datetime.now()
        
        self.running_jobs.append(job_id)
        
        logger.info(f"Starting batch job {job_id}: {job.name}")
        
        # Process job in background
        asyncio.create_task(self._process_job(job_id))
    
    async def _process_job(self, job_id: str):
        """Process a specific job"""
        job = self.jobs[job_id]
        
        try:
            # Load input data
            input_data = await self._load_input_data(job.input_file_path)
            
            # Create output file
            output_file_path = f"data/batch_outputs/{job_id}_results.csv"
            job.output_file_path = output_file_path
            
            # Process records
            results = []
            
            for i, record in enumerate(input_data):
                if job.status == JobStatus.CANCELLED:
                    break
                    
                if job.status == JobStatus.PAUSED:
                    # Wait for resume
                    while job.status == JobStatus.PAUSED:
                        await asyncio.sleep(1)
                    if job.status == JobStatus.CANCELLED:
                        break
                
                try:
                    result = await self._process_record(record, job)
                    results.append(result)
                    
                    if result.status == "success":
                        job.successful_records += 1
                    else:
                        job.failed_records += 1
                        
                except Exception as e:
                    logger.error(f"Error processing record {i} in job {job_id}: {str(e)}")
                    result = BatchResult(
                        record_id=f"REC_{i}",
                        identity_id=None,
                        confidence_score=None,
                        match_type=None,
                        status="error",
                        error_message=str(e)
                    )
                    results.append(result)
                    job.failed_records += 1
                
                job.processed_records += 1
                job.progress = (job.processed_records / job.total_records) * 100
                
                # Save progress periodically
                if i % 100 == 0:
                    await self._save_partial_results(job_id, results)
                    results = []  # Clear to save memory
            
            # Save final results
            if results:
                await self._save_partial_results(job_id, results)
            
            # Mark job as completed
            if job.status != JobStatus.CANCELLED:
                job.status = JobStatus.COMPLETED
                job.completed_at = datetime.now()
                job.progress = 100.0
                
                logger.info(f"Completed batch job {job_id}: {job.successful_records} successful, {job.failed_records} failed")
            
        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}")
            job.status = JobStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.now()
        
        finally:
            # Remove from running jobs
            if job_id in self.running_jobs:
                self.running_jobs.remove(job_id)
    
    async def _process_record(self, record: Dict[str, Any], job: BatchJob) -> BatchResult:
        """Process a single record based on job type"""
        
        start_time = time.time()
        
        if job.job_type == JobType.IDENTITY_MATCHING:
            return await self._process_identity_matching(record, job.config)
        elif job.job_type == JobType.DATA_VALIDATION:
            return await self._process_data_validation(record, job.config)
        elif job.job_type == JobType.DATA_QUALITY:
            return await self._process_data_quality(record, job.config)
        elif job.job_type == JobType.DEDUPLICATION:
            return await self._process_deduplication(record, job.config)
        elif job.job_type == JobType.HOUSEHOLD_DETECTION:
            return await self._process_household_detection(record, job.config)
        elif job.job_type == JobType.BULK_EXPORT:
            return await self._process_bulk_export(record, job.config)
        else:
            raise ValueError(f"Unsupported job type: {job.job_type}")
    
    async def _process_identity_matching(self, record: Dict[str, Any], config: Dict[str, Any]) -> BatchResult:
        """Process identity matching for a record"""
        
        try:
            # Extract demographic data
            demo_data = {
                'first_name': record.get('first_name'),
                'last_name': record.get('last_name'),
                'middle_name': record.get('middle_name'),
                'dob': record.get('dob'),
                'ssn': record.get('ssn'),
                'phone': record.get('phone'),
                'email': record.get('email'),
                'address': record.get('address', {})
            }
            
            # Remove None values
            demo_data = {k: v for k, v in demo_data.items() if v is not None}
            
            # Run matching algorithms
            matches = []
            threshold = config.get('match_threshold', 0.85)
            
            # Deterministic matching
            det_matches = await self.deterministic_matcher.match(demo_data)
            matches.extend(det_matches)
            
            # Probabilistic matching if needed
            if not matches or max(m['confidence_score'] for m in matches) < 0.95:
                prob_matches = await self.probabilistic_matcher.match(demo_data)
                matches.extend(prob_matches)
            
            # Fuzzy matching
            fuzzy_matches = await self.fuzzy_matcher.match(demo_data)
            matches.extend(fuzzy_matches)
            
            # AI hybrid matching if enabled
            if config.get('use_ai', True):
                ai_matches = await self.ai_hybrid_matcher.match(demo_data)
                matches.extend(ai_matches)
            
            # Filter and deduplicate
            matches = [m for m in matches if m['confidence_score'] >= threshold]
            matches = self._deduplicate_matches(matches)
            
            if matches:
                best_match = max(matches, key=lambda x: x['confidence_score'])
                return BatchResult(
                    record_id=record.get('record_id', str(uuid.uuid4())),
                    identity_id=best_match['identity_id'],
                    confidence_score=best_match['confidence_score'],
                    match_type=best_match['match_type'],
                    status="success",
                    matched_systems=best_match.get('matched_systems', []),
                    match_details=best_match.get('match_details', {})
                )
            else:
                return BatchResult(
                    record_id=record.get('record_id', str(uuid.uuid4())),
                    identity_id=None,
                    confidence_score=None,
                    match_type=None,
                    status="no_match"
                )
                
        except Exception as e:
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=None,
                match_type=None,
                status="error",
                error_message=str(e)
            )
    
    async def _process_data_validation(self, record: Dict[str, Any], config: Dict[str, Any]) -> BatchResult:
        """Process data validation for a record"""
        try:
            # Get validation level from config
            validation_level_str = config.get('validation_level', 'standard')
            try:
                validation_level = ValidationLevel(validation_level_str)
            except ValueError:
                validation_level = ValidationLevel.STANDARD
            
            # Perform comprehensive data quality assessment
            quality_report = await self.data_quality_service.assess_data_quality(
                record, validation_level
            )
            
            # Determine if validation passed
            min_quality_threshold = config.get('min_quality_threshold', 70.0)
            validation_passed = quality_report.overall_score >= min_quality_threshold
            
            # Compile validation details
            validation_details = {
                "overall_score": quality_report.overall_score,
                "quality_level": quality_report.quality_level.value,
                "critical_issues": quality_report.critical_issues,
                "warnings": quality_report.warnings,
                "recommendations": quality_report.recommendations,
                "field_results": [
                    {
                        "field": result.field_name,
                        "is_valid": result.is_valid,
                        "quality_score": result.quality_score,
                        "issues": result.issues,
                        "suggestions": result.suggestions
                    }
                    for result in quality_report.field_results
                ],
                "processing_time_ms": quality_report.processing_time_ms
            }
            
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=quality_report.overall_score / 100.0,
                match_type="data_validation",
                status="success" if validation_passed else "validation_failed",
                error_message=None if validation_passed else f"Quality score {quality_report.overall_score:.1f} below threshold {min_quality_threshold}",
                processing_time_ms=quality_report.processing_time_ms,
                match_details=validation_details
            )
            
        except Exception as e:
            logger.error(f"Error in data validation: {str(e)}")
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=None,
                match_type="data_validation",
                status="error",
                error_message=str(e)
            )
    
    async def _process_data_quality(self, record: Dict[str, Any], config: Dict[str, Any]) -> BatchResult:
        """Process data quality assessment for a record"""
        try:
            # Perform data quality assessment
            quality_report = await self.data_quality_service.assess_data_quality(record)
            
            # Apply data cleaning if requested
            cleaned_data = record.copy()
            if config.get('apply_cleaning', True):
                cleaned_data = await self.data_quality_service.clean_data(record)
            
            # Calculate improvement metrics
            original_completeness = sum(1 for k, v in record.items() if v is not None and str(v).strip()) / len(record)
            cleaned_completeness = sum(1 for k, v in cleaned_data.items() if v is not None and str(v).strip()) / len(cleaned_data)
            
            quality_details = {
                "original_score": quality_report.overall_score,
                "quality_level": quality_report.quality_level.value,
                "field_scores": {
                    result.field_name: result.quality_score 
                    for result in quality_report.field_results
                },
                "issues_found": len(quality_report.critical_issues) + len(quality_report.warnings),
                "critical_issues": quality_report.critical_issues,
                "warnings": quality_report.warnings,
                "recommendations": quality_report.recommendations,
                "original_completeness": original_completeness * 100,
                "cleaned_completeness": cleaned_completeness * 100,
                "improvement_applied": config.get('apply_cleaning', True),
                "cleaned_fields": [
                    result.field_name for result in quality_report.field_results 
                    if result.cleaned_value is not None
                ]
            }
            
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=quality_report.overall_score / 100.0,
                match_type="data_quality",
                status="success",
                processing_time_ms=quality_report.processing_time_ms,
                match_details=quality_details
            )
            
        except Exception as e:
            logger.error(f"Error in data quality assessment: {str(e)}")
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=None,
                match_type="data_quality",
                status="error",
                error_message=str(e)
            )
    
    async def _process_deduplication(self, record: Dict[str, Any], config: Dict[str, Any]) -> BatchResult:
        """Process deduplication for a record"""
        try:
            # Get similarity threshold from config
            similarity_threshold = config.get('similarity_threshold', 0.85)
            
            # Extract key fields for deduplication
            demo_data = {
                'first_name': record.get('first_name'),
                'last_name': record.get('last_name'),
                'dob': record.get('dob'),
                'ssn': record.get('ssn'),
                'phone': record.get('phone'),
                'email': record.get('email'),
                'address': record.get('address', {})
            }
            
            # Remove None values
            demo_data = {k: v for k, v in demo_data.items() if v is not None}
            
            # Find potential duplicates using identity matching algorithms
            potential_duplicates = []
            
            # Use deterministic matching first (exact matches)
            det_matches = await self.deterministic_matcher.match(demo_data)
            potential_duplicates.extend(det_matches)
            
            # Use probabilistic matching for fuzzy duplicates
            prob_matches = await self.probabilistic_matcher.match(demo_data)
            potential_duplicates.extend(prob_matches)
            
            # Filter by similarity threshold
            duplicates = [
                dup for dup in potential_duplicates 
                if dup.get('confidence_score', 0) >= similarity_threshold
            ]
            
            # Deduplicate the duplicates list itself
            duplicates = self._deduplicate_matches(duplicates)
            
            # Calculate deduplication metrics
            dedup_details = {
                "potential_duplicates_found": len(duplicates),
                "similarity_threshold": similarity_threshold,
                "highest_similarity": max([d.get('confidence_score', 0) for d in duplicates]) if duplicates else 0,
                "duplicate_identities": [
                    {
                        "identity_id": dup.get('identity_id'),
                        "confidence_score": dup.get('confidence_score'),
                        "match_type": dup.get('match_type'),
                        "matched_fields": dup.get('matched_fields', [])
                    }
                    for dup in duplicates
                ],
                "algorithms_used": ["deterministic", "probabilistic"],
                "total_matches_checked": len(potential_duplicates)
            }
            
            # Determine status
            status = "duplicates_found" if duplicates else "unique_record"
            
            # Use highest confidence as overall score
            confidence_score = max([d.get('confidence_score', 0) for d in duplicates]) if duplicates else 0
            
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=duplicates[0].get('identity_id') if duplicates else None,
                confidence_score=confidence_score,
                match_type="deduplication",
                status=status,
                match_details=dedup_details
            )
            
        except Exception as e:
            logger.error(f"Error in deduplication: {str(e)}")
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=None,
                match_type="deduplication",
                status="error",
                error_message=str(e)
            )
    
    def _deduplicate_matches(self, matches: List[Dict]) -> List[Dict]:
        """Remove duplicate matches"""
        seen = set()
        unique_matches = []
        
        for match in matches:
            if match['identity_id'] not in seen:
                seen.add(match['identity_id'])
                unique_matches.append(match)
        
        return unique_matches
    
    async def _process_household_detection(self, record: Dict[str, Any], config: Dict[str, Any]) -> BatchResult:
        """Process household detection for a record"""
        try:
            # For single record household detection, we need to find related identities
            # This would typically require a dataset or database of existing identities
            
            # Extract address and demographic info
            address = record.get('address', {})
            if not address:
                return BatchResult(
                    record_id=record.get('record_id', str(uuid.uuid4())),
                    identity_id=None,
                    confidence_score=0.0,
                    match_type="household_detection",
                    status="insufficient_data",
                    error_message="No address provided for household detection"
                )
            
            # Create a mock household analysis based on available data
            household_details = {
                "address": address,
                "analysis_type": "single_record_assessment",
                "indicators": {
                    "has_full_address": bool(address.get('street') and address.get('city') and address.get('state')),
                    "address_type": self._classify_address_type(address),
                    "household_composition_hints": self._analyze_household_hints(record)
                },
                "recommendations": []
            }
            
            # Analyze name patterns for household hints
            first_name = record.get('first_name', '')
            last_name = record.get('last_name', '')
            
            if first_name and last_name:
                household_details["recommendations"].append("Full name available for household grouping")
            
            # Check for age indicators
            dob = record.get('dob')
            if dob:
                age = self._calculate_age_from_dob(dob)
                if age:
                    household_details["indicators"]["estimated_age"] = age
                    household_details["indicators"]["life_stage"] = self._classify_life_stage(age)
                    
                    if age < 18:
                        household_details["recommendations"].append("Minor detected - likely dependent in household")
                    elif age > 65:
                        household_details["recommendations"].append("Senior detected - may be head of household or dependent")
            
            # Score household detection potential
            confidence_score = 0.0
            if household_details["indicators"]["has_full_address"]:
                confidence_score += 0.4
            if household_details["indicators"].get("estimated_age"):
                confidence_score += 0.3
            if record.get('phone'):
                confidence_score += 0.2
                household_details["indicators"]["has_contact_info"] = True
            if record.get('ssn'):
                confidence_score += 0.1
                
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=record.get('identity_id'),
                confidence_score=confidence_score,
                match_type="household_detection",
                status="analyzed",
                match_details=household_details
            )
            
        except Exception as e:
            logger.error(f"Error in household detection: {str(e)}")
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=None,
                match_type="household_detection",
                status="error",
                error_message=str(e)
            )
    
    async def _process_bulk_export(self, record: Dict[str, Any], config: Dict[str, Any]) -> BatchResult:
        """Process bulk export formatting for a record"""
        try:
            # Get export format and transformation rules from config
            export_format = config.get('export_format', 'csv')
            field_mappings = config.get('field_mappings', {})
            include_metadata = config.get('include_metadata', False)
            anonymize_fields = config.get('anonymize_fields', [])
            
            # Apply field mappings
            exported_record = {}
            for source_field, target_field in field_mappings.items():
                if source_field in record:
                    exported_record[target_field] = record[source_field]
            
            # If no mappings provided, export all fields
            if not field_mappings:
                exported_record = record.copy()
            
            # Apply anonymization
            for field in anonymize_fields:
                if field in exported_record:
                    exported_record[field] = self._anonymize_field(exported_record[field], field)
            
            # Add metadata if requested
            if include_metadata:
                exported_record['_export_timestamp'] = datetime.now().isoformat()
                exported_record['_export_format'] = export_format
                exported_record['_record_hash'] = hashlib.md5(
                    json.dumps(record, sort_keys=True).encode()
                ).hexdigest()[:8]
            
            # Calculate export quality metrics
            original_fields = len([v for v in record.values() if v is not None])
            exported_fields = len([v for v in exported_record.values() if v is not None])
            
            export_details = {
                "export_format": export_format,
                "original_field_count": len(record),
                "exported_field_count": len(exported_record),
                "field_mappings_applied": len(field_mappings),
                "anonymized_fields": len(anonymize_fields),
                "metadata_included": include_metadata,
                "data_completeness": (exported_fields / len(exported_record)) * 100 if exported_record else 0,
                "export_ready": True,
                "exported_data": exported_record
            }
            
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=record.get('identity_id'),
                confidence_score=1.0,  # Export is always successful if no errors
                match_type="bulk_export",
                status="export_ready",
                match_details=export_details
            )
            
        except Exception as e:
            logger.error(f"Error in bulk export: {str(e)}")
            return BatchResult(
                record_id=record.get('record_id', str(uuid.uuid4())),
                identity_id=None,
                confidence_score=None,
                match_type="bulk_export",
                status="error",
                error_message=str(e)
            )
    
    def _classify_address_type(self, address: Dict) -> str:
        """Classify address type based on structure"""
        street = address.get('street', '').lower()
        
        if 'po box' in street or 'p.o. box' in street:
            return "po_box"
        elif 'apt' in street or 'unit' in street or 'suite' in street:
            return "apartment"
        elif any(word in street for word in ['rural', 'route', 'rr']):
            return "rural"
        else:
            return "residential"
    
    def _analyze_household_hints(self, record: Dict) -> List[str]:
        """Analyze record for household composition hints"""
        hints = []
        
        # Check for emergency contact information
        if record.get('emergency_contact'):
            hints.append("emergency_contact_present")
        
        # Check for dependent indicators
        if record.get('guardian') or record.get('parent_name'):
            hints.append("dependent_indicators")
        
        # Check for employment information
        if record.get('employer') or record.get('occupation'):
            hints.append("employment_info_available")
        
        return hints
    
    def _calculate_age_from_dob(self, dob_str: str) -> Optional[int]:
        """Calculate age from date of birth string"""
        try:
            # Try different date formats
            for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%m-%d-%Y']:
                try:
                    dob = datetime.strptime(dob_str, fmt).date()
                    today = date.today()
                    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                    return age if 0 <= age <= 120 else None
                except ValueError:
                    continue
            return None
        except:
            return None
    
    def _classify_life_stage(self, age: int) -> str:
        """Classify life stage based on age"""
        if age < 13:
            return "child"
        elif age < 18:
            return "teenager"
        elif age < 25:
            return "young_adult"
        elif age < 65:
            return "adult"
        else:
            return "senior"
    
    def _anonymize_field(self, value: Any, field_name: str) -> str:
        """Anonymize field value based on field type"""
        if field_name.lower() in ['ssn', 'social_security']:
            # Show only last 4 digits
            ssn_digits = re.sub(r'[^\d]', '', str(value))
            return f"***-**-{ssn_digits[-4:]}" if len(ssn_digits) >= 4 else "***-**-****"
        
        elif field_name.lower() in ['phone', 'phone_number']:
            # Show only area code
            phone_digits = re.sub(r'[^\d]', '', str(value))
            return f"({phone_digits[:3]}) ***-****" if len(phone_digits) >= 3 else "***-***-****"
        
        elif field_name.lower() in ['email', 'email_address']:
            # Show only domain
            if '@' in str(value):
                domain = str(value).split('@')[1]
                return f"***@{domain}"
            return "***@***.***"
        
        elif field_name.lower() in ['address', 'street']:
            # Show only city/state
            return "*** [ANONYMIZED]"
        
        else:
            # Generic anonymization
            return f"*** [{field_name.upper()}_ANONYMIZED]"
    
    async def _count_records_in_file(self, file_path: str) -> int:
        """Count records in input file"""
        if file_path.endswith('.csv'):
            with open(file_path, 'r') as f:
                return sum(1 for line in f) - 1  # Subtract header
        elif file_path.endswith('.json'):
            with open(file_path, 'r') as f:
                data = json.load(f)
                return len(data) if isinstance(data, list) else 1
        else:
            return 0
    
    async def _save_input_data(self, job_id: str, data: List[Dict]) -> str:
        """Save input data to file"""
        file_path = f"data/batch_inputs/{job_id}_input.json"
        Path(file_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
            
        return file_path
    
    async def _load_input_data(self, file_path: str) -> List[Dict]:
        """Load input data from file"""
        if file_path.endswith('.json'):
            with open(file_path, 'r') as f:
                data = json.load(f)
                return data if isinstance(data, list) else [data]
        elif file_path.endswith('.csv'):
            return pd.read_csv(file_path).to_dict('records')
        else:
            raise ValueError("Unsupported file format")
    
    async def _save_partial_results(self, job_id: str, results: List[BatchResult]):
        """Save partial results to output file"""
        if not results:
            return
            
        output_path = f"data/batch_outputs/{job_id}_results.csv"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        # Convert results to dicts
        result_dicts = [asdict(result) for result in results]
        
        # Write to CSV
        file_exists = Path(output_path).exists()
        with open(output_path, 'a', newline='') as f:
            if result_dicts:
                writer = csv.DictWriter(f, fieldnames=result_dicts[0].keys())
                if not file_exists:
                    writer.writeheader()
                writer.writerows(result_dicts)
    
    async def _load_job_results(
        self,
        job_id: str,
        page: int,
        limit: int,
        status_filter: Optional[str]
    ) -> List[Dict]:
        """Load paginated job results"""
        output_path = f"data/batch_outputs/{job_id}_results.csv"
        
        if not Path(output_path).exists():
            return []
        
        df = pd.read_csv(output_path)
        
        if status_filter:
            df = df[df['status'] == status_filter]
        
        # Apply pagination
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        
        return df.iloc[start_idx:end_idx].to_dict('records')
    
    async def _load_all_job_results(self, job_id: str) -> List[Dict]:
        """Load all results for a job"""
        output_path = f"data/batch_outputs/{job_id}_results.csv"
        
        if not Path(output_path).exists():
            return []
        
        df = pd.read_csv(output_path)
        return df.to_dict('records')
    
    def _estimate_completion_time(self, job: BatchJob) -> datetime:
        """Estimate job completion time"""
        # Base estimate: 1000 records per minute
        base_rate = 1000 / 60  # records per second
        
        # Adjust based on job type
        type_multipliers = {
            JobType.IDENTITY_MATCHING: 1.0,
            JobType.DATA_VALIDATION: 0.5,
            JobType.DATA_QUALITY: 0.8,
            JobType.DEDUPLICATION: 1.5,
            JobType.HOUSEHOLD_DETECTION: 2.0
        }
        
        multiplier = type_multipliers.get(job.job_type, 1.0)
        estimated_seconds = (job.total_records / base_rate) * multiplier
        
        return datetime.now() + timedelta(seconds=estimated_seconds)
    
    async def _calculate_processing_rate(self) -> float:
        """Calculate current processing rate"""
        # Calculate based on recent completed jobs
        recent_jobs = [
            job for job in self.jobs.values()
            if job.status == JobStatus.COMPLETED and
            job.completed_at and job.completed_at > datetime.now() - timedelta(hours=1)
        ]
        
        if not recent_jobs:
            return 0.0
        
        total_records = sum(job.total_records for job in recent_jobs)
        return total_records  # Records processed in last hour
    
    def _estimate_queue_wait_time(self) -> str:
        """Estimate wait time for queued jobs"""
        if not self.job_queue:
            return "0 minutes"
        
        queued_records = sum(self.jobs[jid].total_records for jid in self.job_queue)
        rate = 1000 / 60  # records per second
        
        estimated_seconds = queued_records / rate
        
        if estimated_seconds < 60:
            return f"{int(estimated_seconds)} seconds"
        elif estimated_seconds < 3600:
            return f"{int(estimated_seconds / 60)} minutes"
        else:
            return f"{int(estimated_seconds / 3600)} hours"
    
    async def _export_to_csv(self, job_id: str, results: List[Dict]) -> str:
        """Export results to CSV format"""
        output_path = f"data/exports/{job_id}_export.csv"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        if results:
            df = pd.DataFrame(results)
            df.to_csv(output_path, index=False)
        
        return output_path
    
    async def _export_to_json(self, job_id: str, results: List[Dict]) -> str:
        """Export results to JSON format"""
        output_path = f"data/exports/{job_id}_export.json"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        return output_path
    
    async def _export_to_excel(self, job_id: str, results: List[Dict]) -> str:
        """Export results to Excel format"""
        output_path = f"data/exports/{job_id}_export.xlsx"
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        
        if results:
            df = pd.DataFrame(results)
            df.to_excel(output_path, index=False)
        
        return output_path
    
    async def _update_job_progress(self, job_id: str):
        """Update job progress and status"""
        job = self.jobs.get(job_id)
        if not job:
            return
        
        # This would be called periodically to update job status
        # Real implementation would check actual job progress
        pass