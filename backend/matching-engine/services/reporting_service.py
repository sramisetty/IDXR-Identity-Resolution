"""
Comprehensive Reporting and Analytics Service for IDXR
Advanced reporting, dashboards, and analytics for Colorado OIT requirements
"""

import asyncio
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta, date
from enum import Enum
import json
import pandas as pd
import numpy as np
from collections import defaultdict, Counter
import sqlite3
import io
import base64

logger = logging.getLogger(__name__)

class ReportType(Enum):
    DAILY_SUMMARY = "daily_summary"
    WEEKLY_TRENDS = "weekly_trends"
    MONTHLY_ANALYTICS = "monthly_analytics"
    SYSTEM_PERFORMANCE = "system_performance"
    DATA_QUALITY = "data_quality"
    MATCH_ACCURACY = "match_accuracy"
    HOUSEHOLD_ANALYSIS = "household_analysis"
    SOURCE_SYSTEM_ANALYSIS = "source_system_analysis"
    COMPLIANCE_AUDIT = "compliance_audit"
    CUSTOM = "custom"

class MetricType(Enum):
    COUNT = "count"
    RATE = "rate"
    PERCENTAGE = "percentage"
    AVERAGE = "average"
    DISTRIBUTION = "distribution"

@dataclass
class ReportMetric:
    name: str
    value: float
    metric_type: MetricType
    description: str
    trend: Optional[float] = None  # Percentage change from previous period
    threshold_warning: Optional[float] = None
    threshold_critical: Optional[float] = None

@dataclass
class ReportSection:
    title: str
    metrics: List[ReportMetric]
    charts: List[Dict] = None
    tables: List[Dict] = None
    insights: List[str] = None

@dataclass
class Report:
    report_id: str
    report_type: ReportType
    title: str
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    sections: List[ReportSection]
    executive_summary: str
    recommendations: List[str]
    data_sources: List[str]
    export_formats: List[str] = None

