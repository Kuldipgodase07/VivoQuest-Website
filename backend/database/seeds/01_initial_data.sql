-- Seed initial VivoQuest Healthcare Catalog
INSERT INTO services (category, name, description, base_price, duration_minutes, icon_svg) VALUES
('home-visit', 'Doctor Consultation at Home', 'Bedside clinical evaluation, vitals check, and prescription issuance.', 1200.00, 45, 'doctor-at-home.svg'),
('home-visit', 'General Nursing Care & Dressing', 'Sterile dressing, injections, catheter, and IV fluid administration.', 650.00, 30, 'nurse-procedure.svg'),
('long-term-care', '24/7 ICU at Home Setup', 'Hospital-grade critical care with ventilator and ICU-trained nurse monitoring.', 5500.00, 1440, 'icuathome.38973f71.svg'),
('home-diagnostics', 'Comprehensive Health Checkup (64 Parameters)', 'Complete hemogram, lipid panel, diabetes screen, kidney and liver function.', 1999.00, 30, 'comprehensive-health-checkup.svg'),
('rehab-services', 'Stroke & Neuro Rehabilitation', 'Specialized physical and neurological physiotherapy for mobility regaining.', 1600.00, 60, 'stroke.35e0eb66.svg');
