import React, { useEffect } from 'react';
import Topbar from './components/Topbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import BottomPlayer from './components/BottomPlayer';
import MobileBottomNav from './components/MobileBottomNav';
import ContextMenu from './components/ContextMenu';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import Playlist from './pages/Playlist';
import Queue from './pages/Queue';
import LyricsView from './pages/LyricsView';
import LikedSongs from './pages/LikedSongs';
import AlbumView from './pages/AlbumView';
import ArtistView from './pages/ArtistView';
import EditPlaylistModal from './components/EditPlaylistModal';
import ConfirmModal from './components/ConfirmModal';
import UserLogin from './pages/UserLogin';
import UserRegister from './pages/UserRegister';
import Profile from './pages/Profile';
import RecentlyPlayed from './pages/RecentlyPlayed';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import { usePlayerStore } from './store/usePlayerStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthStore } from './store/useAuthStore';
import './App.css';

// Admin Imports
import AdminRoute from './components/AdminRoute';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSongs from './pages/admin/AdminSongs';
import AdminPlaylists from './pages/admin/AdminPlaylists';
import AdminUsers from './pages/admin/AdminUsers';

function App() {
  const { restoreSession, currentUser, isAuthenticated } = useAuthStore();
  const { initializeFromSupabase, loginAdmin, loadUserData } = usePlayerStore();

  useEffect(() => {
    restoreSession();
    initializeFromSupabase();

    // Ensure local user data is hydrated if already authenticated on fresh load
    if (isAuthenticated && currentUser) {
      loadUserData(currentUser.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync admin state whenever currentUser changes (fixes race condition on refresh)
  useEffect(() => {
    if (currentUser?.isAdmin) {
      const adminPass = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
      loginAdmin(adminPass);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  return (
    <Routes>
      {/* Admin Routes — /admin/login redirects to main /login */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="songs" element={<AdminSongs />} />
        <Route path="playlists" element={<AdminPlaylists />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      {/* User Auth Routes */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserRegister />} />

      {/* Main Player Routes */}
      <Route path="*" element={<PlayerLayout />} />
    </Routes>
  );
}


function PlayerLayout() {
  const { toast } = usePlayerStore();

  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="app-container">
      <div className="main-wrapper">
        <LeftSidebar />

        <div className="center-content">
          <Topbar />
          <main className="main-view glass-panel scrollable">
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<Search />} />
                <Route path="/library" element={<Library />} />
                <Route path="/playlist/liked-songs" element={<LikedSongs />} />
                <Route path="/playlist/:id" element={<Playlist />} />
                <Route path="/album/:albumName" element={<AlbumView />} />
                <Route path="/artist/:artistName" element={<ArtistView />} />
                <Route path="/queue" element={<Queue />} />
                <Route path="/lyrics" element={<LyricsView />} />
                <Route path="/recently-played" element={<RecentlyPlayed />} />
                <Route path="/settings" element={<Settings />} />
                {/* Protected Routes */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                {/* 404 — must be last */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </main>
        </div>

        <RightSidebar />
      </div>
      <BottomPlayer />
      <MobileBottomNav />
      <ContextMenu />
      <EditPlaylistModal />
      <ConfirmModal />

      {/* Global Toast */}
      {toast.isVisible && (
        <div className="global-toast">
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default App;
