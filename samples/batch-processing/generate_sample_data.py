#!/usr/bin/env python3
"""
Generate sample CSV files with 1000 users each for testing different batch processing types.
Creates realistic test data for IDXR batch processing functionality.
"""

import csv
import random
import uuid
from datetime import datetime, timedelta
from faker import Faker
import os

fake = Faker('en_US')

# Colorado-specific data
COLORADO_CITIES = [
    'Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood', 
    'Thornton', 'Arvada', 'Westminster', 'Pueblo', 'Centennial',
    'Boulder', 'Greeley', 'Longmont', 'Loveland', 'Grand Junction',
    'Broomfield', 'Castle Rock', 'Commerce City', 'Parker', 'Littleton'
]

COLORADO_ZIP_CODES = [
    '80202', '80203', '80204', '80205', '80206', '80207', '80209', '80210',
    '80211', '80212', '80218', '80219', '80220', '80221', '80222', '80223',
    '80224', '80225', '80226', '80227', '80228', '80229', '80230', '80231',
    '80232', '80233', '80234', '80235', '80236', '80237', '80238', '80239',
    '80014', '80015', '80016', '80017', '80018', '80019', '80020', '80021',
    '80022', '80023', '80024', '80025', '80026', '80027', '80028', '80030',
    '80031', '80033', '80102', '80103', '80104', '80105', '80106', '80107'
]

PHONE_AREA_CODES = ['303', '720', '970']

def generate_ssn():
    """Generate a fake SSN (XXX-XX-XXXX format)"""
    return f"{random.randint(100, 999):03d}-{random.randint(10, 99):02d}-{random.randint(1000, 9999):04d}"

def generate_colorado_phone():
    """Generate a Colorado phone number"""
    area_code = random.choice(PHONE_AREA_CODES)
    return f"({area_code}) {random.randint(200, 999):03d}-{random.randint(1000, 9999):04d}"

def generate_colorado_address():
    """Generate a Colorado address"""
    return {
        'street': fake.street_address(),
        'city': random.choice(COLORADO_CITIES),
        'state': 'CO',
        'zip_code': random.choice(COLORADO_ZIP_CODES)
    }

def generate_base_identity():
    """Generate a base identity record"""
    addr = generate_colorado_address()
    return {
        'identity_id': str(uuid.uuid4()),
        'first_name': fake.first_name(),
        'last_name': fake.last_name(),
        'middle_name': fake.first_name() if random.random() < 0.3 else '',
        'dob': fake.date_of_birth(minimum_age=18, maximum_age=90).strftime('%Y-%m-%d'),
        'ssn': generate_ssn(),
        'phone': generate_colorado_phone(),
        'email': fake.email(),
        'street_address': addr['street'],
        'city': addr['city'],
        'state': addr['state'],
        'zip_code': addr['zip_code'],
        'gender': random.choice(['M', 'F', 'Other']),
        'created_date': fake.date_between(start_date='-2y', end_date='today').strftime('%Y-%m-%d'),
        'source_system': random.choice(['DMV', 'HEALTH_DEPT', 'SOCIAL_SERVICES', 'VOTER_REG', 'TAX_DEPT'])
    }

def create_identity_matching_data():
    """Create data for identity matching testing - includes some duplicates and variations"""
    print("Generating Identity Matching sample data...")
    records = []
    
    # Generate 800 unique identities
    for i in range(800):
        records.append(generate_base_identity())
    
    # Create 100 duplicate variations (name variations, typos, etc.)
    base_records = random.sample(records[:100], 100)
    for base_record in base_records:
        # Create variation with slight name differences
        variant = base_record.copy()
        variant['identity_id'] = str(uuid.uuid4())
        variant['source_system'] = random.choice(['DMV', 'HEALTH_DEPT', 'SOCIAL_SERVICES'])
        
        # Introduce variations
        if random.random() < 0.5:
            # Name variation
            variant['first_name'] = variant['first_name'].replace('a', 'e') if 'a' in variant['first_name'] else variant['first_name'] + 'e'
        
        if random.random() < 0.3:
            # Phone variation
            variant['phone'] = generate_colorado_phone()
        
        if random.random() < 0.4:
            # Email variation
            variant['email'] = f"{variant['first_name'].lower()}.{variant['last_name'].lower()}@example.com"
        
        records.append(variant)
    
    # Add 100 more unique records
    for i in range(100):
        records.append(generate_base_identity())
    
    return records

