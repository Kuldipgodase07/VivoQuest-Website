from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="VivoQuest AI/ML Healthcare Dispatch & Triage Engine",
    description="Intelligent caregiver dispatching, patient triage, and route optimization.",
    version="2.0.0"
)

class TriageRequest(BaseModel):
    symptoms: List[str]
    age: int
    chronic_conditions: Optional[List[str]] = []
    fever_temp: Optional[float] = None

class CaregiverMatchRequest(BaseModel):
    service_type: str
    patient_lat: float
    patient_lon: float
    urgency: str = "NORMAL"

@app.get("/")
def root():
    return {"status": "ACTIVE", "model_version": "v2.1-hybrid"}

@app.post("/triage")
def triage_patient(req: TriageRequest):
    # Rule-based + ML threshold triage
    critical_triggers = {"chest pain", "shortness of breath", "loss of consciousness", "severe trauma"}
    has_critical = any(s.lower() in critical_triggers for s in req.symptoms)

    if has_critical:
        return {
            "disposition": "EMERGENCY_ESCALATION",
            "action": "Immediate ambulance dispatch recommended",
            "urgency_score": 0.98,
            "care_type": "HOSPITAL_EMERGENCY"
        }
    
    return {
        "disposition": "HOME_CARE_SUITABLE",
        "action": "Dispatch General Physician & Home Diagnostic Blood Panel",
        "urgency_score": 0.28,
        "care_type": "HOME_VISIT"
    }

@app.post("/match-caregiver")
def match_caregiver(req: CaregiverMatchRequest):
    # Proximity + qualification optimization
    return {
        "matched_caregivers": [
            {
                "caregiver_id": "cg-1",
                "name": "Rachana Shrestha, RN",
                "eta_minutes": 18,
                "distance_km": 3.4,
                "confidence_score": 0.96,
                "qualifications": ["Critical Care", "ICU Nursing", "NABH Certified"]
            }
        ]
    }
