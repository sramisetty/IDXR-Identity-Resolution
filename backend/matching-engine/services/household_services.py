"""
Household Services for Identity Cross-Resolution
Advanced household detection and management for Colorado OIT IDXR system
"""

import numpy as np
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime, date
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import json
from collections import defaultdict
import asyncio

logger = logging.getLogger(__name__)

class HouseholdRelationship(Enum):
    HEAD_OF_HOUSEHOLD = "head_of_household"
    SPOUSE = "spouse"
    CHILD = "child"
    PARENT = "parent"
    SIBLING = "sibling"
    GRANDPARENT = "grandparent"
    GRANDCHILD = "grandchild"
    OTHER_RELATIVE = "other_relative"
    UNRELATED = "unrelated"

@dataclass
class HouseholdMember:
    identity_id: str
    relationship: HouseholdRelationship
    confidence_score: float
    demographics: Dict
    is_primary_contact: bool = False
    dependency_status: Optional[str] = None
    guardian_id: Optional[str] = None

@dataclass
class Household:
    household_id: str
    members: List[HouseholdMember]
    primary_address: Dict
    formation_date: datetime
    last_updated: datetime
    household_size: int
    has_children: bool
    has_elderly: bool
    income_level: Optional[str] = None
    household_type: str = "family"  # family, single, roommates, etc.

