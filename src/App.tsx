import { Navigate, Route, Routes } from 'react-router-dom'
import { useSession } from '@/mvc/controllers'
import AppShell from '@/components/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import NotAuthorized from '@/components/NotAuthorized'
import NotFound from '@/components/NotFound'

import {
  HomePage,
  BarangayOfficialDashboardPage,
  BarangayOfficialIncidentDetailPage,
  BarangayOfficialIncidentMarksPage,
  EmergencyRespondersDashboardPage,
  EmergencyRespondersIncidentDetailPage,
  EmergencyRespondersIncidentMarksPage,
  LoginPage,
  RegisterPage,
  ResidentDashboardPage,
  ResidentIncidentCreatePage,
  ResidentIncidentDetailPage,
  SuperAdminDashboardPage,
  SuperAdminIncidentMarksPage,
  ResidentProfilePage,
  BarangayOfficialProfilePage,
  EmergencyRespondersProfilePage,
  SuperAdminProfilePage,
} from '@/mvc/views'

function defaultPathForRole(role: NonNullable<ReturnType<typeof useSession>['role']>) {
  switch (role) {
    case 'resident':
      return '/resident'
    case 'barangayOfficial':
      return '/barangay-official'
    case 'emergencyResponders':
      return '/emergency-responders'
    case 'superAdmin':
      return '/super-admin'
  }
}

export default function App() {
  const { user, role, isLoading } = useSession()
  if (isLoading) return null

  const defaultPath = user && role ? defaultPathForRole(role) : '/login'

  return (
    <Routes>
      <Route path="/" element={user && role ? <Navigate to={defaultPath} replace /> : <HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/not-authorized" element={<NotAuthorized />} />

      <Route element={<AppShell />}>
        <Route
          path="/resident"
          element={
            <ProtectedRoute allowedRoles={['resident']}>
              <ResidentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resident/incidents/new"
          element={
            <ProtectedRoute allowedRoles={['resident']}>
              <ResidentIncidentCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resident/incidents/:incidentId"
          element={
            <ProtectedRoute allowedRoles={['resident']}>
              <ResidentIncidentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resident/profile"
          element={
            <ProtectedRoute allowedRoles={['resident']}>
              <ResidentProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/barangay-official"
          element={
            <ProtectedRoute allowedRoles={['barangayOfficial']}>
              <BarangayOfficialDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/barangay-official/marks"
          element={
            <ProtectedRoute allowedRoles={['barangayOfficial']}>
              <BarangayOfficialIncidentMarksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/barangay-official/incidents/:incidentId"
          element={
            <ProtectedRoute allowedRoles={['barangayOfficial']}>
              <BarangayOfficialIncidentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/barangay-official/profile"
          element={
            <ProtectedRoute allowedRoles={['barangayOfficial']}>
              <BarangayOfficialProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emergency-responders"
          element={
            <ProtectedRoute allowedRoles={['emergencyResponders']}>
              <EmergencyRespondersDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency-responders/marks"
          element={
            <ProtectedRoute allowedRoles={['emergencyResponders']}>
              <EmergencyRespondersIncidentMarksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency-responders/incidents/:incidentId"
          element={
            <ProtectedRoute allowedRoles={['emergencyResponders']}>
              <EmergencyRespondersIncidentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/emergency-responders/profile"
          element={
            <ProtectedRoute allowedRoles={['emergencyResponders']}>
              <EmergencyRespondersProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={['superAdmin']}>
              <SuperAdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/marks"
          element={
            <ProtectedRoute allowedRoles={['superAdmin']}>
              <SuperAdminIncidentMarksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super-admin/profile"
          element={
            <ProtectedRoute allowedRoles={['superAdmin']}>
              <SuperAdminProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

