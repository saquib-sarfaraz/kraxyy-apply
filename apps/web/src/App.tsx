import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PublicLayout } from './layouts/PublicLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage';

// Authenticated Candidate Pages
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ResumesPage } from './pages/resumes/ResumesPage';
import { ApplicationsPage } from './pages/applications/ApplicationsPage';
import { JobMatchPage } from './pages/match/JobMatchPage';
import { SavedJobsPage } from './pages/jobs/SavedJobsPage';
import { ExtensionCompanionPage } from './pages/extension/ExtensionCompanionPage';
import { SettingsPage } from './pages/settings/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-olive"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  React.useEffect(() => {
    const purge = () => {
      const el = document.getElementById('kraxyy-inpage-assistant');
      if (el) el.remove();
      const pill = document.getElementById('kraxyy-pill');
      if (pill) pill.remove();
    };
    purge();
    const observer = new MutationObserver(purge);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/privacy" element={<LandingPage />} />
            <Route path="/terms" element={<LandingPage />} />
            <Route path="/contact" element={<LandingPage />} />
          </Route>

          {/* Authenticated User Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/match" element={<JobMatchPage />} />
            <Route path="/jobs" element={<Navigate to="/match" replace />} />
            <Route path="/saved-jobs" element={<SavedJobsPage />} />
            <Route path="/resumes" element={<ResumesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/applications" element={<ApplicationsPage />} />
            <Route path="/extension" element={<ExtensionCompanionPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