def create_data_validation_data():
    """Create data with various quality issues for validation testing"""
    print("Generating Data Validation sample data...")
    records = []
    
    # Generate 700 good quality records
    for i in range(700):
        records.append(generate_base_identity())
    
    # Generate 300 records with various issues
    for i in range(300):
        record = generate_base_identity()
        
        # Introduce data quality issues
        issue_type = random.randint(1, 6)
        
        if issue_type == 1:
            # Missing required fields
            record['first_name'] = ''
        elif issue_type == 2:
            # Invalid email
            record['email'] = 'invalid-email-format'
        elif issue_type == 3:
            # Invalid phone
            record['phone'] = '123-45-6789'
        elif issue_type == 4:
            # Invalid ZIP
            record['zip_code'] = '12345'
        elif issue_type == 5:
            # Invalid date
            record['dob'] = '2025-01-01'  # Future date
        else:
            # Missing multiple fields
            record['middle_name'] = ''
            record['email'] = ''
            record['phone'] = ''
        
        records.append(record)
    
    return records

def create_household_detection_data():
    """Create data for household detection testing - includes family groups"""
    print("Generating Household Detection sample data...")
    records = []
    
    # Generate 200 family groups (4-5 members each)
    for family_id in range(200):
        family_size = random.randint(2, 5)
        family_last_name = fake.last_name()
        addr = generate_colorado_address()
        
        # Generate family members
        for member in range(family_size):
            record = generate_base_identity()
            record['last_name'] = family_last_name
            record['street_address'] = addr['street']
            record['city'] = addr['city']
            record['state'] = addr['state']
            record['zip_code'] = addr['zip_code']
            
            # Set ages appropriately for family structure
            if member == 0:  # Parent 1
                record['dob'] = fake.date_of_birth(minimum_age=30, maximum_age=60).strftime('%Y-%m-%d')
                record['gender'] = random.choice(['M', 'F'])
            elif member == 1 and family_size > 2:  # Parent 2
                record['dob'] = fake.date_of_birth(minimum_age=28, maximum_age=58).strftime('%Y-%m-%d')
                record['gender'] = 'F' if records[-1]['gender'] == 'M' else 'M'
            else:  # Children
                record['dob'] = fake.date_of_birth(minimum_age=1, maximum_age=25).strftime('%Y-%m-%d')
                record['gender'] = random.choice(['M', 'F'])
            
            # Same phone number for family members (sometimes)
            if random.random() < 0.7 and records:
                record['phone'] = records[-1]['phone']
            
            records.append(record)
    
    # Add 200 individual records
    for i in range(200):
        records.append(generate_base_identity())
    
    return records

def create_data_quality_data():
    """Create data for data quality assessment - mixed quality levels"""
    print("Generating Data Quality sample data...")
    records = []
    
    # High quality records (400)
    for i in range(400):
        record = generate_base_identity()
        # Ensure all fields are populated and valid
        if not record['middle_name']:
            record['middle_name'] = fake.first_name()
        records.append(record)
    
    # Medium quality records (300)
    for i in range(300):
        record = generate_base_identity()
        # Randomly remove some non-critical fields
        if random.random() < 0.5:
            record['middle_name'] = ''
        if random.random() < 0.3:
            record['email'] = ''
        records.append(record)
    
    # Low quality records (200)
    for i in range(200):
        record = generate_base_identity()
        # Remove multiple fields and add inconsistencies
        record['middle_name'] = ''
        if random.random() < 0.5:
            record['email'] = ''
        if random.random() < 0.3:
            record['phone'] = ''
        # Add some inconsistent formatting
        if random.random() < 0.4:
            record['first_name'] = record['first_name'].upper()
        if random.random() < 0.4:
            record['last_name'] = record['last_name'].lower()
        records.append(record)
    
    # Very low quality records (100)
    for i in range(100):
        record = generate_base_identity()
        # Multiple issues
        record['middle_name'] = ''
        record['email'] = ''
        if random.random() < 0.5:
            record['phone'] = ''
        if random.random() < 0.5:
            record['street_address'] = ''
        # Inconsistent data
        record['first_name'] = record['first_name'].upper()
        record['city'] = record['city'].lower()
        records.append(record)
    
    return records