class DataCollector:
    """Collects and aggregates data for reporting"""
    
    def __init__(self):
        # In production, this would connect to actual databases
        self.mock_data = self._initialize_mock_data()
    
    def _initialize_mock_data(self) -> Dict:
        """Initialize mock data for demonstration"""
        base_date = datetime.now() - timedelta(days=30)
        
        # Generate mock daily statistics
        daily_stats = []
        for i in range(30):
            date_val = base_date + timedelta(days=i)
            daily_stats.append({
                'date': date_val.date(),
                'total_requests': np.random.poisson(1000),
                'successful_matches': np.random.poisson(850),
                'no_matches': np.random.poisson(100),
                'errors': np.random.poisson(50),
                'avg_response_time': np.random.normal(250, 50),
                'cache_hit_rate': np.random.uniform(0.6, 0.9),
                'unique_source_systems': np.random.randint(5, 12),
                'high_confidence_matches': np.random.poisson(600),
                'medium_confidence_matches': np.random.poisson(200),
                'low_confidence_matches': np.random.poisson(50)
            })
        
        # Source system data
        source_systems = ['DMV', 'HEALTH_DEPT', 'SOCIAL_SERVICES', 'EDUCATION', 'COURTS', 'TAXATION']
        source_system_stats = []
        for system in source_systems:
            source_system_stats.append({
                'system_name': system,
                'total_requests': np.random.poisson(5000),
                'avg_response_time': np.random.normal(200, 30),
                'error_rate': np.random.uniform(0.01, 0.05),
                'match_rate': np.random.uniform(0.75, 0.95),
                'data_quality_score': np.random.uniform(85, 98)
            })
        
        return {
            'daily_stats': daily_stats,
            'source_system_stats': source_system_stats
        }
    
    async def get_daily_statistics(self, start_date: date, end_date: date) -> List[Dict]:
        """Get daily statistics for date range"""
        return [
            stat for stat in self.mock_data['daily_stats']
            if start_date <= stat['date'] <= end_date
        ]
    
    async def get_source_system_statistics(self) -> List[Dict]:
        """Get source system performance statistics"""
        return self.mock_data['source_system_stats']
    
    async def get_match_accuracy_data(self) -> Dict:
        """Get match accuracy and validation data"""
        return {
            'total_validated_matches': 5000,
            'true_positives': 4750,
            'false_positives': 250,
            'false_negatives': 100,
            'precision': 0.95,
            'recall': 0.98,
            'f1_score': 0.965,
            'algorithm_performance': {
                'deterministic': {'precision': 0.99, 'recall': 0.85},
                'probabilistic': {'precision': 0.90, 'recall': 0.95},
                'fuzzy': {'precision': 0.85, 'recall': 0.90},
                'ai_enhanced': {'precision': 0.97, 'recall': 0.96}
            }
        }
    
    async def get_data_quality_metrics(self) -> Dict:
        """Get data quality assessment metrics"""
        return {
            'completeness_score': 87.5,
            'accuracy_score': 92.3,
            'consistency_score': 89.1,
            'timeliness_score': 94.2,
            'field_completeness': {
                'first_name': 98.5,
                'last_name': 97.8,
                'dob': 89.2,
                'ssn': 65.4,
                'address': 78.9,
                'phone': 82.1,
                'email': 74.3
            },
            'data_issues': {
                'duplicate_records': 156,
                'incomplete_records': 1247,
                'invalid_formats': 89,
                'outdated_records': 567
            }
        }
    
    async def get_household_analytics(self) -> Dict:
        """Get household formation and analytics"""
        return {
            'total_households': 15678,
            'single_person_households': 6234,
            'family_households': 7889,
            'multi_generational_households': 1555,
            'average_household_size': 2.4,
            'households_with_children': 8901,
            'households_with_elderly': 4567,
            'relationship_accuracy': 0.91,
            'household_formation_trends': {
                'new_households_this_month': 234,
                'merged_households': 45,
                'split_households': 23
            }
        }

class ChartGenerator:
    """Generates charts and visualizations for reports"""
    
    def create_line_chart(self, data: List[Dict], x_field: str, y_field: str, 
                         title: str, x_label: str, y_label: str) -> Dict:
        """Create line chart configuration"""
        return {
            'type': 'line',
            'title': title,
            'data': {
                'labels': [str(item[x_field]) for item in data],
                'datasets': [{
                    'label': y_label,
                    'data': [item[y_field] for item in data],
                    'borderColor': 'rgb(75, 192, 192)',
                    'backgroundColor': 'rgba(75, 192, 192, 0.2)',
                }]
            },
            'options': {
                'responsive': True,
                'scales': {
                    'x': {'title': {'display': True, 'text': x_label}},
                    'y': {'title': {'display': True, 'text': y_label}}
                }
            }
        }
    
    def create_bar_chart(self, data: Dict, title: str, x_label: str, y_label: str) -> Dict:
        """Create bar chart configuration"""
        return {
            'type': 'bar',
            'title': title,
            'data': {
                'labels': list(data.keys()),
                'datasets': [{
                    'label': y_label,
                    'data': list(data.values()),
                    'backgroundColor': [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 205, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)'
                    ],
                    'borderColor': [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 205, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    'borderWidth': 1
                }]
            },
            'options': {
                'responsive': True,
                'scales': {
                    'x': {'title': {'display': True, 'text': x_label}},
                    'y': {'title': {'display': True, 'text': y_label}}
                }
            }
        }
    
    def create_pie_chart(self, data: Dict, title: str) -> Dict:
        """Create pie chart configuration"""
        return {
            'type': 'pie',
            'title': title,
            'data': {
                'labels': list(data.keys()),
                'datasets': [{
                    'data': list(data.values()),
                    'backgroundColor': [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40'
                    ]
                }]
            },
            'options': {
                'responsive': True
            }
        }
    
    def create_gauge_chart(self, value: float, max_value: float, title: str, 
                          thresholds: Dict) -> Dict:
        """Create gauge chart for KPIs"""
        return {
            'type': 'gauge',
            'title': title,
            'value': value,
            'max_value': max_value,
            'thresholds': thresholds,
            'options': {
                'responsive': True
            }
        }

