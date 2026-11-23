import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def score_caregiver(caregiver, patient_lat, patient_lon, required_skill):
    dist = haversine(patient_lat, patient_lon, caregiver['lat'], caregiver['lon'])
    has_skill = required_skill in caregiver['skills']
    
    # Distance penalty: 1 / (1 + dist)
    dist_score = 1.0 / (1.0 + dist * 0.2)
    skill_score = 1.0 if has_skill else 0.0
    rating_score = caregiver.get('rating', 5.0) / 5.0
    
    total_score = (dist_score * 0.5) + (skill_score * 0.3) + (rating_score * 0.2)
    return total_score
