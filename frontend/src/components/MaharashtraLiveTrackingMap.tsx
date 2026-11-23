import React, { useState, useEffect } from 'react';

export interface TrackingUnit {
  id: string;
  name: string;
  role: 'Nurse' | 'Ambulance' | 'Clinician' | 'Vaccine Van' | 'Delivery';
  regionKey: 'Pune' | 'Konkan' | 'Nashik' | 'Amaravati' | 'Nagpur' | 'Aurangabad';
  route: string;
  fromCoords: [number, number];
  toCoords: [number, number];
  progress: number; // 0 to 1
  speed: string;
  eta: string;
  destination: string;
  patientName: string;
  status: 'In Transit' | 'En Route' | 'Priority' | 'Arrived';
  icon: string;
  color: string;
}

export interface RegionData {
  key: 'Pune' | 'Konkan' | 'Nashik' | 'Amaravati' | 'Nagpur' | 'Aurangabad';
  title: string;
  subTitle: string;
  pct: number;
  visits: string;
  members: string;
  response: string;
  districts: string;
  color: string;
  hubCoords: [number, number];
}

// 6 Official Administrative Divisions of Maharashtra as per Official Administrative Map
export const MAHARASHTRA_DIVISIONS: Record<string, RegionData> = {
  Pune: {
    key: 'Pune',
    title: 'Western Maharashtra',
    subTitle: 'Pune Division',
    pct: 97,
    visits: '412',
    members: '4,820',
    response: '3.6 min',
    districts: 'Pune, Satara, Sangli, Kolhapur, Solapur',
    color: '#4520B8',
    hubCoords: [686, 1319]
  },
  Konkan: {
    key: 'Konkan',
    title: 'Konkan',
    subTitle: 'Konkan Division',
    pct: 96,
    visits: '318',
    members: '2,940',
    response: '4.0 min',
    districts: 'Mumbai City, Mumbai Suburban, Thane, Palghar, Raigad, Ratnagiri, Sindhudurg',
    color: '#5B33D6',
    hubCoords: [477, 1048]
  },
  Nashik: {
    key: 'Nashik',
    title: 'North Maharashtra',
    subTitle: 'Nashik Division',
    pct: 94,
    visits: '224',
    members: '2,120',
    response: '4.6 min',
    districts: 'Nashik, Dhule, Nandurbar, Jalgaon, Ahmadnagar',
    color: '#7E62E4',
    hubCoords: [717, 764]
  },
  Amaravati: {
    key: 'Amaravati',
    title: 'Vidarbha (West)',
    subTitle: 'Amaravati Division',
    pct: 92,
    visits: '176',
    members: '1,860',
    response: '5.1 min',
    districts: 'Amaravati, Akola, Buldhana, Washim, Yavatmal',
    color: '#8E5CFF',
    hubCoords: [1866, 510]
  },
  Nagpur: {
    key: 'Nagpur',
    title: 'Vidarbha (East)',
    subTitle: 'Nagpur Division',
    pct: 91,
    visits: '188',
    members: '1,340',
    response: '5.4 min',
    districts: 'Nagpur, Wardha, Bhandara, Gondia, Chandrapur, Gadchiroli',
    color: '#A78BFA',
    hubCoords: [2391, 447]
  },
  Aurangabad: {
    key: 'Aurangabad',
    title: 'Marathwada',
    subTitle: 'Aurangabad Division',
    pct: 89,
    visits: '152',
    members: '1,520',
    response: '6.2 min',
    districts: 'Aurangabad, Jalna, Beed, Parbhani, Hingoli, Nanded, Latur, Usmanabad',
    color: '#C4B5FD',
    hubCoords: [1029, 856]
  }
};

