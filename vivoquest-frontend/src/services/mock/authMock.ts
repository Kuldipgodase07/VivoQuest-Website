import { UserSession, Role } from '../../types';

export interface RoleCredential {
  role: Role;
  title: string;
  phone: string;
  otp: string;
  name: string;
  description: string;
  allowedRoles: Role[];
  badgeColor: string;
}

export const ROLE_CREDENTIALS: RoleCredential[] = [
  {
    role: 'patient',
    title: 'Patient',
    phone: '9820011223',
    otp: '123456',
    name: 'Pooja Nair',
    description: 'Care recipient: care plans, vitals, appointments and health records',
    allowedRoles: ['patient'],
    badgeColor: '#18845B'
  },
  {
    role: 'caregiver',
    title: 'Caregiver',
    phone: '9820022334',
    otp: '123456',
    name: 'Sunita Kulkarni',
    description: 'Family / professional caregiver: home visits, daily tasks, notes',
    allowedRoles: ['caregiver'],
    badgeColor: '#7E62E4'
  },
  {
    role: 'nurse',
    title: 'Registered Nurse',
    phone: '9820033445',
    otp: '123456',
    name: 'Vandana Rao, RN',
    description: 'Field & facility nurse: vitals, shift handovers, medication log',
    allowedRoles: ['nurse'],
    badgeColor: '#0284C7'
  },
  {
    role: 'clinician',
    title: 'Clinician / Doctor',
    phone: '9820044556',
    otp: '123456',
    name: 'Dr. Arvind Swaminathan',
    description: 'Attending physician: orders, prescriptions, clinical reviews',
    allowedRoles: ['clinician'],
    badgeColor: '#4520B8'
  },
  {
    role: 'remote-desk',
    title: 'Remote Care Desk',
    phone: '9820055667',
    otp: '123456',
    name: 'Anita Deshmukh',
    description: 'Triage officer: remote vitals monitoring, SOS tickets & shifts',
    allowedRoles: ['remote-desk'],
    badgeColor: '#D97706'
  },
  {
    role: 'discharge-planner',
    title: 'Discharge Planner',
    phone: '9820066778',
    otp: '123456',
    name: 'Kavita Deshmukh',
    description: 'Transition coordinator: hospital discharge & readmission prevention',
    allowedRoles: ['discharge-planner'],
    badgeColor: '#059669'
  },
  {
    role: 'health-plan',
    title: 'Health Plan / ACO',
    phone: '9820077889',
    otp: '123456',
    name: 'Rajesh Varma',
    description: 'ACO Director: quality measures, cohorts & outcomes analytics',
    allowedRoles: ['health-plan'],
    badgeColor: '#4338CA'
  },
  {
    role: 'vaccination',
    title: 'Adult Vaccination',
    phone: '9820088990',
    otp: '123456',
    name: 'Priya Nair',
    description: 'Immunization officer: adult vaccine schedules & QR certificates',
    allowedRoles: ['vaccination'],
    badgeColor: '#2563EB'
  },
  {
    role: 'marketplace',
    title: 'Marketplace Seller',
    phone: '9820099001',
    otp: '123456',
    name: 'Rahul Sharma',
    description: 'Vendor partner: healthcare catalogue, orders, fulfillment',
    allowedRoles: ['marketplace'],
    badgeColor: '#EA580C'
  },
  {
    role: 'admin',
    title: 'System Administrator',
    phone: '9820000000',
    otp: '123456',
    name: 'Super Administrator',
    description: 'Full platform access: compliance, finance, approvals and audit logs',
    allowedRoles: ['admin', 'patient', 'caregiver', 'nurse', 'clinician', 'remote-desk', 'discharge-planner', 'health-plan', 'vaccination', 'marketplace'],
    badgeColor: '#DC2626'
  }
];

export const mockUsers: Record<Role, UserSession> = {
  patient: { id: "usr_pat_01", phone: "9820011223", name: "Pooja Nair", role: "patient", roles: ['patient'], isAuthenticated: true },
  caregiver: { id: "usr_cg_01", phone: "9820022334", name: "Sunita Kulkarni", role: "caregiver", roles: ['caregiver'], isAuthenticated: true },
  nurse: { id: "usr_nr_01", phone: "9820033445", name: "Vandana Rao, RN", role: "nurse", roles: ['nurse'], isAuthenticated: true },
  clinician: { id: "usr_cl_01", phone: "9820044556", name: "Dr. Arvind Swaminathan", role: "clinician", roles: ['clinician'], isAuthenticated: true },
  'remote-desk': { id: "usr_rd_01", phone: "9820055667", name: "Anita Deshmukh", role: "remote-desk", roles: ['remote-desk'], isAuthenticated: true },
  'discharge-planner': { id: "usr_dp_01", phone: "9820066778", name: "Kavita Deshmukh", role: "discharge-planner", roles: ['discharge-planner'], isAuthenticated: true },
  'health-plan': { id: "usr_hp_01", phone: "9820077889", name: "Rajesh Varma", role: "health-plan", roles: ['health-plan'], isAuthenticated: true },
  vaccination: { id: "usr_vc_01", phone: "9820088990", name: "Priya Nair", role: "vaccination", roles: ['vaccination'], isAuthenticated: true },
  marketplace: { id: "usr_mp_01", phone: "9820099001", name: "Rahul Sharma", role: "marketplace", roles: ['marketplace'], isAuthenticated: true },
  admin: {
    id: "usr_adm_01",
    phone: "9820000000",
    name: "Super Administrator",
    role: "admin",
    roles: ['admin', 'patient', 'caregiver', 'nurse', 'clinician', 'remote-desk', 'discharge-planner', 'health-plan', 'vaccination', 'marketplace'],
    isAuthenticated: true
  }
};
