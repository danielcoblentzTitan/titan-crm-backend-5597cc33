import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";
import Login from "./pages/Login";
import InviteSignup from "./pages/InviteSignup";
import BuilderDashboard from "./pages/BuilderDashboard";
import CustomerPortal from "./pages/CustomerPortal";
import ProjectDetails from "./pages/ProjectDetails";
import Documents from "./pages/Documents";
import Schedule from "./pages/Schedule";
import Summary from "./pages/Summary";
import Punchlist from "./pages/Punchlist";
import PunchlistPrint from "./pages/PunchlistPrint";
import MasterPricing from "./pages/MasterPricing";
import NotFound from "./pages/NotFound";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import InvoiceView from "./pages/InvoiceView";
import { SimpleEstimate } from "./pages/SimpleEstimate";
import SalesAnalytics from "./pages/SalesAnalytics";
import { ProjectManagement } from "./pages/ProjectManagement";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";
import WorkflowDashboard from "./components/WorkflowDashboard";
import MissionControl from "./components/mission-control/MissionControl";


const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/invite-signup" element={<InviteSignup />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/" element={<Index />} />
              
              {/* Customer routes - Allow public access when project data is provided */}
              <Route 
                path="/customer-portal" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <CustomerPortal />
                  </ProtectedRoute>
                } 
              />
              
              {/* Builder-only routes */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['builder']}>
                    <BuilderDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/workflow" 
                element={
                  <ProtectedRoute allowedRoles={['builder']}>
                    <WorkflowDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/mission-control" 
                element={
                  <ProtectedRoute allowedRoles={['builder']}>
                    <MissionControl />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/master-pricing" 
                element={
                  <ProtectedRoute allowedRoles={['builder']}>
                    <MasterPricing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/simple-estimate" 
                element={
                  <ProtectedRoute allowedRoles={['builder']}>
                    <SimpleEstimate />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/sales-analytics" 
                element={
                  <ProtectedRoute allowedRoles={['builder']}>
                    <SalesAnalytics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/project-management/:projectId" 
                element={
                  <ProtectedRoute allowedRoles={['builder']}>
                    <ProjectManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* Protected shared routes */}
              <Route 
                path="/project/:id" 
                element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/schedule/:id" 
                element={
                  <ProtectedRoute>
                    <Schedule />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/summary/:id" 
                element={
                  <ProtectedRoute>
                    <Summary />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/punchlist/:id" 
                element={
                  <ProtectedRoute>
                    <Punchlist />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/punchlist/:id/print" 
                element={
                  <ProtectedRoute>
                    <PunchlistPrint />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/documents/:id" 
                element={
                  <ProtectedRoute>
                    <Documents />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/invoice/:id" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <InvoiceView />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
