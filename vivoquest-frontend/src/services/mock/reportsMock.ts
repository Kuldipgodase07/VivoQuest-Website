export const reportMockData: Record<string, any> = {
  'patient-care': {
    id: "VQ-CS-108291",
    period: "01 Nov 2026 to 07 Nov 2026",
    initials: "PN",
    name: "Pooja Nair",
    line: "64 years · Female · MRN 94812 · Primary condition: Post-cardiac rehab",
    nurse: "Nurse Vandana Rao, RN",
    clinician: "Dr. Arvind Swaminathan, MD",
    kpis: [
      ["Medicine adherence", "96%", "On track", "ok"],
      ["Average blood pressure", "124/80", "Controlled", "ok"],
      ["Oxygen saturation", "98%", "Normal range", "ok"],
      ["Pain score", "1 / 10", "Improving", "ok"]
    ],
    sys: [124, 126, 122, 128, 124, 122, 120],
    dia: [80, 82, 78, 82, 80, 78, 76],
    meds: [
      { name: "Atorvastatin 20mg", dose: "1 tab", when: "Night", pct: 100, status: "On track", tone: "ok" },
      { name: "Metoprolol 25mg", dose: "1 tab", when: "Morning", pct: 95, status: "On track", tone: "ok" },
      { name: "Aspirin 75mg", dose: "1 tab", when: "After lunch", pct: 100, status: "On track", tone: "ok" }
    ],
    goals: [
      ["Walk 20 minutes a day", 85],
      ["Low-salt meals, 7 of 7 days", 95],
      ["Record vitals twice a day", 100]
    ],
    visits: [
      ["02 Nov 2026", "Nurse wellness visit"],
      ["04 Nov 2026", "Physiotherapy rehab session"],
      ["06 Nov 2026", "Clinician teleconsult review"]
    ],
    note: "Patient is recovering comfortably at home with steady vital indicators and excellent routine adherence."
  },
  'discharge': {
    id: "VQ-DS-409121",
    name: "Ramesh Kulkarni",
    line: "71 years · Male · MRN 88201",
    caregiver: "Sunita Kulkarni, +91 98201 44102",
    admitted: "28 Oct 2026",
    discharged: "04 Nov 2026",
    course: "Primary diagnosis: Post Total Knee Replacement. Surgery successful with zero post-op complications. Ambulating with walker assist.",
    checklist: [
      ["Medicines reconciled by pharmacist", 1],
      ["Caregiver trained on wound hygiene & mobility", 1],
      ["Home safety assessment completed", 1],
      ["Equipment ordered: Walker & Ice compression kit", 1],
      ["Follow-up visits scheduled", 1],
      ["Patient transportation confirmed", 1]
    ],
    timeline: [
      ["Day 1 (Discharge)", "Nurse home transition call & vitals check"],
      ["Day 2", "Nurse wound dressing & vital signs audit"],
      ["Day 5", "Physiotherapist range-of-motion session"],
      ["Day 10", "Clinician video check-in"],
      ["Day 14", "Suture removal and recovery milestone review"]
    ],
    changes: [
      ["Enoxaparin 40mg", "Once daily subcutaneous", "New", "ok", "Deep vein thrombosis prophylaxis for 14 days"],
      ["Paracetamol 650mg", "TID PRN", "Dose adjusted", "warn", "Pain management"]
    ],
    equipment: ["Lightweight folding walker · Delivered", "Cryotherapy compression wrap · Delivered"],
    warn: ["Calf pain, swelling or redness in lower extremities", "Fever over 101°F", "24/7 Care Desk: 1800-209-8486"]
  },
  'invoice': {
    id: "VQ-INV-992144",
    order: "VQ-884910",
    date: "15 Nov 2026",
    seller: ["VivoQuest Healthcare India Pvt. Ltd.", "Tower 4, Equinox Medical Tech Park, Mumbai", "GSTIN 27AAACV9841B1Z2"],
    buyer: ["Vikram Mehta", "Flat 902, Palm Heights, Powai, Mumbai", "vikram.m@example.com"],
    items: [
      { name: "Digital Blood Pressure Monitor (Bluetooth)", type: "Shipped", qty: 1, unit: 1899 },
      { name: "Pulse Oximeter Clinical Grade", type: "Shipped", qty: 1, unit: 999 },
      { name: "Home Nurse Clinical Visit (Comprehensive)", type: "Booked visit", qty: 2, unit: 799 }
    ],
    couponPct: 10,
    coupon: "VIVO10",
    shipping: 0,
    pay: [
      ["Gateway", "Razorpay"],
      ["Method", "UPI (Google Pay)"],
      ["Payment ID", "pay_Px79981240182"],
      ["Verification", "Signature verified", 1]
    ],
    next: "Medical equipment dispatched. Your home nurse visit is confirmed for tomorrow 10:00 AM."
  },
  'outcomes': {
    id: "VQ-OR-2026-Q4",
    period: "Quarter 4 2026",
    plan: "Apollo Munich ACO Population Health",
    by: "Clinical Quality Directorate",
    target: 8.5,
    fac: [
      { name: "Mumbai Metro Hub", n: 480, readmit: 5.8, adh: 97, chk: 92, csat: 4.9 },
      { name: "Bengaluru South Wing", n: 395, readmit: 6.4, adh: 95, chk: 89, csat: 4.8 },
      { name: "Delhi NCR Network", n: 440, readmit: 7.9, adh: 91, chk: 86, csat: 4.6 },
      { name: "Pune Care Cluster", n: 260, readmit: 8.2, adh: 88, chk: 84, csat: 4.5 }
    ],
    mon: [
      { m: "Jul", readmit: 10.2, chk: 81 },
      { m: "Aug", readmit: 9.1, chk: 83 },
      { m: "Sep", readmit: 8.4, chk: 85 },
      { m: "Oct", readmit: 7.6, chk: 88 },
      { m: "Nov", readmit: 6.9, chk: 90 },
      { m: "Dec", readmit: 6.1, chk: 92 }
    ],
    headline: "Hospital readmissions dropped 40% with continuous at-home clinical supervision.",
    summary: "Across 1,575 enrolled ACO lives, 30-day hospital readmissions dropped from 10.2% to 6.1%.",
    worked: "Standardized 48-hour post-discharge nurse visits prevented 68 emergency room escalations.",
    attention: "Pune cluster transit bottlenecks addressed with micro-dispatch hubs.",
    method: "Cohort includes Medicare Advantage and private health plan members post-discharge."
  },
  'payments': {
    period: "01 to 15 Nov 2026",
    by: "Finance & Accounting Desk",
    tx: [
      { date: "2026-11-01T04:30:00.000Z", order: "VQ-109201", gw: "Razorpay", method: "UPI", payId: "pay_A1982z", cur: "INR", amt: 1899, inr: 1899, status: "Captured", settled: "2026-11-02T10:00:00.000Z" },
      { date: "2026-11-03T07:15:00.000Z", order: "VQ-109214", gw: "Razorpay", method: "Card", payId: "pay_B4412x", cur: "INR", amt: 3499, inr: 3499, status: "Captured", settled: "2026-11-04T10:00:00.000Z" },
      { date: "2026-11-06T11:45:00.000Z", order: "VQ-109230", gw: "Stripe", method: "Card", payId: "pi_3Q81x9", cur: "USD", amt: 60, inr: 4980, status: "Captured", settled: "2026-11-08T10:00:00.000Z" }
    ],
    rf: [
      { date: "2026-11-09T15:00:00.000Z", order: "VQ-109245", gw: "Razorpay", id: "rfnd_99182a", amt: 1499, reason: "Customer duplicate payment", status: "Processed", expected: "2026-11-12T10:00:00.000Z" }
    ]
  }
};