class HouseholdDetector:
    """Advanced household detection using multiple algorithms"""
    
    def __init__(self):
        self.address_similarity_threshold = 0.9
        self.name_similarity_threshold = 0.8
        self.age_difference_thresholds = {
            'spouse': (0, 15),      # 0-15 years difference
            'parent_child': (15, 50), # 15-50 years difference
            'sibling': (0, 20),     # 0-20 years difference
            'grandparent': (40, 80)  # 40-80 years difference
        }
    
    async def detect_households(self, identities: List[Dict]) -> List[Household]:
        """Main household detection algorithm"""
        try:
            # Step 1: Group by address
            address_groups = self._group_by_address(identities)
            
            households = []
            
            for address, members in address_groups.items():
                if len(members) == 1:
                    # Single person household
                    household = await self._create_single_household(members[0], address)
                    households.append(household)
                else:
                    # Multi-person household - analyze relationships
                    household = await self._analyze_multi_person_household(members, address)
                    if household:
                        households.append(household)
            
            return households
            
        except Exception as e:
            logger.error(f"Error detecting households: {str(e)}")
            return []
    
    def _group_by_address(self, identities: List[Dict]) -> Dict[str, List[Dict]]:
        """Group identities by normalized address"""
        address_groups = defaultdict(list)
        
        for identity in identities:
            address_key = self._normalize_address(identity.get('address', {}))
            if address_key:
                address_groups[address_key].append(identity)
        
        return dict(address_groups)
    
    def _normalize_address(self, address: Dict) -> Optional[str]:
        """Normalize address for grouping"""
        if not address:
            return None
        
        street = address.get('street', '').lower().strip()
        city = address.get('city', '').lower().strip()
        state = address.get('state', '').lower().strip()
        zip_code = address.get('zip', '').strip()
        
        if not (street and city and zip_code):
            return None
        
        # Normalize street address
        street = self._normalize_street(street)
        
        return f"{street}|{city}|{state}|{zip_code}"
    
    def _normalize_street(self, street: str) -> str:
        """Normalize street address components"""
        # Remove apartment/unit numbers
        import re
        street = re.sub(r'\b(apt|apartment|unit|suite|ste|#)\s*\w+\b', '', street, flags=re.IGNORECASE)
        
        # Normalize common abbreviations
        replacements = {
            'street': 'st', 'avenue': 'ave', 'boulevard': 'blvd',
            'drive': 'dr', 'lane': 'ln', 'road': 'rd',
            'circle': 'cir', 'court': 'ct', 'place': 'pl'
        }
        
        for full, abbrev in replacements.items():
            street = re.sub(rf'\b{full}\b', abbrev, street, flags=re.IGNORECASE)
            street = re.sub(rf'\b{abbrev}\.?\b', abbrev, street, flags=re.IGNORECASE)
        
        return street.strip()
    
    async def _create_single_household(self, member: Dict, address: str) -> Household:
        """Create a single-person household"""
        household_id = f"HH_{member['identity_id']}"
        
        member_obj = HouseholdMember(
            identity_id=member['identity_id'],
            relationship=HouseholdRelationship.HEAD_OF_HOUSEHOLD,
            confidence_score=1.0,
            demographics=member,
            is_primary_contact=True
        )
        
        return Household(
            household_id=household_id,
            members=[member_obj],
            primary_address=member.get('address', {}),
            formation_date=datetime.now(),
            last_updated=datetime.now(),
            household_size=1,
            has_children=self._is_child(member),
            has_elderly=self._is_elderly(member),
            household_type="single"
        )
    
    async def _analyze_multi_person_household(self, members: List[Dict], address: str) -> Optional[Household]:
        """Analyze multi-person household and determine relationships"""
        try:
            # Sort members by age (oldest first)
            members_with_age = []
            for member in members:
                age = self._calculate_age(member.get('dob'))
                if age is not None:
                    members_with_age.append((member, age))
            
            members_with_age.sort(key=lambda x: x[1], reverse=True)
            
            # Determine relationships
            household_members = []
            head_of_household = None
            
            # First pass: identify head of household (usually oldest adult)
            for member, age in members_with_age:
                if age >= 18 and not head_of_household:
                    head_of_household = HouseholdMember(
                        identity_id=member['identity_id'],
                        relationship=HouseholdRelationship.HEAD_OF_HOUSEHOLD,
                        confidence_score=0.9,
                        demographics=member,
                        is_primary_contact=True
                    )
                    household_members.append(head_of_household)
                    break
            
            if not head_of_household:
                # No adults found - use oldest person
                if members_with_age:
                    member, age = members_with_age[0]
                    head_of_household = HouseholdMember(
                        identity_id=member['identity_id'],
                        relationship=HouseholdRelationship.HEAD_OF_HOUSEHOLD,
                        confidence_score=0.7,
                        demographics=member,
                        is_primary_contact=True
                    )
                    household_members.append(head_of_household)
            
            # Second pass: determine relationships for other members
            for member, age in members_with_age:
                if member['identity_id'] == head_of_household.identity_id:
                    continue
                
                relationship, confidence = self._determine_relationship(
                    head_of_household.demographics, member, 
                    self._calculate_age(head_of_household.demographics.get('dob')), age
                )
                
                household_member = HouseholdMember(
                    identity_id=member['identity_id'],
                    relationship=relationship,
                    confidence_score=confidence,
                    demographics=member
                )
                
                # Set guardian for children
                if relationship == HouseholdRelationship.CHILD and age < 18:
                    household_member.guardian_id = head_of_household.identity_id
                    household_member.dependency_status = "minor"
                
                household_members.append(household_member)
            
            # Create household
            household_id = f"HH_{address.replace('|', '_')}"
            
            return Household(
                household_id=household_id,
                members=household_members,
                primary_address=members[0].get('address', {}),
                formation_date=datetime.now(),
                last_updated=datetime.now(),
                household_size=len(household_members),
                has_children=any(self._is_child(m.demographics) for m in household_members),
                has_elderly=any(self._is_elderly(m.demographics) for m in household_members),
                household_type=self._determine_household_type(household_members)
            )
            
        except Exception as e:
            logger.error(f"Error analyzing multi-person household: {str(e)}")
            return None
    
    def _determine_relationship(self, head: Dict, member: Dict, head_age: int, member_age: int) -> Tuple[HouseholdRelationship, float]:
        """Determine relationship between head of household and member"""
        age_diff = abs(head_age - member_age)
        
        # Check for spouse relationship
        if self._could_be_spouse(head, member, age_diff):
            return HouseholdRelationship.SPOUSE, 0.85
        
        # Check for parent-child relationship
        if head_age > member_age and age_diff >= 15:
            if self._likely_parent_child(head, member):
                return HouseholdRelationship.CHILD, 0.9
        elif member_age > head_age and age_diff >= 15:
            if self._likely_parent_child(member, head):
                return HouseholdRelationship.PARENT, 0.8
        
        # Check for sibling relationship
        if age_diff <= 20 and self._could_be_sibling(head, member):
            return HouseholdRelationship.SIBLING, 0.75
        
        # Check for grandparent relationship
        if age_diff >= 40:
            if head_age > member_age:
                return HouseholdRelationship.GRANDCHILD, 0.7
            else:
                return HouseholdRelationship.GRANDPARENT, 0.7
        
        # Default to other relative
        if self._similar_last_name(head, member):
            return HouseholdRelationship.OTHER_RELATIVE, 0.6
        
        # Unrelated (roommates, etc.)
        return HouseholdRelationship.UNRELATED, 0.5
    
    def _could_be_spouse(self, person1: Dict, person2: Dict, age_diff: int) -> bool:
        """Check if two people could be spouses"""
        # Age difference reasonable for spouses
        if age_diff > 15:
            return False
        
        # Different genders (if gender info available)
        gender1 = person1.get('gender', '').lower()
        gender2 = person2.get('gender', '').lower()
        if gender1 and gender2 and gender1 == gender2:
            # Same gender - could still be married, but less likely in traditional households
            pass
        
        # Both adults
        age1 = self._calculate_age(person1.get('dob'))
        age2 = self._calculate_age(person2.get('dob'))
        if age1 and age2 and (age1 < 16 or age2 < 16):
            return False
        
        return True
    
    def _likely_parent_child(self, older: Dict, younger: Dict) -> bool:
        """Check if older person is likely parent of younger"""
        # Check last name similarity
        if not self._similar_last_name(older, younger):
            # Could be step-parent or different naming convention
            return True  # Don't rule out based on name alone
        
        return True
    
    def _could_be_sibling(self, person1: Dict, person2: Dict) -> bool:
        """Check if two people could be siblings"""
        # Similar last names
        return self._similar_last_name(person1, person2)
    
    def _similar_last_name(self, person1: Dict, person2: Dict) -> bool:
        """Check if two people have similar last names"""
        name1 = person1.get('last_name', '').lower()
        name2 = person2.get('last_name', '').lower()
        
        if not name1 or not name2:
            return False
        
        # Exact match
        if name1 == name2:
            return True
        
        # Similar names (handle typos, etc.)
        from difflib import SequenceMatcher
        similarity = SequenceMatcher(None, name1, name2).ratio()
        return similarity > 0.9
    
    def _calculate_age(self, dob: Optional[str]) -> Optional[int]:
        """Calculate age from date of birth"""
        if not dob:
            return None
        
        try:
            birth_date = datetime.strptime(dob, '%Y-%m-%d').date()
            today = date.today()
            age = today.year - birth_date.year
            
            # Adjust if birthday hasn't occurred this year
            if today < date(today.year, birth_date.month, birth_date.day):
                age -= 1
            
            return age
        except:
            return None
    
    def _is_child(self, person: Dict) -> bool:
        """Check if person is a child"""
        age = self._calculate_age(person.get('dob'))
        return age is not None and age < 18
    
    def _is_elderly(self, person: Dict) -> bool:
        """Check if person is elderly"""
        age = self._calculate_age(person.get('dob'))
        return age is not None and age >= 65
    
    def _determine_household_type(self, members: List[HouseholdMember]) -> str:
        """Determine household type based on relationships"""
        if len(members) == 1:
            return "single"
        
        relationships = [member.relationship for member in members]
        
        # Family household
        if (HouseholdRelationship.SPOUSE in relationships or 
            HouseholdRelationship.CHILD in relationships or
            HouseholdRelationship.PARENT in relationships):
            return "family"
        
        # Related household
        if (HouseholdRelationship.SIBLING in relationships or
            HouseholdRelationship.OTHER_RELATIVE in relationships):
            return "related"
        
        # Unrelated household (roommates)
        return "unrelated"

