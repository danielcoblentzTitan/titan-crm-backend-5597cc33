import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProjectList from "./pages/ProjectList";
import ProjectDashboard from "./pages/ProjectDashboard";
import RoomSelectionsPage from "./pages/RoomSelectionsPage";
import TradeViewPage from "./pages/TradeViewPage";
import InteriorDesignPage from "./pages/design/InteriorDesignPage";
import { ErrorBoundary } from "./components/ui/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              
              {/* Protected routes */}
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <ProjectList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId"
                element={
                  <ProtectedRoute>
                    <ProjectDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/room/:roomId"
                element={
                  <ProtectedRoute>
                    <RoomSelectionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:projectId/trade-view"
                element={
                  <ProtectedRoute>
                    <TradeViewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/design/interior/:projectId"
                element={
                  <ProtectedRoute>
                    <InteriorDesignPage />
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
