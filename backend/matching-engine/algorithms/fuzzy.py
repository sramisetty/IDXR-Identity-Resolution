from typing import Dict, List
from fuzzywuzzy import fuzz
import re

class FuzzyMatcher:
    def __init__(self):
        self.fuzzy_threshold = 80  # Fuzzy matching threshold (0-100)
    
    async def match(self, demographic_data: Dict) -> List[Dict]:
        matches = []
        
        # Mock database of existing identities
        mock_identities = self._get_mock_identities()
        
        for identity in mock_identities:
            fuzzy_score = self._calculate_fuzzy_score(demographic_data, identity)
            
            if fuzzy_score >= self.fuzzy_threshold:
                confidence = fuzzy_score / 100.0 * 0.85  # Max 0.85 confidence for fuzzy
                matches.append({
                    'identity_id': identity['identity_id'],
                    'confidence_score': confidence,
                    'match_type': 'fuzzy',
                    'match_details': {
                        'fuzzy_score': fuzzy_score,
                        'algorithm': 'levenshtein_fuzzy'
                    },
                    'matched_systems': identity.get('systems', [])
                })
        
        return matches
    
    def _calculate_fuzzy_score(self, data1: Dict, data2: Dict) -> float:
        scores = []
        
        # Name fuzzy matching
        if 'first_name' in data1 and 'first_name' in data2:
            first_name_score = fuzz.ratio(
                self._normalize_string(data1['first_name']),
                self._normalize_string(data2['first_name'])
            )
            scores.append(first_name_score)
        
        if 'last_name' in data1 and 'last_name' in data2:
            last_name_score = fuzz.ratio(
                self._normalize_string(data1['last_name']),
                self._normalize_string(data2['last_name'])
            )
            scores.append(last_name_score * 1.2)  # Last name more important
        
        # Address fuzzy matching
        if 'address' in data1 and 'address' in data2:
            address1 = self._normalize_address(data1.get('address', {}))
            address2 = self._normalize_address(data2.get('address', {}))
            if address1 and address2:
                address_score = fuzz.token_sort_ratio(address1, address2)
                scores.append(address_score * 0.8)
        
        # Phone fuzzy matching (handle different formats)
        if 'phone' in data1 and 'phone' in data2:
            phone1 = self._normalize_phone(data1['phone'])
            phone2 = self._normalize_phone(data2['phone'])
            if phone1 == phone2:
                scores.append(100)
            elif len(phone1) >= 7 and len(phone2) >= 7:
                if phone1[-7:] == phone2[-7:]:  # Same last 7 digits
                    scores.append(90)
        
        if scores:
            return sum(scores) / len(scores)
        return 0
    
    def _normalize_string(self, s: str) -> str:
        # Remove special characters and convert to lowercase
        return re.sub(r'[^a-zA-Z0-9\s]', '', str(s).lower()).strip()
    
    def _normalize_phone(self, phone: str) -> str:
        # Remove all non-digit characters
        return re.sub(r'\D', '', str(phone))
    
    def _normalize_address(self, address: Dict) -> str:
        if isinstance(address, dict):
            parts = []
            for key in ['street', 'city', 'state', 'zip']:
                if key in address:
                    parts.append(str(address[key]))
            return ' '.join(parts).lower()
        return str(address).lower()
    
    def _get_mock_identities(self) -> List[Dict]:
        return [
            {
                'identity_id': 'IDX003456789',
                'first_name': 'Johnny',  # Nickname of John
                'last_name': 'Doe',
                'phone': '(303) 555-0100',
                'address': {
                    'street': '123 Main Street',
                    'city': 'Denver',
                    'state': 'CO'
                },
                'systems': ['DMV']
            },
            {
                'identity_id': 'IDX003456790',
                'first_name': 'Bob',  # Robert
                'last_name': 'Johnson',
                'phone': '303.555.0100',
                'systems': ['HEALTH_DEPT']
            }
        ]