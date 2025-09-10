from typing import Dict, List, Optional
import hashlib
import json

class DeterministicMatcher:
    def __init__(self):
        self.exact_match_fields = ['ssn', 'driver_license', 'passport_number']
        self.composite_keys = [
            ['first_name', 'last_name', 'dob'],
            ['phone', 'email'],
            ['first_name', 'last_name', 'address']
        ]
    
    async def match(self, demographic_data: Dict) -> List[Dict]:
        matches = []
        
        # Mock database of existing identities
        mock_identities = self._get_mock_identities()
        
        for identity in mock_identities:
            # Check exact field matches
            for field in self.exact_match_fields:
                if field in demographic_data and field in identity:
                    if demographic_data[field] == identity[field]:
                        matches.append({
                            'identity_id': identity['identity_id'],
                            'confidence_score': 1.0,
                            'match_type': 'deterministic_exact',
                            'matched_fields': [field],
                            'matched_systems': identity.get('systems', [])
                        })
                        break
            
            # Check composite key matches
            for key_set in self.composite_keys:
                if self._check_composite_match(demographic_data, identity, key_set):
                    matches.append({
                        'identity_id': identity['identity_id'],
                        'confidence_score': 0.95,
                        'match_type': 'deterministic_composite',
                        'matched_fields': key_set,
                        'matched_systems': identity.get('systems', [])
                    })
                    break
        
        return matches
    
    def _check_composite_match(self, data1: Dict, data2: Dict, fields: List[str]) -> bool:
        for field in fields:
            if field not in data1 or field not in data2:
                return False
            if str(data1[field]).lower() != str(data2[field]).lower():
                return False
        return True
    
    def _get_mock_identities(self) -> List[Dict]:
        # Mock database of identities for demo
        return [
            {
                'identity_id': 'IDX001234567',
                'first_name': 'John',
                'last_name': 'Doe',
                'dob': '1990-01-15',
                'ssn': '123-45-6789',
                'systems': ['DMV', 'HEALTH_DEPT']
            },
            {
                'identity_id': 'IDX001234568',
                'first_name': 'Jane',
                'last_name': 'Smith',
                'dob': '1985-05-20',
                'driver_license': 'DL123456',
                'systems': ['DMV', 'SOCIAL_SERVICES']
            },
            {
                'identity_id': 'IDX001234569',
                'first_name': 'Robert',
                'last_name': 'Johnson',
                'dob': '1978-11-30',
                'phone': '303-555-0100',
                'email': 'rjohnson@email.com',
                'systems': ['HEALTH_DEPT']
            }
        ]