class HouseholdService:
    """Main service for household management"""
    
    def __init__(self):
        self.detector = HouseholdDetector()
        self.households_cache = {}  # In production, this would be a database
    
    async def get_household_by_identity(self, identity_id: str) -> Optional[Household]:
        """Get household containing a specific identity"""
        try:
            # In production, this would query the database
            for household in self.households_cache.values():
                for member in household.members:
                    if member.identity_id == identity_id:
                        return household
            return None
            
        except Exception as e:
            logger.error(f"Error getting household by identity: {str(e)}")
            return None
    
    async def get_household_members(self, household_id: str) -> List[HouseholdMember]:
        """Get all members of a household"""
        try:
            household = self.households_cache.get(household_id)
            return household.members if household else []
            
        except Exception as e:
            logger.error(f"Error getting household members: {str(e)}")
            return []
    
    async def add_member_to_household(self, household_id: str, identity_id: str, 
                                    relationship: HouseholdRelationship, 
                                    confidence: float = 0.8) -> bool:
        """Add a new member to an existing household"""
        try:
            if household_id not in self.households_cache:
                return False
            
            household = self.households_cache[household_id]
            
            # Check if member already exists
            for member in household.members:
                if member.identity_id == identity_id:
                    return False  # Already a member
            
            # Get identity demographics (would query database in production)
            demographics = await self._get_identity_demographics(identity_id)
            if not demographics:
                return False
            
            new_member = HouseholdMember(
                identity_id=identity_id,
                relationship=relationship,
                confidence_score=confidence,
                demographics=demographics
            )
            
            household.members.append(new_member)
            household.household_size += 1
            household.last_updated = datetime.now()
            
            # Update household characteristics
            household.has_children = any(self.detector._is_child(m.demographics) 
                                       for m in household.members)
            household.has_elderly = any(self.detector._is_elderly(m.demographics) 
                                      for m in household.members)
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding member to household: {str(e)}")
            return False
    
    async def remove_member_from_household(self, household_id: str, identity_id: str) -> bool:
        """Remove a member from a household"""
        try:
            if household_id not in self.households_cache:
                return False
            
            household = self.households_cache[household_id]
            
            # Find and remove member
            for i, member in enumerate(household.members):
                if member.identity_id == identity_id:
                    household.members.pop(i)
                    household.household_size -= 1
                    household.last_updated = datetime.now()
                    
                    # If removed member was head of household, promote another
                    if member.relationship == HouseholdRelationship.HEAD_OF_HOUSEHOLD:
                        await self._promote_new_head_of_household(household)
                    
                    return True
            
            return False  # Member not found
            
        except Exception as e:
            logger.error(f"Error removing member from household: {str(e)}")
            return False
    
    async def merge_households(self, household_id1: str, household_id2: str) -> Optional[str]:
        """Merge two households into one"""
        try:
            household1 = self.households_cache.get(household_id1)
            household2 = self.households_cache.get(household_id2)
            
            if not (household1 and household2):
                return None
            
            # Merge members
            all_members = household1.members + household2.members
            
            # Keep the household with more members as primary
            if len(household1.members) >= len(household2.members):
                primary_household = household1
                merged_id = household_id1
            else:
                primary_household = household2
                merged_id = household_id2
            
            # Update primary household
            primary_household.members = all_members
            primary_household.household_size = len(all_members)
            primary_household.last_updated = datetime.now()
            
            # Remove secondary household
            secondary_id = household_id2 if merged_id == household_id1 else household_id1
            if secondary_id in self.households_cache:
                del self.households_cache[secondary_id]
            
            return merged_id
            
        except Exception as e:
            logger.error(f"Error merging households: {str(e)}")
            return None
    
    async def split_household(self, household_id: str, member_ids: List[str]) -> Optional[str]:
        """Split a household by moving specified members to new household"""
        try:
            original_household = self.households_cache.get(household_id)
            if not original_household:
                return None
            
            # Find members to move
            members_to_move = []
            remaining_members = []
            
            for member in original_household.members:
                if member.identity_id in member_ids:
                    members_to_move.append(member)
                else:
                    remaining_members.append(member)
            
            if not members_to_move or not remaining_members:
                return None  # Can't split if all or no members selected
            
            # Create new household
            new_household_id = f"HH_SPLIT_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
            
            # Determine new head of household
            new_head = None
            for member in members_to_move:
                if member.relationship == HouseholdRelationship.HEAD_OF_HOUSEHOLD:
                    new_head = member
                    break
            
            if not new_head:
                # Make oldest adult the new head
                adults = [m for m in members_to_move 
                         if self.detector._calculate_age(m.demographics.get('dob', '')) >= 18]
                if adults:
                    new_head = adults[0]
                    new_head.relationship = HouseholdRelationship.HEAD_OF_HOUSEHOLD
                else:
                    # No adults, make oldest person head
                    if members_to_move:
                        new_head = members_to_move[0]
                        new_head.relationship = HouseholdRelationship.HEAD_OF_HOUSEHOLD
            
            new_household = Household(
                household_id=new_household_id,
                members=members_to_move,
                primary_address=original_household.primary_address,
                formation_date=datetime.now(),
                last_updated=datetime.now(),
                household_size=len(members_to_move),
                has_children=any(self.detector._is_child(m.demographics) 
                               for m in members_to_move),
                has_elderly=any(self.detector._is_elderly(m.demographics) 
                              for m in members_to_move),
                household_type=self.detector._determine_household_type(members_to_move)
            )
            
            # Update original household
            original_household.members = remaining_members
            original_household.household_size = len(remaining_members)
            original_household.last_updated = datetime.now()
            
            # Store new household
            self.households_cache[new_household_id] = new_household
            
            return new_household_id
            
        except Exception as e:
            logger.error(f"Error splitting household: {str(e)}")
            return None
    
    async def get_household_statistics(self) -> Dict:
        """Get statistics about all households"""
        try:
            stats = {
                'total_households': len(self.households_cache),
                'total_individuals': 0,
                'household_types': defaultdict(int),
                'average_household_size': 0,
                'households_with_children': 0,
                'households_with_elderly': 0,
                'single_person_households': 0
            }
            
            if not self.households_cache:
                return dict(stats)
            
            total_size = 0
            
            for household in self.households_cache.values():
                stats['total_individuals'] += household.household_size
                stats['household_types'][household.household_type] += 1
                total_size += household.household_size
                
                if household.has_children:
                    stats['households_with_children'] += 1
                
                if household.has_elderly:
                    stats['households_with_elderly'] += 1
                
                if household.household_size == 1:
                    stats['single_person_households'] += 1
            
            stats['average_household_size'] = total_size / len(self.households_cache)
            stats['household_types'] = dict(stats['household_types'])
            
            return dict(stats)
            
        except Exception as e:
            logger.error(f"Error getting household statistics: {str(e)}")
            return {}
    
    async def _get_identity_demographics(self, identity_id: str) -> Optional[Dict]:
        """Get demographics for an identity (mock implementation)"""
        # In production, this would query the identity database
        mock_demographics = {
            'identity_id': identity_id,
            'first_name': 'Unknown',
            'last_name': 'Person',
            'dob': '1990-01-01'
        }
        return mock_demographics
    
    async def _promote_new_head_of_household(self, household: Household):
        """Promote a new head of household when current head is removed"""
        if not household.members:
            return
        
        # Find oldest adult
        adults = [m for m in household.members 
                 if self.detector._calculate_age(m.demographics.get('dob', '')) >= 18]
        
        if adults:
            # Sort by age, make oldest the head
            adults.sort(key=lambda m: self.detector._calculate_age(m.demographics.get('dob', '')), reverse=True)
            new_head = adults[0]
        else:
            # No adults, make oldest person head
            household.members.sort(key=lambda m: self.detector._calculate_age(m.demographics.get('dob', '')) or 0, reverse=True)
            new_head = household.members[0]
        
        new_head.relationship = HouseholdRelationship.HEAD_OF_HOUSEHOLD
        new_head.is_primary_contact = True