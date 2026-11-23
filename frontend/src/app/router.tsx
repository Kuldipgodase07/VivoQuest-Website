import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '../features/landing/LandingPage';
import { AuthPage } from '../features/auth/AuthPage';
import { RolePickerPage } from '../features/auth/RolePickerPage';
import { PatientWorkspace } from '../features/patient/PatientWorkspace';
import { CaregiverWorkspace } from '../features/caregiver/CaregiverWorkspace';
import { NurseWorkspace } from '../features/nurse/NurseWorkspace';
import { ClinicianWorkspace } from '../features/clinician/ClinicianWorkspace';
import { RemoteDeskWorkspace } from '../features/remote-desk/RemoteDeskWorkspace';
import { DischargePlannerWorkspace } from '../features/discharge-planner/DischargePlannerWorkspace';
import { HealthPlanWorkspace } from '../features/health-plan/HealthPlanWorkspace';
import { VaccinationWorkspace } from '../features/vaccination/VaccinationWorkspace';
import { MarketplaceWorkspace } from '../features/marketplace/MarketplaceWorkspace';
import { AdminWorkspace } from '../features/admin/AdminWorkspace';
import { RequireRole } from './guards/RequireRole';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public & Landing routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signin" element={<AuthPage />} />
        <Route path="/auth" element={<Navigate to="/signin" replace />} />
        <Route path="/role" element={<RolePickerPage />} />

        {/* Role-Restricted Workspaces */}
        <Route
          path="/patient"
          element={
            <RequireRole allowedRoles="patient">
              <PatientWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/caregiver"
          element={
            <RequireRole allowedRoles="caregiver">
              <CaregiverWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/nurse"
          element={
            <RequireRole allowedRoles="nurse">
              <NurseWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/clinician"
          element={
            <RequireRole allowedRoles="clinician">
              <ClinicianWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/remote-desk"
          element={
            <RequireRole allowedRoles="remote-desk">
              <RemoteDeskWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/discharge"
          element={
            <RequireRole allowedRoles="discharge-planner">
              <DischargePlannerWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/health-plan"
          element={
            <RequireRole allowedRoles="health-plan">
              <HealthPlanWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/vaccination"
          element={
            <RequireRole allowedRoles="vaccination">
              <VaccinationWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/marketplace"
          element={
            <RequireRole allowedRoles="marketplace">
              <MarketplaceWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole allowedRoles="admin">
              <AdminWorkspace />
            </RequireRole>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RequireRole allowedRoles="admin">
              <AdminWorkspace />
            </RequireRole>
          }
        />

        {/* Aliases for /workspace/:role */}
        <Route path="/workspace/patient" element={<Navigate to="/patient" replace />} />
        <Route path="/workspace/caregiver" element={<Navigate to="/caregiver" replace />} />
        <Route path="/workspace/nurse" element={<Navigate to="/nurse" replace />} />
        <Route path="/workspace/clinician" element={<Navigate to="/clinician" replace />} />
        <Route path="/workspace/remote-desk" element={<Navigate to="/remote-desk" replace />} />
        <Route path="/workspace/discharge-planner" element={<Navigate to="/discharge" replace />} />
        <Route path="/workspace/health-plan" element={<Navigate to="/health-plan" replace />} />
        <Route path="/workspace/vaccination" element={<Navigate to="/vaccination" replace />} />
        <Route path="/workspace/marketplace" element={<Navigate to="/marketplace" replace />} />
        <Route path="/workspace/admin" element={<Navigate to="/admin" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
