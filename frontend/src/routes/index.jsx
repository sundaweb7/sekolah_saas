import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Loader Component for Suspense
const SuspenseLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#08060d] text-white">
    <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
  </div>
);

// HOC for lazy loading with Suspense
const withSuspense = (LazyComponent) => (props) => (
  <Suspense fallback={<SuspenseLoader />}>
    <LazyComponent {...props} />
  </Suspense>
);

function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) return <SuspenseLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    const homeByRole = {
      superadmin: '/superadmin',
      admin: '/admin',
      teacher: '/teacher',
      parent: '/parent',
    };
    return <Navigate to={homeByRole[user.role] || '/'} replace />;
  }

  return children;
}

// Lazy Loaded Pages
const Login = withSuspense(lazy(() => import('../pages/auth/Login')));
const ForgotPassword = withSuspense(lazy(() => import('../pages/auth/ForgotPassword')));
const ResetPassword = withSuspense(lazy(() => import('../pages/auth/ResetPassword')));
const Profile = withSuspense(lazy(() => import('../pages/dashboard/Profile')));
const StudentsList = withSuspense(lazy(() => import('../pages/admin/students/StudentsList')));
const WebsiteEditor = withSuspense(lazy(() => import('../pages/admin/website/WebsiteEditor')));
const NewsManager = withSuspense(lazy(() => import('../pages/admin/website/NewsManager')));
const DomainManager = withSuspense(lazy(() => import('../pages/admin/website/DomainManager')));
const ClassList = withSuspense(lazy(() => import('../pages/admin/classes/ClassList')));
const UserManager = withSuspense(lazy(() => import('../pages/admin/users/UserManager')));
const TeacherList = withSuspense(lazy(() => import('../pages/admin/teachers/TeacherList')));
const SppManager = withSuspense(lazy(() => import('../pages/admin/spp/SppManager')));
const ReportManager = withSuspense(lazy(() => import('../pages/admin/reports/ReportManager')));
const AttendanceJournalManager = withSuspense(lazy(() => import('../pages/admin/reports/AttendanceJournalManager')));
const AttendanceAnalytics = withSuspense(lazy(() => import('../pages/admin/reports/AttendanceAnalytics')));
const Accreditation = withSuspense(lazy(() => import('../pages/admin/Accreditation')));
const ESurat = withSuspense(lazy(() => import('../pages/admin/ESurat')));
const GalleryManager = withSuspense(lazy(() => import('../pages/admin/GalleryManager')));
const EventManager = withSuspense(lazy(() => import('../pages/admin/EventManager')));
const ExtracurricularManager = withSuspense(lazy(() => import('../pages/admin/ExtracurricularManager')));
const KbmScheduleManager = withSuspense(lazy(() => import('../pages/admin/KbmScheduleManager')));
const CommunicationCenter = withSuspense(lazy(() => import('../pages/communication/CommunicationCenter')));
const AttendanceKiosk = withSuspense(lazy(() => import('../pages/kiosk/AttendanceKiosk')));

const SchoolHome = withSuspense(lazy(() => import('../pages/public/SchoolHome')));
const SchoolNewsList = withSuspense(lazy(() => import('../pages/public/SchoolNewsList')));
const SchoolNewsDetail = withSuspense(lazy(() => import('../pages/public/SchoolNewsDetail')));
const SchoolPageDetail = withSuspense(lazy(() => import('../pages/public/SchoolPageDetail')));
const PpdbRegistrationForm = withSuspense(lazy(() => import('../pages/public/PpdbRegistrationForm')));
const PpdbStatusTracker = withSuspense(lazy(() => import('../pages/public/PpdbStatusTracker')));
const PpdbAdminDashboard = withSuspense(lazy(() => import('../pages/admin/ppdb/PpdbAdminDashboard')));
const AdminDashboard = withSuspense(lazy(() => import('../pages/admin/AdminDashboard')));
const BillingOverview = withSuspense(lazy(() => import('../pages/admin/billing/BillingOverview')));
const BillingCheckout = withSuspense(lazy(() => import('../pages/admin/billing/BillingCheckout')));
const LandingPage = withSuspense(lazy(() => import('../pages/public/LandingPage')));
const PrivacyPolicy = withSuspense(lazy(() => import('../pages/public/PrivacyPolicy')));

const SuperAdminDashboard = withSuspense(lazy(() => import('../pages/superadmin/SuperAdminDashboard')));
const TeacherDashboard = withSuspense(lazy(() => import('../pages/teacher/TeacherDashboard')));
const ParentDashboard = withSuspense(lazy(() => import('../pages/parent/ParentDashboard')));

import AdminLayout from '../layouts/AdminLayout';

function SubdomainRoot() {
  const host = window.location.hostname;
  const subdomain = host.split('.')[0];

  const isSaasMain = 
    subdomain === 'localhost' || 
    subdomain === '127' || 
    subdomain === 'paudku' || 
    subdomain === 'koola' ||
    host === 'paudku.local' || 
    host === 'koola.local' ||
    host === 'paudku.id' ||
    host === 'koola.id' ||
    host === 'pusdatin.my.id' ||
    host.endsWith('pusdatin.my.id.local');

  if (isSaasMain) {
    return <LandingPage />;
  }

  return <SchoolHome />;
}

function CommunicationRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}/communication`} replace />;
}

const router = createBrowserRouter([
  // SaaS Landing page / Subdomain dynamic resolver root
  {
    path: '/',
    element: <SubdomainRoot />,
  },
  // Direct access paths on Tenant Subdomain
  {
    path: '/ppdb',
    element: <PpdbRegistrationForm />,
  },
  {
    path: '/ppdb/status',
    element: <PpdbStatusTracker />,
  },
  {
    path: '/news',
    element: <SchoolNewsList />,
  },
  {
    path: '/news/:slug',
    element: <SchoolNewsDetail />,
  },
  // Dynamic Tenant Web (simulated fallback for localhost testing)
  {
    path: '/school/:schoolSlug',
    element: <SchoolHome />,
  },
  {
    path: '/school/:schoolSlug/news',
    element: <SchoolNewsList />,
  },
  {
    path: '/school/:schoolSlug/news/:slug',
    element: <SchoolNewsDetail />,
  },
  {
    path: '/school/:schoolSlug/page/:slug',
    element: <SchoolPageDetail />,
  },
  {
    path: '/school/:schoolSlug/ppdb',
    element: <PpdbRegistrationForm />,
  },
  {
    path: '/school/:schoolSlug/ppdb/status',
    element: <PpdbStatusTracker />,
  },
  // Auth Routes
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/privacy',
    element: <PrivacyPolicy />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  
  // SaaS Super Admin
  {
    path: '/superadmin',
    element: <ProtectedRoute roles={['superadmin']}><SuperAdminDashboard /></ProtectedRoute>,
  },
  // School Admin Panel
  {
    path: '/admin',
    element: <AdminLayout><AdminDashboard /></AdminLayout>,
  },
  {
    path: '/admin/students',
    element: <AdminLayout><StudentsList /></AdminLayout>,
  },
  {
    path: '/admin/teachers',
    element: <AdminLayout><TeacherList /></AdminLayout>,
  },
  {
    path: '/admin/classes',
    element: <AdminLayout><ClassList /></AdminLayout>,
  },
  {
    path: '/admin/reports',
    element: <AdminLayout><ReportManager /></AdminLayout>,
  },
  {
    path: '/admin/attendance-journals',
    element: <AdminLayout><AttendanceJournalManager /></AdminLayout>,
  },
  {
    path: '/admin/attendance/analytics',
    element: <AdminLayout><AttendanceAnalytics /></AdminLayout>,
  },
  {
    path: '/admin/users',
    element: <AdminLayout><UserManager /></AdminLayout>,
  },
  {
    path: '/admin/spp',
    element: <AdminLayout><SppManager /></AdminLayout>,
  },
  {
    path: '/admin/news',
    element: <AdminLayout><NewsManager /></AdminLayout>,
  },
  {
    path: '/admin/website-builder',
    element: <AdminLayout><WebsiteEditor /></AdminLayout>,
  },
  {
    path: '/admin/domain',
    element: <AdminLayout><DomainManager /></AdminLayout>,
  },
  {
    path: '/admin/ppdb',
    element: <AdminLayout><PpdbAdminDashboard /></AdminLayout>,
  },
  {
    path: '/admin/accreditation',
    element: <AdminLayout><Accreditation /></AdminLayout>,
  },
  {
    path: '/admin/e-surat',
    element: <AdminLayout><ESurat /></AdminLayout>,
  },
  {
    path: '/admin/gallery',
    element: <AdminLayout><GalleryManager /></AdminLayout>,
  },
  {
    path: '/admin/events',
    element: <AdminLayout><EventManager /></AdminLayout>,
  },
  {
    path: '/admin/extracurriculars',
    element: <AdminLayout><ExtracurricularManager /></AdminLayout>,
  },
  {
    path: '/admin/kbm-schedules',
    element: <AdminLayout><KbmScheduleManager /></AdminLayout>,
  },
  {
    path: '/admin/billing',
    element: <AdminLayout><BillingOverview /></AdminLayout>,
  },
  {
    path: '/admin/billing/checkout',
    element: <AdminLayout><BillingCheckout /></AdminLayout>,
  },
  {
    path: '/admin/communication',
    element: <AdminLayout><CommunicationCenter /></AdminLayout>,
  },
  // Teacher Panel
  {
    path: '/teacher',
    element: <ProtectedRoute roles={['teacher']}><TeacherDashboard /></ProtectedRoute>,
  },
  {
    path: '/teacher/communication',
    element: <ProtectedRoute roles={['teacher']}><CommunicationCenter /></ProtectedRoute>,
  },
  // Parent Portal
  {
    path: '/parent',
    element: <ProtectedRoute roles={['parent']}><ParentDashboard /></ProtectedRoute>,
  },
  {
    path: '/parent/communication',
    element: <ProtectedRoute roles={['parent']}><CommunicationCenter /></ProtectedRoute>,
  },
  {
    path: '/communication',
    element: <ProtectedRoute roles={['admin', 'teacher', 'parent']}><CommunicationRedirect /></ProtectedRoute>,
  },
  
  // Settings & Profile (shared auth route example)
  {
    path: '/profile',
    element: <ProtectedRoute><Profile /></ProtectedRoute>,
  },
  {
    path: '/kiosk',
    element: <AttendanceKiosk />,
  },
  
  // Fallback
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
