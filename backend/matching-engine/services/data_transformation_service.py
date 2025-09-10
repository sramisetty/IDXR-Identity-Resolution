"""
Data Transformation Service for IDXR Identity Cross-Resolution System

This service provides comprehensive data mapping and transformation tools
for processing various data formats into standardized identity structures.
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, List, Any, Optional, Union, Callable
from dataclasses import dataclass
import pandas as pd
import re
import json
from datetime import datetime, date
import logging

logger = logging.getLogger(__name__)

class TransformationType(Enum):
    """Types of data transformations"""
    FIELD_MAPPING = "field_mapping"
    VALUE_TRANSFORMATION = "value_transformation"
    DATA_TYPE_CONVERSION = "data_type_conversion"
    FORMAT_STANDARDIZATION = "format_standardization"
    VALIDATION_RULE = "validation_rule"
    CONDITIONAL_LOGIC = "conditional_logic"
    AGGREGATION = "aggregation"
    NORMALIZATION = "normalization"

class FieldType(Enum):
    """Standard field types for identity data"""
    FIRST_NAME = "first_name"
    LAST_NAME = "last_name"
    FULL_NAME = "full_name"
    DATE_OF_BIRTH = "date_of_birth"
    SSN = "ssn"
    PHONE = "phone"
    EMAIL = "email"
    ADDRESS_STREET = "address_street"
    ADDRESS_CITY = "address_city"
    ADDRESS_STATE = "address_state"
    ADDRESS_ZIP = "address_zip"
    CUSTOM = "custom"

@dataclass
class FieldMapping:
    """Mapping configuration for a field"""
    source_field: str
    target_field: FieldType
    transformation_rules: List[Dict[str, Any]]
    validation_rules: List[Dict[str, Any]]
    is_required: bool = False
    default_value: Optional[Any] = None

@dataclass
class TransformationRule:
    """Individual transformation rule"""
    rule_type: TransformationType
    source_field: Optional[str] = None
    target_field: Optional[str] = None
    parameters: Dict[str, Any] = None
    condition: Optional[str] = None
    priority: int = 0

@dataclass
class DataMappingConfig:
    """Complete data mapping configuration"""
    mapping_name: str
    description: str
    field_mappings: List[FieldMapping]
    global_transformations: List[TransformationRule]
    validation_rules: List[Dict[str, Any]]
    metadata: Dict[str, Any] = None

class DataTransformer(ABC):
    """Abstract base class for data transformers"""
    
    @abstractmethod
    def transform(self, value: Any, parameters: Dict[str, Any] = None) -> Any:
        """Transform a single value"""
        pass
    
    @abstractmethod
    def validate(self, value: Any, parameters: Dict[str, Any] = None) -> bool:
        """Validate a transformed value"""
        pass

class NameTransformer(DataTransformer):
    """Transformer for name fields"""
    
    def transform(self, value: Any, parameters: Dict[str, Any] = None) -> str:
        """Transform name values"""
        if not value:
            return ""
        
        name_str = str(value).strip()
        
        # Apply transformations based on parameters
        if parameters:
            if parameters.get("uppercase"):
                name_str = name_str.upper()
            elif parameters.get("lowercase"):
                name_str = name_str.lower()
            elif parameters.get("title_case"):
                name_str = name_str.title()
            
            if parameters.get("remove_special_chars"):
                name_str = re.sub(r'[^a-zA-Z\s-]', '', name_str)
            
            if parameters.get("normalize_spaces"):
                name_str = re.sub(r'\s+', ' ', name_str)
        
        return name_str.strip()
    
    def validate(self, value: Any, parameters: Dict[str, Any] = None) -> bool:
        """Validate name values"""
        if not value:
            return parameters.get("allow_empty", False) if parameters else False
        
        name_str = str(value).strip()
        
        if parameters:
            min_length = parameters.get("min_length", 1)
            max_length = parameters.get("max_length", 100)
            
            if len(name_str) < min_length or len(name_str) > max_length:
                return False
            
            if parameters.get("alphabetic_only") and not re.match(r'^[a-zA-Z\s-]+$', name_str):
                return False
        
        return True

class DateTransformer(DataTransformer):
    """Transformer for date fields"""
    
    def transform(self, value: Any, parameters: Dict[str, Any] = None) -> str:
        """Transform date values to standard format"""
        if not value:
            return ""
        
        # Common date formats to try
        date_formats = [
            "%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%Y/%m/%d",
            "%m-%d-%Y", "%d-%m-%Y", "%m.%d.%Y", "%d.%m.%Y",
            "%Y%m%d", "%m%d%Y", "%d%m%Y"
        ]
        
        date_str = str(value).strip()
        target_format = parameters.get("target_format", "%Y-%m-%d") if parameters else "%Y-%m-%d"
        
        # Try to parse the date
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(date_str, fmt)
                return parsed_date.strftime(target_format)
            except ValueError:
                continue
        
        # If no format matches, return original value
        return date_str
    
    def validate(self, value: Any, parameters: Dict[str, Any] = None) -> bool:
        """Validate date values"""
        if not value:
            return parameters.get("allow_empty", False) if parameters else False
        
        transformed_value = self.transform(value, parameters)
        
        try:
            # Try to parse as a valid date
            datetime.strptime(transformed_value, parameters.get("target_format", "%Y-%m-%d") if parameters else "%Y-%m-%d")
            return True
        except ValueError:
            return False

class PhoneTransformer(DataTransformer):
    """Transformer for phone number fields"""
    
    def transform(self, value: Any, parameters: Dict[str, Any] = None) -> str:
        """Transform phone numbers to standard format"""
        if not value:
            return ""
        
        phone_str = str(value).strip()
        
        # Remove all non-numeric characters
        digits_only = re.sub(r'\D', '', phone_str)
        
        # Apply formatting based on parameters
        if parameters:
            target_format = parameters.get("format", "xxx-xxx-xxxx")
            
            if len(digits_only) == 10:
                if target_format == "xxx-xxx-xxxx":
                    return f"{digits_only[:3]}-{digits_only[3:6]}-{digits_only[6:]}"
                elif target_format == "(xxx) xxx-xxxx":
                    return f"({digits_only[:3]}) {digits_only[3:6]}-{digits_only[6:]}"
                elif target_format == "xxxxxxxxxx":
                    return digits_only
            elif len(digits_only) == 11 and digits_only.startswith('1'):
                # Handle US numbers with country code
                us_number = digits_only[1:]
                if target_format == "xxx-xxx-xxxx":
                    return f"{us_number[:3]}-{us_number[3:6]}-{us_number[6:]}"
                elif target_format == "(xxx) xxx-xxxx":
                    return f"({us_number[:3]}) {us_number[3:6]}-{us_number[6:]}"
        
        return phone_str
    
    def validate(self, value: Any, parameters: Dict[str, Any] = None) -> bool:
        """Validate phone numbers"""
        if not value:
            return parameters.get("allow_empty", False) if parameters else False
        
        phone_str = str(value).strip()
        digits_only = re.sub(r'\D', '', phone_str)
        
        # Check for valid US phone number lengths
        if len(digits_only) == 10:
            return True
        elif len(digits_only) == 11 and digits_only.startswith('1'):
            return True
        
        return False

class EmailTransformer(DataTransformer):
    """Transformer for email fields"""
    
    def transform(self, value: Any, parameters: Dict[str, Any] = None) -> str:
        """Transform email addresses"""
        if not value:
            return ""
        
        email_str = str(value).strip().lower()
        
        if parameters:
            if parameters.get("normalize_domain"):
                # Normalize common domain variations
                domain_mappings = {
                    "gmail.co": "gmail.com",
                    "yahoo.co": "yahoo.com",
                    "hotmail.co": "hotmail.com"
                }
                
                for old_domain, new_domain in domain_mappings.items():
                    if old_domain in email_str:
                        email_str = email_str.replace(old_domain, new_domain)
        
        return email_str
    
    def validate(self, value: Any, parameters: Dict[str, Any] = None) -> bool:
        """Validate email addresses"""
        if not value:
            return parameters.get("allow_empty", False) if parameters else False
        
        email_str = str(value).strip()
        
        # Basic email validation regex
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        return re.match(email_pattern, email_str) is not None

class SSNTransformer(DataTransformer):
    """Transformer for SSN fields"""
    
    def transform(self, value: Any, parameters: Dict[str, Any] = None) -> str:
        """Transform SSN to standard format"""
        if not value:
            return ""
        
        ssn_str = str(value).strip()
        digits_only = re.sub(r'\D', '', ssn_str)
        
        if parameters:
            target_format = parameters.get("format", "xxx-xx-xxxx")
            
            if len(digits_only) == 9:
                if target_format == "xxx-xx-xxxx":
                    return f"{digits_only[:3]}-{digits_only[3:5]}-{digits_only[5:]}"
                elif target_format == "xxxxxxxxx":
                    return digits_only
                elif target_format == "masked":
                    return f"XXX-XX-{digits_only[5:]}"
        
        return ssn_str
    
    def validate(self, value: Any, parameters: Dict[str, Any] = None) -> bool:
        """Validate SSN"""
        if not value:
            return parameters.get("allow_empty", False) if parameters else False
        
        ssn_str = str(value).strip()
        digits_only = re.sub(r'\D', '', ssn_str)
        
        return len(digits_only) == 9

class AddressTransformer(DataTransformer):
    """Transformer for address fields"""
    
    def transform(self, value: Any, parameters: Dict[str, Any] = None) -> str:
        """Transform address components"""
        if not value:
            return ""
        
        address_str = str(value).strip()
        
        if parameters:
            if parameters.get("normalize_case"):
                address_str = address_str.title()
            
            if parameters.get("standardize_abbreviations"):
                # Common address abbreviations
                abbreviations = {
                    r'\bStreet\b': 'St',
                    r'\bAvenue\b': 'Ave',
                    r'\bBoulevard\b': 'Blvd',
                    r'\bRoad\b': 'Rd',
                    r'\bDrive\b': 'Dr',
                    r'\bLane\b': 'Ln',
                    r'\bCourt\b': 'Ct',
                    r'\bPlace\b': 'Pl',
                    r'\bApartment\b': 'Apt',
                    r'\bSuite\b': 'Ste'
                }
                
                for full_form, abbrev in abbreviations.items():
                    address_str = re.sub(full_form, abbrev, address_str, flags=re.IGNORECASE)
        
        return address_str
    
    def validate(self, value: Any, parameters: Dict[str, Any] = None) -> bool:
        """Validate address components"""
        if not value:
            return parameters.get("allow_empty", False) if parameters else False
        
        address_str = str(value).strip()
        
        if parameters:
            min_length = parameters.get("min_length", 1)
            max_length = parameters.get("max_length", 200)
            
            if len(address_str) < min_length or len(address_str) > max_length:
                return False
        
        return True

class DataTransformationService:
    """Service for managing data transformations and mappings"""
    
    def __init__(self):
        self.transformers = {
            FieldType.FIRST_NAME: NameTransformer(),
            FieldType.LAST_NAME: NameTransformer(),
            FieldType.FULL_NAME: NameTransformer(),
            FieldType.DATE_OF_BIRTH: DateTransformer(),
            FieldType.PHONE: PhoneTransformer(),
            FieldType.EMAIL: EmailTransformer(),
            FieldType.SSN: SSNTransformer(),
            FieldType.ADDRESS_STREET: AddressTransformer(),
            FieldType.ADDRESS_CITY: AddressTransformer(),
            FieldType.ADDRESS_STATE: AddressTransformer(),
            FieldType.ADDRESS_ZIP: AddressTransformer()
        }
    
    async def create_mapping_config(self, mapping_data: Dict[str, Any]) -> DataMappingConfig:
        """Create a data mapping configuration"""
        try:
            field_mappings = []
            for field_data in mapping_data.get("field_mappings", []):
                field_mapping = FieldMapping(
                    source_field=field_data["source_field"],
                    target_field=FieldType(field_data["target_field"]),
                    transformation_rules=field_data.get("transformation_rules", []),
                    validation_rules=field_data.get("validation_rules", []),
                    is_required=field_data.get("is_required", False),
                    default_value=field_data.get("default_value")
                )
                field_mappings.append(field_mapping)
            
            global_transformations = []
            for rule_data in mapping_data.get("global_transformations", []):
                transformation_rule = TransformationRule(
                    rule_type=TransformationType(rule_data["rule_type"]),
                    source_field=rule_data.get("source_field"),
                    target_field=rule_data.get("target_field"),
                    parameters=rule_data.get("parameters", {}),
                    condition=rule_data.get("condition"),
                    priority=rule_data.get("priority", 0)
                )
                global_transformations.append(transformation_rule)
            
            mapping_config = DataMappingConfig(
                mapping_name=mapping_data["mapping_name"],
                description=mapping_data["description"],
                field_mappings=field_mappings,
                global_transformations=global_transformations,
                validation_rules=mapping_data.get("validation_rules", []),
                metadata=mapping_data.get("metadata", {})
            )
            
            return mapping_config
            
        except Exception as e:
            logger.error(f"Error creating mapping config: {str(e)}")
            raise
    
    async def apply_transformations(self, data: List[Dict[str, Any]], mapping_config: DataMappingConfig) -> List[Dict[str, Any]]:
        """Apply transformations to data based on mapping configuration"""
        try:
            transformed_data = []
            
            for record in data:
                transformed_record = {}
                
                # Apply field mappings
                for field_mapping in mapping_config.field_mappings:
                    source_value = record.get(field_mapping.source_field)
                    
                    # Use default value if source is empty and default is provided
                    if not source_value and field_mapping.default_value is not None:
                        source_value = field_mapping.default_value
                    
                    # Apply field-specific transformations
                    transformer = self.transformers.get(field_mapping.target_field)
                    if transformer:
                        for rule in field_mapping.transformation_rules:
                            source_value = transformer.transform(source_value, rule.get("parameters", {}))
                    
                    # Validate transformed value
                    is_valid = True
                    if transformer:
                        for rule in field_mapping.validation_rules:
                            if not transformer.validate(source_value, rule.get("parameters", {})):
                                is_valid = False
                                break
                    
                    # Add to transformed record if valid or not required
                    if is_valid or not field_mapping.is_required:
                        transformed_record[field_mapping.target_field.value] = source_value
                    elif field_mapping.is_required:
                        logger.warning(f"Required field {field_mapping.target_field.value} failed validation")
                
                # Apply global transformations
                for rule in sorted(mapping_config.global_transformations, key=lambda x: x.priority):
                    transformed_record = await self._apply_global_transformation(transformed_record, rule)
                
                transformed_data.append(transformed_record)
            
            return transformed_data
            
        except Exception as e:
            logger.error(f"Error applying transformations: {str(e)}")
            raise
    
    async def _apply_global_transformation(self, record: Dict[str, Any], rule: TransformationRule) -> Dict[str, Any]:
        """Apply a global transformation rule to a record"""
        try:
            if rule.condition:
                # Evaluate condition (simplified - in production would use safe eval)
                if not self._evaluate_condition(record, rule.condition):
                    return record
            
            if rule.rule_type == TransformationType.FIELD_MAPPING:
                # Copy value from source to target field
                if rule.source_field and rule.target_field:
                    record[rule.target_field] = record.get(rule.source_field)
            
            elif rule.rule_type == TransformationType.VALUE_TRANSFORMATION:
                # Apply value transformation
                if rule.target_field and rule.parameters:
                    current_value = record.get(rule.target_field)
                    if rule.parameters.get("operation") == "concatenate":
                        fields = rule.parameters.get("fields", [])
                        separator = rule.parameters.get("separator", " ")
                        values = [str(record.get(field, "")) for field in fields]
                        record[rule.target_field] = separator.join(filter(None, values))
            
            elif rule.rule_type == TransformationType.CONDITIONAL_LOGIC:
                # Apply conditional logic
                if rule.parameters:
                    condition_field = rule.parameters.get("condition_field")
                    condition_value = rule.parameters.get("condition_value")
                    target_field = rule.parameters.get("target_field")
                    true_value = rule.parameters.get("true_value")
                    false_value = rule.parameters.get("false_value")
                    
                    if condition_field and target_field:
                        if record.get(condition_field) == condition_value:
                            record[target_field] = true_value
                        else:
                            record[target_field] = false_value
            
            return record
            
        except Exception as e:
            logger.error(f"Error applying global transformation: {str(e)}")
            return record
    
    def _evaluate_condition(self, record: Dict[str, Any], condition: str) -> bool:
        """Evaluate a simple condition string (simplified implementation)"""
        try:
            # This is a simplified implementation
            # In production, would use a safe expression evaluator
            
            # Handle simple field existence checks
            if condition.startswith("exists(") and condition.endswith(")"):
                field_name = condition[7:-1]
                return field_name in record and record[field_name] is not None
            
            # Handle simple equality checks
            if "==" in condition:
                field_name, value = condition.split("==", 1)
                field_name = field_name.strip()
                value = value.strip().strip('"\'')
                return str(record.get(field_name, "")) == value
            
            return True
            
        except Exception:
            return True
    
    async def validate_mapping_config(self, mapping_config: DataMappingConfig) -> Dict[str, Any]:
        """Validate a mapping configuration"""
        try:
            validation_result = {
                "valid": True,
                "errors": [],
                "warnings": []
            }
            
            # Check for required fields
            if not mapping_config.mapping_name:
                validation_result["errors"].append("Mapping name is required")
                validation_result["valid"] = False
            
            # Check field mappings
            target_fields = set()
            for field_mapping in mapping_config.field_mappings:
                if field_mapping.target_field in target_fields:
                    validation_result["warnings"].append(f"Duplicate target field: {field_mapping.target_field.value}")
                target_fields.add(field_mapping.target_field)
                
                # Check if transformer exists for field type
                if field_mapping.target_field not in self.transformers:
                    validation_result["warnings"].append(f"No transformer available for field type: {field_mapping.target_field.value}")
            
            # Check global transformations
            for rule in mapping_config.global_transformations:
                if rule.rule_type == TransformationType.FIELD_MAPPING:
                    if not rule.source_field or not rule.target_field:
                        validation_result["errors"].append("Field mapping transformation requires source_field and target_field")
                        validation_result["valid"] = False
            
            return validation_result
            
        except Exception as e:
            logger.error(f"Error validating mapping config: {str(e)}")
            return {
                "valid": False,
                "errors": [f"Validation error: {str(e)}"],
                "warnings": []
            }
    
    async def get_field_suggestions(self, sample_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze sample data and suggest field mappings"""
        try:
            if not sample_data:
                return {"suggestions": []}
            
            suggestions = []
            sample_record = sample_data[0]
            
            for source_field in sample_record.keys():
                field_lower = source_field.lower()
                
                # Suggest mappings based on field names
                if any(name in field_lower for name in ['first', 'fname', 'given']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.FIRST_NAME.value,
                        "confidence": 0.9
                    })
                elif any(name in field_lower for name in ['last', 'lname', 'surname', 'family']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.LAST_NAME.value,
                        "confidence": 0.9
                    })
                elif any(name in field_lower for name in ['email', 'mail']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.EMAIL.value,
                        "confidence": 0.95
                    })
                elif any(name in field_lower for name in ['phone', 'tel', 'mobile']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.PHONE.value,
                        "confidence": 0.9
                    })
                elif any(name in field_lower for name in ['ssn', 'social', 'security']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.SSN.value,
                        "confidence": 0.9
                    })
                elif any(name in field_lower for name in ['dob', 'birth', 'birthday']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.DATE_OF_BIRTH.value,
                        "confidence": 0.9
                    })
                elif any(name in field_lower for name in ['address', 'street']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.ADDRESS_STREET.value,
                        "confidence": 0.8
                    })
                elif 'city' in field_lower:
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.ADDRESS_CITY.value,
                        "confidence": 0.9
                    })
                elif 'state' in field_lower:
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.ADDRESS_STATE.value,
                        "confidence": 0.9
                    })
                elif any(name in field_lower for name in ['zip', 'postal', 'zipcode']):
                    suggestions.append({
                        "source_field": source_field,
                        "suggested_target": FieldType.ADDRESS_ZIP.value,
                        "confidence": 0.9
                    })
            
            return {
                "suggestions": suggestions,
                "sample_record": sample_record
            }
            
        except Exception as e:
            logger.error(f"Error generating field suggestions: {str(e)}")
            return {"suggestions": [], "error": str(e)}