// District Node Coordinates matched to Official Administrative Map (viewBox 10 80 3070 2180)
// No duplicate text rendered over SVG: each city appears exactly once on the map.
export const DISTRICT_HUBS = [
  { name: 'Mumbai', x: 120, y: 1261, division: 'Konkan' },
  { name: 'Thane', x: 477, y: 1048, division: 'Konkan' },
  { name: 'Pune', x: 686, y: 1319, division: 'Pune' },
  { name: 'Nashik', x: 717, y: 764, division: 'Nashik' },
  { name: 'Ahmadnagar', x: 869, y: 1047, division: 'Nashik' },
  { name: 'Aurangabad', x: 1029, y: 856, division: 'Aurangabad' },
  { name: 'Jalgaon', x: 1177, y: 550, division: 'Nashik' },
  { name: 'Dhule', x: 900, y: 496, division: 'Nashik' },
  { name: 'Satara', x: 731, y: 1647, division: 'Pune' },
  { name: 'Kolhapur', x: 740, y: 2073, division: 'Pune' },
  { name: 'Sangli', x: 906, y: 1842, division: 'Pune' },
  { name: 'Solapur', x: 1157, y: 1596, division: 'Pune' },
  { name: 'Jalna', x: 1363, y: 936, division: 'Aurangabad' },
  { name: 'Nanded', x: 1823, y: 1224, division: 'Aurangabad' },
  { name: 'Latur', x: 1649, y: 1413, division: 'Aurangabad' },
  { name: 'Buldhana', x: 1457, y: 690, division: 'Amaravati' },
  { name: 'Akola', x: 1714, y: 590, division: 'Amaravati' },
  { name: 'Amaravati', x: 1866, y: 510, division: 'Amaravati' },
  { name: 'Wardha', x: 2237, y: 610, division: 'Nagpur' },
  { name: 'Nagpur', x: 2391, y: 447, division: 'Nagpur' },
  { name: 'Chandrapur', x: 2451, y: 767, division: 'Nagpur' }
];

// Active Transit Highways (Expressed in official map coordinate system)
export const HIGHWAY_CORRIDORS = [
  { name: 'Mumbai - Pune Expressway', path: 'M120,1261 L477,1048 L686,1319' },
  { name: 'Pune - Kolhapur NH-48 Corridor', path: 'M686,1319 L731,1647 L740,2073' },
  { name: 'Mumbai - Nashik - Dhule NH-60', path: 'M120,1261 L717,764 L900,496 L1177,550' },
  { name: 'Pune - Nagar - Sambhajinagar', path: 'M686,1319 L869,1047 L1029,856 L1363,936' },
  { name: 'Samruddhi Mahamarg (Aurangabad - Nagpur)', path: 'M1029,856 L1457,690 L1714,590 L1866,510 L2237,610 L2391,447' },
  { name: 'Pune - Solapur - Marathwada', path: 'M686,1319 L1157,1596 L1649,1413 L1823,1224' },
  { name: 'Nagpur - Chandrapur Highway', path: 'M2391,447 L2451,767' }
];

// Real-Time Fleet Units Traversing Maharashtra
const INITIAL_UNITS: TrackingUnit[] = [
  {
    id: 'MH-12-RN-402',
    name: 'Nurse Vandana Rao, RN',
    role: 'Nurse',
    regionKey: 'Pune',
    route: 'Mumbai ↔ Pune Expressway',
    fromCoords: [120, 1261],
    toCoords: [686, 1319],
    progress: 0.68,
    speed: '48 km/h',
    eta: '6 min',
    destination: 'Baner Care Center, Pune (Pooja Nair)',
    patientName: 'Pooja Nair',
    status: 'En Route',
    icon: '🩺',
    color: '#10B981'
  },
  {
    id: 'MH-14-AMB-108',
    name: 'ICU Ambulance #12',
    role: 'Ambulance',
    regionKey: 'Pune',
    route: 'Pune ↔ Hadapsar Emergency Link',
    fromCoords: [686, 1319],
    toCoords: [869, 1047],
    progress: 0.38,
    speed: '66 km/h',
    eta: '4 min',
    destination: 'Kothrud Critical Triage',
    patientName: 'Kamal Deshmukh',
    status: 'Priority',
    icon: '🚑',
    color: '#EF4444'
  },
  {
    id: 'MH-15-VC-09',
    name: 'Cold-Chain Vaccine Van',
    role: 'Vaccine Van',
    regionKey: 'Nashik',
    route: 'Nashik ↔ Dhule Medical Hub',
    fromCoords: [717, 764],
    toCoords: [900, 496],
    progress: 0.54,
    speed: '52 km/h',
    eta: '16 min',
    destination: 'Panchavati Rural Health Hub',
    patientName: 'Vaccine Batch #914',
    status: 'In Transit',
    icon: '💉',
    color: '#3B82F6'
  },
  {
    id: 'MH-31-CL-03',
    name: 'Dr. Arvind Swaminathan',
    role: 'Clinician',
    regionKey: 'Nagpur',
    route: 'Nagpur Central ↔ Wardha Corridor',
    fromCoords: [2391, 447],
    toCoords: [2237, 610],
    progress: 0.76,
    speed: '45 km/h',
    eta: '9 min',
    destination: 'Wardha Elder Care Wing',
    patientName: 'Suresh Patil',
    status: 'En Route',
    icon: '👨‍⚕️',
    color: '#8B5CF6'
  },
  {
    id: 'MH-20-EQ-16',
    name: 'Oxygen Concentrator Courier',
    role: 'Delivery',
    regionKey: 'Aurangabad',
    route: 'Pune ↔ Sambhajinagar Expressway',
    fromCoords: [686, 1319],
    toCoords: [1029, 856],
    progress: 0.45,
    speed: '60 km/h',
    eta: '22 min',
    destination: 'Jalna Road Medical Center',
    patientName: 'Sunita Kulkarni',
    status: 'In Transit',
    icon: '📦',
    color: '#F59E0B'
  },
  {
    id: 'MH-09-RN-205',
    name: 'Phlebotomist Anita Deshmukh',
    role: 'Nurse',
    regionKey: 'Pune',
    route: 'Satara ↔ Kolhapur Care Highway',
    fromCoords: [731, 1647],
    toCoords: [740, 2073],
    progress: 0.84,
    speed: '40 km/h',
    eta: '5 min',
    destination: 'Rajarampuri Clinic, Kolhapur',
    patientName: 'Lata Joshi',
    status: 'En Route',
    icon: '🩸',
    color: '#10B981'
  },
  {
    id: 'MH-27-SM-88',
    name: 'Samruddhi Mobile ICU #4',
    role: 'Ambulance',
    regionKey: 'Amaravati',
    route: 'Amaravati ↔ Akola Super Corridor',
    fromCoords: [1866, 510],
    toCoords: [1714, 590],
    progress: 0.42,
    speed: '72 km/h',
    eta: '8 min',
    destination: 'Akola District Trauma Wing',
    patientName: 'Rameshwar Kale',
    status: 'Priority',
    icon: '🚑',
    color: '#EF4444'
  }
];