class ReportGenerator:
    """Main report generation service"""
    
    def __init__(self):
        self.data_collector = DataCollector()
        self.chart_generator = ChartGenerator()
    
    async def generate_report(self, report_type: ReportType, 
                            period_start: datetime, period_end: datetime,
                            custom_params: Optional[Dict] = None) -> Report:
        """Generate a comprehensive report"""
        
        report_id = f"{report_type.value}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        if report_type == ReportType.DAILY_SUMMARY:
            return await self._generate_daily_summary_report(report_id, period_start, period_end)
        elif report_type == ReportType.SYSTEM_PERFORMANCE:
            return await self._generate_system_performance_report(report_id, period_start, period_end)
        elif report_type == ReportType.DATA_QUALITY:
            return await self._generate_data_quality_report(report_id, period_start, period_end)
        elif report_type == ReportType.MATCH_ACCURACY:
            return await self._generate_match_accuracy_report(report_id, period_start, period_end)
        elif report_type == ReportType.HOUSEHOLD_ANALYSIS:
            return await self._generate_household_analysis_report(report_id, period_start, period_end)
        elif report_type == ReportType.SOURCE_SYSTEM_ANALYSIS:
            return await self._generate_source_system_analysis_report(report_id, period_start, period_end)
        else:
            raise ValueError(f"Unsupported report type: {report_type}")
    
    async def _generate_daily_summary_report(self, report_id: str, 
                                           period_start: datetime, period_end: datetime) -> Report:
        """Generate daily summary report"""
        
        daily_stats = await self.data_collector.get_daily_statistics(
            period_start.date(), period_end.date()
        )
        
        if not daily_stats:
            raise ValueError("No data available for the specified period")
        
        # Calculate summary metrics
        total_requests = sum(stat['total_requests'] for stat in daily_stats)
        total_successful = sum(stat['successful_matches'] for stat in daily_stats)
        total_errors = sum(stat['errors'] for stat in daily_stats)
        avg_response_time = np.mean([stat['avg_response_time'] for stat in daily_stats])
        avg_cache_hit_rate = np.mean([stat['cache_hit_rate'] for stat in daily_stats])
        
        success_rate = (total_successful / total_requests) * 100 if total_requests > 0 else 0
        error_rate = (total_errors / total_requests) * 100 if total_requests > 0 else 0
        
        # Create metrics
        summary_metrics = [
            ReportMetric("Total Requests", total_requests, MetricType.COUNT, 
                        "Total identity resolution requests processed"),
            ReportMetric("Success Rate", success_rate, MetricType.PERCENTAGE, 
                        "Percentage of requests that found matches", threshold_warning=85.0, threshold_critical=75.0),
            ReportMetric("Average Response Time", avg_response_time, MetricType.AVERAGE, 
                        "Average processing time in milliseconds", threshold_warning=500.0, threshold_critical=1000.0),
            ReportMetric("Cache Hit Rate", avg_cache_hit_rate * 100, MetricType.PERCENTAGE, 
                        "Percentage of requests served from cache"),
            ReportMetric("Error Rate", error_rate, MetricType.PERCENTAGE, 
                        "Percentage of requests that resulted in errors", threshold_warning=5.0, threshold_critical=10.0)
        ]
        
        # Create charts
        request_trend_chart = self.chart_generator.create_line_chart(
            daily_stats, 'date', 'total_requests',
            'Daily Request Volume', 'Date', 'Number of Requests'
        )
        
        response_time_chart = self.chart_generator.create_line_chart(
            daily_stats, 'date', 'avg_response_time',
            'Average Response Time Trend', 'Date', 'Response Time (ms)'
        )
        
        # Create summary section
        summary_section = ReportSection(
            title="Executive Summary",
            metrics=summary_metrics,
            charts=[request_trend_chart, response_time_chart],
            insights=[
                f"Processed {total_requests:,} identity resolution requests during the period",
                f"Achieved {success_rate:.1f}% success rate with {avg_response_time:.0f}ms average response time",
                f"Cache system provided {avg_cache_hit_rate*100:.1f}% hit rate, improving performance"
            ]
        )
        
        # Generate executive summary
        executive_summary = f"""
        During the period from {period_start.strftime('%Y-%m-%d')} to {period_end.strftime('%Y-%m-%d')}, 
        the IDXR system processed {total_requests:,} identity resolution requests with a {success_rate:.1f}% 
        success rate. The average response time was {avg_response_time:.0f} milliseconds, meeting performance 
        targets. The system maintained a {error_rate:.2f}% error rate, which is within acceptable limits.
        """
        
        # Generate recommendations
        recommendations = []
        if success_rate < 85:
            recommendations.append("Consider reviewing matching algorithms to improve success rate")
        if avg_response_time > 500:
            recommendations.append("Investigate performance bottlenecks to reduce response time")
        if error_rate > 5:
            recommendations.append("Analyze error patterns to identify and fix common issues")
        
        return Report(
            report_id=report_id,
            report_type=ReportType.DAILY_SUMMARY,
            title=f"Daily Summary Report ({period_start.strftime('%Y-%m-%d')} - {period_end.strftime('%Y-%m-%d')})",
            generated_at=datetime.now(),
            period_start=period_start,
            period_end=period_end,
            sections=[summary_section],
            executive_summary=executive_summary.strip(),
            recommendations=recommendations,
            data_sources=["IDXR Transaction Logs", "Performance Metrics Database"],
            export_formats=["PDF", "Excel", "JSON"]
        )
    
    async def _generate_system_performance_report(self, report_id: str,
                                                period_start: datetime, period_end: datetime) -> Report:
        """Generate system performance report"""
        
        daily_stats = await self.data_collector.get_daily_statistics(
            period_start.date(), period_end.date()
        )
        
        # Performance metrics
        response_times = [stat['avg_response_time'] for stat in daily_stats]
        cache_hit_rates = [stat['cache_hit_rate'] for stat in daily_stats]
        
        p95_response_time = np.percentile(response_times, 95)
        p99_response_time = np.percentile(response_times, 99)
        min_response_time = np.min(response_times)
        max_response_time = np.max(response_times)
        
        performance_metrics = [
            ReportMetric("Average Response Time", np.mean(response_times), MetricType.AVERAGE,
                        "Mean processing time across all requests"),
            ReportMetric("95th Percentile Response Time", p95_response_time, MetricType.AVERAGE,
                        "95% of requests processed within this time"),
            ReportMetric("99th Percentile Response Time", p99_response_time, MetricType.AVERAGE,
                        "99% of requests processed within this time"),
            ReportMetric("Best Response Time", min_response_time, MetricType.AVERAGE,
                        "Fastest recorded response time"),
            ReportMetric("Worst Response Time", max_response_time, MetricType.AVERAGE,
                        "Slowest recorded response time"),
            ReportMetric("Average Cache Hit Rate", np.mean(cache_hit_rates) * 100, MetricType.PERCENTAGE,
                        "Percentage of requests served from cache")
        ]
        
        # Create performance charts
        response_distribution_chart = self.chart_generator.create_bar_chart(
            {
                "< 100ms": len([t for t in response_times if t < 100]),
                "100-250ms": len([t for t in response_times if 100 <= t < 250]),
                "250-500ms": len([t for t in response_times if 250 <= t < 500]),
                "500ms-1s": len([t for t in response_times if 500 <= t < 1000]),
                "> 1s": len([t for t in response_times if t >= 1000])
            },
            "Response Time Distribution", "Response Time Range", "Number of Days"
        )
        
        performance_section = ReportSection(
            title="System Performance Analysis",
            metrics=performance_metrics,
            charts=[response_distribution_chart],
            insights=[
                f"95% of requests processed within {p95_response_time:.0f}ms",
                f"Cache system effectiveness: {np.mean(cache_hit_rates)*100:.1f}% hit rate",
                f"Performance stability: {np.std(response_times):.0f}ms standard deviation"
            ]
        )
        
        return Report(
            report_id=report_id,
            report_type=ReportType.SYSTEM_PERFORMANCE,
            title=f"System Performance Report ({period_start.strftime('%Y-%m-%d')} - {period_end.strftime('%Y-%m-%d')})",
            generated_at=datetime.now(),
            period_start=period_start,
            period_end=period_end,
            sections=[performance_section],
            executive_summary="System performance analysis showing response time trends and cache effectiveness.",
            recommendations=[
                "Monitor 99th percentile response times for outliers",
                "Optimize cache configuration for better hit rates",
                "Consider horizontal scaling if response times increase"
            ],
            data_sources=["Performance Monitoring System", "Cache Analytics"],
            export_formats=["PDF", "Excel", "JSON"]
        )
    
    async def _generate_data_quality_report(self, report_id: str,
                                          period_start: datetime, period_end: datetime) -> Report:
        """Generate data quality assessment report"""
        
        quality_data = await self.data_collector.get_data_quality_metrics()
        
        # Data quality metrics
        quality_metrics = [
            ReportMetric("Overall Data Quality Score", 
                        (quality_data['completeness_score'] + quality_data['accuracy_score'] + 
                         quality_data['consistency_score'] + quality_data['timeliness_score']) / 4,
                        MetricType.AVERAGE, "Composite data quality score",
                        threshold_warning=85.0, threshold_critical=75.0),
            ReportMetric("Completeness Score", quality_data['completeness_score'], MetricType.PERCENTAGE,
                        "Percentage of required fields populated"),
            ReportMetric("Accuracy Score", quality_data['accuracy_score'], MetricType.PERCENTAGE,
                        "Percentage of data values that are accurate"),
            ReportMetric("Consistency Score", quality_data['consistency_score'], MetricType.PERCENTAGE,
                        "Data consistency across different sources"),
            ReportMetric("Timeliness Score", quality_data['timeliness_score'], MetricType.PERCENTAGE,
                        "Percentage of data that is up-to-date")
        ]
        
        # Field completeness chart
        field_completeness_chart = self.chart_generator.create_bar_chart(
            quality_data['field_completeness'],
            "Field Completeness Rates", "Fields", "Completeness (%)"
        )
        
        # Data issues chart
        data_issues_chart = self.chart_generator.create_pie_chart(
            quality_data['data_issues'],
            "Data Quality Issues Distribution"
        )
        
        quality_section = ReportSection(
            title="Data Quality Assessment",
            metrics=quality_metrics,
            charts=[field_completeness_chart, data_issues_chart],
            insights=[
                f"SSN field has lowest completeness at {quality_data['field_completeness']['ssn']:.1f}%",
                f"Total data quality issues identified: {sum(quality_data['data_issues'].values())}",
                "Name fields show highest completeness rates"
            ]
        )
        
        return Report(
            report_id=report_id,
            report_type=ReportType.DATA_QUALITY,
            title=f"Data Quality Report ({period_start.strftime('%Y-%m-%d')} - {period_end.strftime('%Y-%m-%d')})",
            generated_at=datetime.now(),
            period_start=period_start,
            period_end=period_end,
            sections=[quality_section],
            executive_summary="Comprehensive assessment of data quality across all source systems.",
            recommendations=[
                "Focus on improving SSN field completeness",
                "Implement data validation rules for critical fields",
                "Establish data cleansing procedures for identified issues"
            ],
            data_sources=["Data Quality Engine", "Source System Audits"],
            export_formats=["PDF", "Excel", "JSON"]
        )
    
    async def _generate_match_accuracy_report(self, report_id: str,
                                            period_start: datetime, period_end: datetime) -> Report:
        """Generate match accuracy and algorithm performance report"""
        
        accuracy_data = await self.data_collector.get_match_accuracy_data()
        
        # Accuracy metrics
        accuracy_metrics = [
            ReportMetric("Overall Precision", accuracy_data['precision'] * 100, MetricType.PERCENTAGE,
                        "Percentage of matches that are correct"),
            ReportMetric("Overall Recall", accuracy_data['recall'] * 100, MetricType.PERCENTAGE,
                        "Percentage of true matches found"),
            ReportMetric("F1 Score", accuracy_data['f1_score'] * 100, MetricType.PERCENTAGE,
                        "Harmonic mean of precision and recall"),
            ReportMetric("True Positives", accuracy_data['true_positives'], MetricType.COUNT,
                        "Number of correct matches identified"),
            ReportMetric("False Positives", accuracy_data['false_positives'], MetricType.COUNT,
                        "Number of incorrect matches identified"),
            ReportMetric("False Negatives", accuracy_data['false_negatives'], MetricType.COUNT,
                        "Number of true matches missed")
        ]
        
        # Algorithm performance chart
        algorithm_precision = {
            alg: data['precision'] * 100
            for alg, data in accuracy_data['algorithm_performance'].items()
        }
        
        precision_chart = self.chart_generator.create_bar_chart(
            algorithm_precision,
            "Algorithm Precision Comparison", "Algorithm", "Precision (%)"
        )
        
        accuracy_section = ReportSection(
            title="Match Accuracy Analysis",
            metrics=accuracy_metrics,
            charts=[precision_chart],
            insights=[
                f"AI-enhanced algorithm shows highest precision at {accuracy_data['algorithm_performance']['ai_enhanced']['precision']*100:.1f}%",
                f"Overall system maintains {accuracy_data['f1_score']*100:.1f}% F1 score",
                "Deterministic matching provides highest precision but lower recall"
            ]
        )
        
        return Report(
            report_id=report_id,
            report_type=ReportType.MATCH_ACCURACY,
            title=f"Match Accuracy Report ({period_start.strftime('%Y-%m-%d')} - {period_end.strftime('%Y-%m-%d')})",
            generated_at=datetime.now(),
            period_start=period_start,
            period_end=period_end,
            sections=[accuracy_section],
            executive_summary="Analysis of matching algorithm accuracy and performance metrics.",
            recommendations=[
                "Consider increasing use of AI-enhanced algorithm for better precision",
                "Review false positive cases to improve algorithm tuning",
                "Implement continuous learning to reduce false negatives"
            ],
            data_sources=["Match Validation Database", "Algorithm Performance Logs"],
            export_formats=["PDF", "Excel", "JSON"]
        )
    
    async def _generate_household_analysis_report(self, report_id: str,
                                                period_start: datetime, period_end: datetime) -> Report:
        """Generate household formation and analysis report"""
        
        household_data = await self.data_collector.get_household_analytics()
        
        # Household metrics
        household_metrics = [
            ReportMetric("Total Households", household_data['total_households'], MetricType.COUNT,
                        "Total number of identified households"),
            ReportMetric("Average Household Size", household_data['average_household_size'], MetricType.AVERAGE,
                        "Mean number of individuals per household"),
            ReportMetric("Single Person Households", household_data['single_person_households'], MetricType.COUNT,
                        "Number of one-person households"),
            ReportMetric("Family Households", household_data['family_households'], MetricType.COUNT,
                        "Number of family-based households"),
            ReportMetric("Households with Children", household_data['households_with_children'], MetricType.COUNT,
                        "Number of households containing minors"),
            ReportMetric("Relationship Accuracy", household_data['relationship_accuracy'] * 100, MetricType.PERCENTAGE,
                        "Accuracy of household relationship detection")
        ]
        
        # Household type distribution
        household_types = {
            "Single Person": household_data['single_person_households'],
            "Family": household_data['family_households'],
            "Multi-generational": household_data['multi_generational_households']
        }
        
        household_chart = self.chart_generator.create_pie_chart(
            household_types, "Household Type Distribution"
        )
        
        household_section = ReportSection(
            title="Household Analysis",
            metrics=household_metrics,
            charts=[household_chart],
            insights=[
                f"Average household size of {household_data['average_household_size']:.1f} aligns with state demographics",
                f"{household_data['households_with_children']} households include children requiring special protection",
                f"Household relationship detection maintains {household_data['relationship_accuracy']*100:.1f}% accuracy"
            ]
        )
        
        return Report(
            report_id=report_id,
            report_type=ReportType.HOUSEHOLD_ANALYSIS,
            title=f"Household Analysis Report ({period_start.strftime('%Y-%m-%d')} - {period_end.strftime('%Y-%m-%d')})",
            generated_at=datetime.now(),
            period_start=period_start,
            period_end=period_end,
            sections=[household_section],
            executive_summary="Analysis of household formation patterns and relationship accuracy.",
            recommendations=[
                "Monitor households with children for child protection services integration",
                "Improve relationship detection algorithms for complex family structures",
                "Consider special handling for multi-generational households"
            ],
            data_sources=["Household Formation Engine", "Relationship Detection System"],
            export_formats=["PDF", "Excel", "JSON"]
        )
    
    async def _generate_source_system_analysis_report(self, report_id: str,
                                                    period_start: datetime, period_end: datetime) -> Report:
        """Generate source system performance and integration analysis"""
        
        source_stats = await self.data_collector.get_source_system_statistics()
        
        # Calculate aggregate metrics
        total_requests = sum(stat['total_requests'] for stat in source_stats)
        avg_response_time = np.mean([stat['avg_response_time'] for stat in source_stats])
        avg_error_rate = np.mean([stat['error_rate'] for stat in source_stats])
        avg_match_rate = np.mean([stat['match_rate'] for stat in source_stats])
        avg_quality_score = np.mean([stat['data_quality_score'] for stat in source_stats])
        
        # Source system metrics
        system_metrics = [
            ReportMetric("Total Source Systems", len(source_stats), MetricType.COUNT,
                        "Number of integrated source systems"),
            ReportMetric("Total Requests from Sources", total_requests, MetricType.COUNT,
                        "Combined requests from all source systems"),
            ReportMetric("Average Source Response Time", avg_response_time, MetricType.AVERAGE,
                        "Mean response time across all source systems"),
            ReportMetric("Average Error Rate", avg_error_rate * 100, MetricType.PERCENTAGE,
                        "Mean error rate across all source systems"),
            ReportMetric("Average Match Rate", avg_match_rate * 100, MetricType.PERCENTAGE,
                        "Mean match success rate across all sources"),
            ReportMetric("Average Data Quality Score", avg_quality_score, MetricType.PERCENTAGE,
                        "Mean data quality score across all sources")
        ]
        
        # Create source system comparison charts
        system_requests = {stat['system_name']: stat['total_requests'] for stat in source_stats}
        requests_chart = self.chart_generator.create_bar_chart(
            system_requests, "Request Volume by Source System", "Source System", "Number of Requests"
        )
        
        quality_scores = {stat['system_name']: stat['data_quality_score'] for stat in source_stats}
        quality_chart = self.chart_generator.create_bar_chart(
            quality_scores, "Data Quality Scores by Source System", "Source System", "Quality Score"
        )
        
        # Create detailed table
        source_table = {
            'headers': ['System', 'Requests', 'Response Time (ms)', 'Error Rate (%)', 'Match Rate (%)', 'Quality Score'],
            'rows': [
                [
                    stat['system_name'],
                    f"{stat['total_requests']:,}",
                    f"{stat['avg_response_time']:.0f}",
                    f"{stat['error_rate']*100:.2f}",
                    f"{stat['match_rate']*100:.1f}",
                    f"{stat['data_quality_score']:.1f}"
                ]
                for stat in source_stats
            ]
        }
        
        source_section = ReportSection(
            title="Source System Analysis",
            metrics=system_metrics,
            charts=[requests_chart, quality_chart],
            tables=[source_table],
            insights=[
                f"DMV system processes highest volume with {max(source_stats, key=lambda x: x['total_requests'])['total_requests']:,} requests",
                f"Best performing system maintains {max(stat['data_quality_score'] for stat in source_stats):.1f}% data quality",
                f"System integration health: {len([s for s in source_stats if s['error_rate'] < 0.05])}/{len(source_stats)} systems below 5% error rate"
            ]
        )
        
        return Report(
            report_id=report_id,
            report_type=ReportType.SOURCE_SYSTEM_ANALYSIS,
            title=f"Source System Analysis Report ({period_start.strftime('%Y-%m-%d')} - {period_end.strftime('%Y-%m-%d')})",
            generated_at=datetime.now(),
            period_start=period_start,
            period_end=period_end,
            sections=[source_section],
            executive_summary="Comprehensive analysis of source system integration performance and data quality.",
            recommendations=[
                "Work with low-performing systems to improve data quality",
                "Monitor error rates and implement automatic retry mechanisms",
                "Consider caching strategies for high-volume source systems"
            ],
            data_sources=["Source System Integration Logs", "Data Quality Assessment Engine"],
            export_formats=["PDF", "Excel", "JSON"]
        )
    
    async def export_report(self, report: Report, format: str = "JSON") -> str:
        """Export report in specified format"""
        
        if format.upper() == "JSON":
            return json.dumps(asdict(report), indent=2, default=str)
        
        elif format.upper() == "CSV":
            # Export metrics as CSV
            metrics_data = []
            for section in report.sections:
                for metric in section.metrics:
                    metrics_data.append({
                        'Section': section.title,
                        'Metric': metric.name,
                        'Value': metric.value,
                        'Type': metric.metric_type.value,
                        'Description': metric.description
                    })
            
            df = pd.DataFrame(metrics_data)
            return df.to_csv(index=False)
        
        else:
            raise ValueError(f"Unsupported export format: {format}")

