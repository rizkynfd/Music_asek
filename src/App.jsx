import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Topbar from './components/Topbar';
import LeftSidebar from './components/LeftSidebar';
import RightSidebar from './components/RightSidebar';
import BottomPlayer from './components/BottomPlayer';
import MobileBottomNav from './components/MobileBottomNav';
import ContextMenu from './components/ContextMenu';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import { useAlbumColors } from './hooks/useAlbumColors';
import { getLastfmSession, getLastfmUserInfo } from './services/lastfmScrobble';
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
  const { 
    toast,
    leftSidebarWidth, setLeftSidebarWidth, 
    rightSidebarWidth, setRightSidebarWidth,
    isRightSidebarOpen,
    currentSong,
    setAlbumColors,
    lastfmSessionKey, setLastfmSessionKey, setLastfmUser,
  } = usePlayerStore();

  const location = useLocation();

  // ── Dynamic Album Colors via node-vibrant ──
  const colors = useAlbumColors(currentSong?.coverUrl);
  useEffect(() => {
    setAlbumColors(colors);
    document.documentElement.style.setProperty('--dynamic-bg', colors.bg);
    document.documentElement.style.setProperty('--dynamic-accent', colors.accent);
    document.documentElement.style.setProperty('--dynamic-muted', colors.muted);
  }, [colors, setAlbumColors]);

  // ── Last.fm: handle OAuth callback ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('lastfm_callback') === '1') {
      const token = params.get('token');
      if (token) {
        getLastfmSession(token).then(async (sk) => {
          if (sk) {
            setLastfmSessionKey(sk);
            const user = await getLastfmUserInfo(sk);
            if (user) setLastfmUser(user);
            window.history.replaceState({}, '', '/settings');
          }
        });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Register global keyboard shortcuts
  useKeyboardShortcuts();

  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        const newWidth = Math.max(200, Math.min(500, e.clientX - 16)); 
        setLeftSidebarWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX - 32));
        setRightSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
      document.body.style.cursor = 'default';
    };

    if (isResizingLeft || isResizingRight) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing');
    } else {
      document.body.classList.remove('resizing');
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'auto';
    };
  }, [isResizingLeft, isResizingRight, setLeftSidebarWidth, setRightSidebarWidth]);

  return (
    <div className="app-container" style={{ background: `linear-gradient(180deg, ${colors.bg}55 0%, transparent 40%)` }}>
      <div className="main-wrapper" style={{ 
        '--left-sidebar-width': `${leftSidebarWidth}px`,
        '--right-sidebar-width': `${rightSidebarWidth}px`
      }}>
        <LeftSidebar />
        <div 
          className={`resize-handle left-handle ${isResizingLeft ? 'active' : ''}`}
          onMouseDown={() => setIsResizingLeft(true)}
        ></div>

        <div className="center-content">
          <Topbar />
          <main className="main-view glass-panel scrollable">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  <Route path="/" element={<PageWrapper><Home /></PageWrapper>} />
                  <Route path="/search" element={<PageWrapper><Search /></PageWrapper>} />
                  <Route path="/library" element={<PageWrapper><Library /></PageWrapper>} />
                  <Route path="/playlist/liked-songs" element={<PageWrapper><LikedSongs /></PageWrapper>} />
                  <Route path="/playlist/:id" element={<PageWrapper><Playlist /></PageWrapper>} />
                  <Route path="/album/:albumName" element={<PageWrapper><AlbumView /></PageWrapper>} />
                  <Route path="/artist/:artistName" element={<PageWrapper><ArtistView /></PageWrapper>} />
                  <Route path="/queue" element={<PageWrapper><Queue /></PageWrapper>} />
                  <Route path="/lyrics" element={<PageWrapper><LyricsView /></PageWrapper>} />
                  <Route path="/recently-played" element={<PageWrapper><RecentlyPlayed /></PageWrapper>} />
                  <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
                  <Route path="/profile" element={<PageWrapper><ProtectedRoute><Profile /></ProtectedRoute></PageWrapper>} />
                  <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
                </Routes>
              </AnimatePresence>
            </ErrorBoundary>
          </main>
        </div>

        {isRightSidebarOpen && (
          <>
            <div 
              className={`resize-handle right-handle ${isResizingRight ? 'active' : ''}`}
              onMouseDown={() => setIsResizingRight(true)}
            ></div>
            <RightSidebar />
          </>
        )}
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

/** Framer Motion page transition wrapper */
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{ height: '100%' }}
    >
      {children}
    </motion.div>
  );
}