export const MaharashtraLiveTrackingMap: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [selectedRegionKey, setSelectedRegionKey] = useState<string>('Pune');
  const [units, setUnits] = useState<TrackingUnit[]>(INITIAL_UNITS);
  const [activeUnit, setActiveUnit] = useState<TrackingUnit | null>(INITIAL_UNITS[0]);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live simulation tick: smoothly moves active units along their routes
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setUnits(prev =>
        prev.map(u => {
          let nextProg = u.progress + 0.025 * simSpeed;
          let newStatus = u.status;
          if (nextProg >= 1) {
            nextProg = 0; // seamless round-trip loop
            newStatus = u.status === 'Priority' ? 'Priority' : 'In Transit';
          }
          return {
            ...u,
            progress: nextProg,
            status: newStatus
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const handleSpawnDispatch = () => {
    const curDiv = MAHARASHTRA_DIVISIONS[selectedRegionKey] || MAHARASHTRA_DIVISIONS.Pune;
    const newUnit: TrackingUnit = {
      id: `MH-SOS-${Math.floor(100 + Math.random() * 900)}`,
      name: `Emergency Response Unit (${curDiv.subTitle})`,
      role: 'Ambulance',
      regionKey: curDiv.key,
      route: `${curDiv.title} Priority Life Corridor`,
      fromCoords: [curDiv.hubCoords[0] - 120, curDiv.hubCoords[1] - 80],
      toCoords: [curDiv.hubCoords[0] + 120, curDiv.hubCoords[1] + 90],
      progress: 0.1,
      speed: '75 km/h',
      eta: '3 min',
      destination: `${curDiv.districts.split(',')[0]} SOS Emergency`,
      patientName: 'Critical Patient SOS',
      status: 'Priority',
      icon: '🚨',
      color: '#EF4444'
    };
    setUnits(prev => [newUnit, ...prev]);
    setActiveUnit(newUnit);
    showToast(`🚨 Priority Care Unit Dispatched to ${curDiv.subTitle} (${curDiv.title})!`);
  };

  const cur = MAHARASHTRA_DIVISIONS[selectedRegionKey] || MAHARASHTRA_DIVISIONS.Pune;

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '24px',
      padding: compact ? '20px' : '32px',
      boxShadow: '0 1px 2px rgba(23, 20, 58, 0.05), 0 10px 28px rgba(69, 32, 184, 0.07)',
      border: '1px solid #E6E2F0',
      fontFamily: "'Manrope', 'Poppins', system-ui, sans-serif",
      position: 'relative'
    }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#17143A',
          color: '#FFFFFF',
          padding: '10px 20px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 700,
          boxShadow: '0 8px 24px rgba(23, 20, 58, 0.25)',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {toastMessage}
        </div>
      )}

      {/* Header (Matches user screenshot: Region performance · Maharashtra) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '22px',
            fontWeight: 800,
            color: '#17143A',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>Region performance · Maharashtra</span>
          </h2>
          <p style={{
            margin: '4px 0 0',
            fontSize: '13px',
            color: '#667085',
            fontWeight: 500
          }}>
            Visits completed on time. Tap an administrative region for details
          </p>
        </div>

        {/* Legend Pills (Matches user screenshot palette) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: '12px',
          fontWeight: 700,
          color: '#17143A',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4520B8' }}></span>
            <span>96%+</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#5B33D6' }}></span>
            <span>93–95%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#8E5CFF' }}></span>
            <span>90–92%</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#C4B5FD' }}></span>
            <span>Below 90%</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Official Maharashtra Map (Large, NO background box) + Right KPI & Region Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: compact ? '1fr' : '1.6fr 1fr',
        gap: '32px',
        alignItems: 'center'
      }}>
        {/* Left Side: Clean Maharashtra Map without background box */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          padding: 0
        }}>
          {/* Simulation Controls (Neatly placed) */}
          <div style={{
            position: 'absolute',
            top: '0px',
            right: '0px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            padding: '4px 8px',
            borderRadius: '10px',
            border: '1px solid #E6E2F0',
            fontSize: '11px',
            fontWeight: 700
          }}>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              style={{
                background: isSimulating ? '#DDF3EA' : '#FEE2E2',
                color: isSimulating ? '#18845B' : '#DC2626',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontWeight: 800
              }}
            >
              {isSimulating ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              onClick={() => setSimSpeed(s => (s === 1 ? 2 : s === 2 ? 5 : 1))}
              style={{
                background: '#EAE4FF',
                color: '#4520B8',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 8px',
                cursor: 'pointer',
                fontWeight: 800
              }}
            >
              {simSpeed}x Speed
            </button>
          </div>

          {/* Large Focused Vector Map Layer: Tight-fitted viewBox="10 80 3070 2180" */}
          <div style={{ position: 'relative', width: '100%' }}>
            <svg
              viewBox="10 80 3070 2180"
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              {/* Base Layer: Official Themed Administrative Map (Tight-cropped, NO ocean background, NO internal legend) */}
              <image
                href="/maharashtra-themed.svg"
                x="10"
                y="80"
                width="3070"
                height="2180"
                preserveAspectRatio="xMidYMid meet"
              />

              {/* Highway Transit Corridors */}
              <g stroke="#4520B8" strokeWidth="9" strokeDasharray="20 14" opacity="0.45" fill="none">
                {HIGHWAY_CORRIDORS.map(h => (
                  <path key={h.name} d={h.path}>
                    <title>{h.name}</title>
                  </path>
                ))}
              </g>

              {/* Major District Waypoint Dots (Clickable nodes - NO DUPLICATE TEXT to prevent overlapping) */}
              {DISTRICT_HUBS.map(hub => {
                const isSelectedDiv = cur.key === hub.division;
                return (
                  <g
                    key={hub.name}
                    transform={`translate(${hub.x}, ${hub.y})`}
                    onClick={() => setSelectedRegionKey(hub.division)}
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{`${hub.name} (${hub.division} Division)`}</title>
                    <circle
                      r={isSelectedDiv ? 18 : 12}
                      fill="#FFFFFF"
                      stroke={isSelectedDiv ? '#4520B8' : '#6D42E8'}
                      strokeWidth={isSelectedDiv ? 5 : 3.5}
                      style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))' }}
                    />
                    <circle
                      r={isSelectedDiv ? 8 : 5}
                      fill={isSelectedDiv ? '#4520B8' : '#5B33D6'}
                    />
                  </g>
                );
              })}

              {/* Simulated Live GPS Moving Vehicles traversing Maharashtra */}
              {units.map(u => {
                const curX = u.fromCoords[0] + (u.toCoords[0] - u.fromCoords[0]) * u.progress;
                const curY = u.fromCoords[1] + (u.toCoords[1] - u.fromCoords[1]) * u.progress;
                const isUnitActive = activeUnit?.id === u.id;

                return (
                  <g
                    key={u.id}
                    transform={`translate(${curX}, ${curY})`}
                    onClick={e => {
                      e.stopPropagation();
                      setActiveUnit(u);
                      setSelectedRegionKey(u.regionKey);
                      showToast(`${u.icon} Tracking ${u.name} (${u.speed}, ETA ${u.eta})`);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Animated Radar Pulse Ring */}
                    <circle
                      r="40"
                      fill="none"
                      stroke={u.color}
                      strokeWidth="8"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="r"
                        values="20;75;20"
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.9;0;0.9"
                        dur="2.2s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Pin Background */}
                    <circle
                      r={isUnitActive ? 42 : 32}
                      fill="#FFFFFF"
                      stroke={u.color}
                      strokeWidth={isUnitActive ? 10 : 7}
                      style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.35))' }}
                    />

                    {/* Emoji / Glyph centered */}
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={isUnitActive ? 46 : 36}
                    >
                      {u.icon}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Unit Telemetry Bar below the map */}
          {activeUnit && (
            <div style={{
              marginTop: '16px',
              width: '100%',
              background: '#F9F8FE',
              borderRadius: '14px',
              padding: '12px 18px',
              border: '1px solid #ECE7FB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '26px' }}>{activeUnit.icon}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#17143A' }}>
                    {activeUnit.name} ({activeUnit.id})
                  </div>
                  <div style={{ fontSize: '11px', color: '#667085', fontWeight: 600 }}>
                    {activeUnit.route} · Speed: <strong>{activeUnit.speed}</strong> · ETA: <strong style={{ color: '#18845B' }}>{activeUnit.eta}</strong>
                  </div>
                </div>
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '6px',
                background: activeUnit.status === 'Priority' ? '#FEE2E2' : '#DDF3EA',
                color: activeUnit.status === 'Priority' ? '#DC2626' : '#18845B'
              }}>
                {activeUnit.status}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Region Performance Card & Progress Bars (Matches screenshot) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Main KPI Card for Selected Region */}
          <div style={{
            background: '#F7F5FF',
            borderRadius: '18px',
            padding: '24px',
            border: '1px solid #ECE7FB'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: '#4520B8'
              }}>
                {cur.title.toUpperCase()}
              </div>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#667085',
                background: '#EAE4FF',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {cur.subTitle}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '42px', fontWeight: 800, color: '#17143A', letterSpacing: '-0.03em' }}>
                {cur.pct}%
              </span>
              <span style={{ fontSize: '15px', color: '#667085', fontWeight: 600 }}>
                visits on time
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              paddingBottom: '16px',
              borderBottom: '1px solid #EAE4FF'
            }}>
              <div>
                <div style={{ fontSize: '12px', color: '#667085', fontWeight: 600 }}>Visits today</div>
                <div style={{ fontSize: '19px', fontWeight: 800, color: '#17143A', marginTop: '2px' }}>{cur.visits}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#667085', fontWeight: 600 }}>Members</div>
                <div style={{ fontSize: '19px', fontWeight: 800, color: '#17143A', marginTop: '2px' }}>{cur.members}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#667085', fontWeight: 600 }}>Response</div>
                <div style={{ fontSize: '19px', fontWeight: 800, color: '#17143A', marginTop: '2px' }}>{cur.response}</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#667085', fontWeight: 500, marginTop: '14px', lineHeight: 1.5 }}>
              <strong style={{ color: '#17143A' }}>Districts covered:</strong> {cur.districts}
            </div>
          </div>

          {/* 6 Administrative Regions Progress Bars List (Clickable to switch region) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Object.values(MAHARASHTRA_DIVISIONS)
              .sort((a, b) => b.pct - a.pct)
              .map(r => {
                const isSelected = selectedRegionKey === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => setSelectedRegionKey(r.key)}
                    style={{
                      background: isSelected ? '#FFFFFF' : 'transparent',
                      border: isSelected ? '1.5px solid #4520B8' : '1px solid transparent',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      boxShadow: isSelected ? '0 4px 14px rgba(69, 32, 184, 0.12)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isSelected ? '#4520B8' : '#17143A',
                      marginBottom: '6px'
                    }}>
                      <span>{r.title} <span style={{ fontSize: '11px', color: '#667085', fontWeight: 500 }}>({r.subTitle})</span></span>
                      <span style={{ fontWeight: 800 }}>{r.pct}%</span>
                    </div>
                    {/* Progress Bar (Matches screenshot with VivoQuest theme gradient) */}
                    <div style={{
                      height: '8px',
                      background: '#EAE4FF',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${r.pct}%`,
                        height: '100%',
                        background: r.color,
                        borderRadius: '999px'
                      }}></div>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Emergency Dispatch Action Button */}
          <button
            onClick={handleSpawnDispatch}
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: '#4520B8',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(69, 32, 184, 0.25)',
              transition: 'background 0.15s ease'
            }}
          >
            <span>🚨</span>
            Simulate Emergency Dispatch in {cur.title}
          </button>
        </div>
      </div>
    </div>
  );
};
