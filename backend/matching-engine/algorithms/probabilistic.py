from typing import Dict, List
import difflib
from datetime import datetime

class ProbabilisticMatcher:
    def __init__(self):
        self.field_weights = {
            'first_name': 0.15,
            'last_name': 0.20,
            'dob': 0.25,
            'ssn_last4': 0.15,
            'address': 0.10,
            'phone': 0.10,
            'email': 0.05
        }
        self.threshold = 0.75
    
    async def match(self, demographic_data: Dict) -> List[Dict]:
        matches = []
        
        # Mock database of existing identities
        mock_identities = self._get_mock_identities()
        
        for identity in mock_identities:
            score = self._calculate_probability_score(demographic_data, identity)
            
            if score >= self.threshold:
                matches.append({
                    'identity_id': identity['identity_id'],
                    'confidence_score': score,
                    'match_type': 'probabilistic',
                    'match_details': {
                        'algorithm': 'weighted_similarity',
                        'threshold': self.threshold
                    },
                    'matched_systems': identity.get('systems', [])
                })
        
        return matches
    
    def _calculate_probability_score(self, data1: Dict, data2: Dict) -> float:
        total_score = 0.0
        total_weight = 0.0
        
        for field, weight in self.field_weights.items():
            if field in data1 and field in data2:
                similarity = self._calculate_field_similarity(
                    str(data1[field]), 
                    str(data2[field]),
                    field
                )
                total_score += similarity * weight
                total_weight += weight
        
        # Normalize score based on available fields
        if total_weight > 0:
            return total_score / total_weight
        return 0.0
    
    def _calculate_field_similarity(self, value1: str, value2: str, field_type: str) -> float:
        if field_type == 'dob':
            # Date similarity
            try:
                date1 = datetime.strptime(value1, '%Y-%m-%d')
                date2 = datetime.strptime(value2, '%Y-%m-%d')
                days_diff = abs((date1 - date2).days)
                if days_diff == 0:
                    return 1.0
                elif days_diff <= 30:
                    return 0.9
                elif days_diff <= 365:
                    return 0.7
                else:
                    return 0.3
            except:
                return 0.0
        
        # String similarity using Levenshtein distance
        return difflib.SequenceMatcher(None, value1.lower(), value2.lower()).ratio()
    
    def _get_mock_identities(self) -> List[Dict]:
        return [
            {
                'identity_id': 'IDX002345678',
                'first_name': 'Jon',  # Similar to John
                'last_name': 'Doe',
                'dob': '1990-01-16',  # One day off
                'ssn_last4': '6789',
                'systems': ['HEALTH_DEPT', 'DMV']
            },
            {
                'identity_id': 'IDX002345679',
                'first_name': 'Michael',
                'last_name': 'Anderson',
                'dob': '1982-07-22',
                'phone': '303-555-0200',
                'systems': ['SOCIAL_SERVICES']
            },
            {
                'identity_id': 'IDX002345680',
                'first_name': 'Sarah',
                'last_name': 'Williams',
                'dob': '1995-03-10',
                'email': 'swilliams@email.com',
                'systems': ['DMV']
            }
        ]