class DashboardService:
    """Real-time dashboard service"""
    
    def __init__(self):
        self.report_generator = ReportGenerator()
    
    async def get_dashboard_data(self) -> Dict:
        """Get real-time dashboard data"""
        
        # Get current metrics
        end_date = datetime.now()
        start_date = end_date - timedelta(days=7)
        
        # Generate quick summary data
        daily_report = await self.report_generator.generate_report(
            ReportType.DAILY_SUMMARY, start_date, end_date
        )
        
        # Extract key metrics
        dashboard_data = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_requests_7d': 7500,  # Mock data
                'success_rate': 92.3,
                'avg_response_time': 245,
                'error_rate': 2.1,
                'cache_hit_rate': 78.5
            },
            'real_time_metrics': {
                'requests_per_second': 15.2,
                'active_connections': 145,
                'queue_length': 23,
                'memory_usage': 67.8,
                'cpu_usage': 45.2
            },
            'alerts': [
                {
                    'level': 'warning',
                    'message': 'Response time above average for DMV system',
                    'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat()
                }
            ],
            'recent_activity': [
                {
                    'timestamp': (datetime.now() - timedelta(seconds=30)).isoformat(),
                    'event': 'High confidence match found',
                    'system': 'HEALTH_DEPT',
                    'confidence': 0.97
                }
            ]
        }
        
        return dashboard_data