def create_deduplication_data():
    """Create data with intentional duplicates for deduplication testing"""
    print("Generating Deduplication sample data...")
    records = []
    
    # Generate 400 unique identities
    unique_records = []
    for i in range(400):
        unique_records.append(generate_base_identity())
    
    records.extend(unique_records)
    
    # Create exact duplicates (100)
    for i in range(100):
        original = random.choice(unique_records)
        duplicate = original.copy()
        duplicate['identity_id'] = str(uuid.uuid4())  # Different ID but same person
        duplicate['source_system'] = random.choice(['DMV', 'HEALTH_DEPT', 'SOCIAL_SERVICES'])
        records.append(duplicate)
    
    # Create near duplicates with variations (200)
    for i in range(200):
        original = random.choice(unique_records)
        near_duplicate = original.copy()
        near_duplicate['identity_id'] = str(uuid.uuid4())
        
        # Add variations
        variation_type = random.randint(1, 4)
        if variation_type == 1:
            # Name variation
            near_duplicate['first_name'] = near_duplicate['first_name'].replace('e', 'a') if 'e' in near_duplicate['first_name'] else near_duplicate['first_name'] + 'a'
        elif variation_type == 2:
            # Phone variation
            near_duplicate['phone'] = generate_colorado_phone()
        elif variation_type == 3:
            # Address variation (same street, different format)
            near_duplicate['street_address'] = near_duplicate['street_address'].replace('St', 'Street').replace('Ave', 'Avenue')
        else:
            # Email variation
            near_duplicate['email'] = f"{near_duplicate['first_name'][0].lower()}{near_duplicate['last_name'].lower()}@gmail.com"
        
        records.append(near_duplicate)
    
    # Add 300 more unique records
    for i in range(300):
        records.append(generate_base_identity())
    
    return records

def create_bulk_export_data():
    """Create comprehensive data for bulk export testing"""
    print("Generating Bulk Export sample data...")
    records = []
    
    # Generate diverse, comprehensive dataset
    for i in range(1000):
        record = generate_base_identity()
        
        # Add some additional fields for export testing
        record['full_name'] = f"{record['first_name']} {record['middle_name']} {record['last_name']}".strip()
        record['full_address'] = f"{record['street_address']}, {record['city']}, {record['state']} {record['zip_code']}"
        record['age'] = datetime.now().year - datetime.strptime(record['dob'], '%Y-%m-%d').year
        record['phone_formatted'] = record['phone']
        record['ssn_masked'] = f"***-**-{record['ssn'][-4:]}"
        
        # Add some categorical data
        record['income_bracket'] = random.choice(['Low', 'Medium', 'High', 'Very High'])
        record['employment_status'] = random.choice(['Employed', 'Unemployed', 'Retired', 'Student'])
        record['marital_status'] = random.choice(['Single', 'Married', 'Divorced', 'Widowed'])
        
        records.append(record)
    
    return records

def write_csv_file(filename, data, fieldnames=None):
    """Write data to CSV file"""
    if not data:
        print(f"Warning: No data to write to {filename}")
        return
    
    if fieldnames is None:
        fieldnames = data[0].keys()
    
    filepath = os.path.join('samples', filename)
    with open(filepath, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)
    
    print(f"Created {filename} with {len(data)} records")

def main():
    """Generate all sample files"""
    print("Generating sample CSV files for IDXR batch processing...")
    print("=" * 60)
    
    # Create samples directory if it doesn't exist
    os.makedirs('samples', exist_ok=True)
    
    # Generate different types of test data
    datasets = {
        'identity_matching_sample.csv': create_identity_matching_data(),
        'data_validation_sample.csv': create_data_validation_data(),
        'household_detection_sample.csv': create_household_detection_data(),
        'data_quality_sample.csv': create_data_quality_data(),
        'deduplication_sample.csv': create_deduplication_data(),
        'bulk_export_sample.csv': create_bulk_export_data()
    }
    
    # Write all datasets to CSV files
    for filename, data in datasets.items():
        write_csv_file(filename, data)
    
    print("=" * 60)
    print("Sample file generation completed!")
    print(f"Files created in 'samples' directory:")
    for filename in datasets.keys():
        print(f"  - {filename}")
    print("\nThese files can be used to test different batch processing types in IDXR.")

if __name__ == "__main__":
    main()