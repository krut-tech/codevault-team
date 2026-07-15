import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { Suspense, lazy } from "react";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import Languages from "@/pages/Languages";
import Search from "@/pages/Search";
import Notifications from "@/pages/Notifications";
import Profile from "@/pages/Profile";
import RecycleBin from "@/pages/RecycleBin";
import Favorites from "@/pages/Favorites";
import AdminUsers from "@/pages/AdminUsers";
import AdminActivityLogs from "@/pages/AdminActivityLogs";
import AdminSettings from "@/pages/AdminSettings";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

// Heavier pages (Monaco, dropzone+jszip, collections) are code-split
const Editor = lazy(() => import("@/pages/Editor"));
const FolderBrowser = lazy(() => import("@/pages/FolderBrowser"));
const Collections = lazy(() => import("@/pages/Collections"));
const CollectionDetail = lazy(() => import("@/pages/CollectionDetail"));
const Snippets = lazy(() => import("@/pages/Snippets"));
const Projects = lazy(() => import("@/pages/Projects"));

const queryClient = new QueryClient();

function PageFallback() {
  return (
    <div className="flex h-screen items-center justify-center bg-bg-secondary">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}

function Lazy({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster richColors position="top-right" />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/languages" element={<Languages />} />
            <Route path="/projects" element={<Lazy><Projects /></Lazy>} />
            <Route path="/folders/:folderId" element={<Lazy><FolderBrowser /></Lazy>} />
            <Route path="/files" element={<Lazy><FolderBrowser /></Lazy>} />
            <Route path="/editor/:fileId" element={<Lazy><Editor /></Lazy>} />
            <Route path="/snippets" element={<Lazy><Snippets /></Lazy>} />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/recent" element={<Dashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/downloads" element={<Dashboard />} />
            <Route path="/collections" element={<Lazy><Collections /></Lazy>} />
            <Route path="/collections/:collectionId" element={<Lazy><CollectionDetail /></Lazy>} />
            <Route path="/recycle-bin" element={<RecycleBin />} />

            {/* Admin only */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/logs" element={<AdminActivityLogs />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
