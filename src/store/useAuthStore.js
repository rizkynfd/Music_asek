import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '../services/supabase'
import { usePlayerStore } from './usePlayerStore'

const isSupabaseConfigured = () =>
    !!import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== 'ISI_DENGAN_ANON_KEY_KAMU_DARI_SUPABASE'

// Helper: random avatar color
function getRandomColor() {
    const colors = ['#00f0ff', '#b026ff', '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff922b']
    return colors[Math.floor(Math.random() * colors.length)]
}

export const useAuthStore = create(
    persist(
        (set, get) => ({
            currentUser: null,
            isAuthenticated: false,
            isLoading: false,
            // Fallback: simulated "database" for when Supabase is not configured
            registeredUsers: [],

            /**
             * Fetch all users from Supabase profiles (Admin only)
             */
            fetchAllUsers: async () => {
                if (!isSupabaseConfigured()) return;
                
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    const normalized = data.map(p => ({
                        id: p.id,
                        username: p.username,
                        email: p.email || '—',
                        avatarColor: p.avatar_color,
                        createdAt: p.created_at
                    }));
                    set({ registeredUsers: normalized });
                }
            },

            /**
             * Register a new user account.
             * Uses Supabase Auth if configured, otherwise uses local store.
             */
            register: async (username, email, password) => {
                set({ isLoading: true })

                // Validation (always run)
                if (!username.trim()) { set({ isLoading: false }); return { success: false, error: 'Username tidak boleh kosong.' } }
                if (!email.trim() || !email.includes('@')) { set({ isLoading: false }); return { success: false, error: 'Email tidak valid.' } }
                if (password.length < 6) { set({ isLoading: false }); return { success: false, error: 'Password minimal 6 karakter.' } }

                if (isSupabaseConfigured()) {
                    const { data, error } = await supabase.auth.signUp({
                        email: email.toLowerCase().trim(),
                        password,
                        options: {
                            data: { username: username.trim(), avatar_color: getRandomColor() }
                        }
                    })

                    set({ isLoading: false })

                    if (error) return { success: false, error: error.message }

                    // Supabase may require email confirmation depending on settings.
                    // If user is returned, treat as logged in.
                    if (data.user) {
                        const user = {
                            id: data.user.id,
                            username: username.trim(),
                            email: data.user.email,
                            avatarColor: data.user.user_metadata?.avatar_color || '#00f0ff',
                            createdAt: data.user.created_at,
                        }
                        set({ currentUser: user, isAuthenticated: true })
                        usePlayerStore.getState().loadUserData(user.id)
                        return { success: true }
                    }

                    // Email confirmation needed
                    return { success: true, needsConfirmation: true, error: 'Cek email kamu untuk konfirmasi akun.' }
                }

                // ── FALLBACK: local store ──
                await new Promise(r => setTimeout(r, 400))
                const { registeredUsers } = get()

                const emailExists = registeredUsers.some(u => u.email.toLowerCase() === email.toLowerCase())
                if (emailExists) { set({ isLoading: false }); return { success: false, error: 'Email sudah digunakan. Silakan login.' } }

                const newUser = {
                    id: `user-${Date.now()}`,
                    username: username.trim(),
                    email: email.toLowerCase().trim(),
                    password,
                    avatarColor: getRandomColor(),
                    createdAt: new Date().toISOString(),
                }

                set((state) => ({
                    registeredUsers: [...state.registeredUsers, newUser],
                    currentUser: { ...newUser, password: undefined },
                    isAuthenticated: true,
                    isLoading: false,
                }))
                usePlayerStore.getState().loadUserData(newUser.id)
                return { success: true }
            },

            /**
             * Login with email and password.
             */
            login: async (email, password) => {
                set({ isLoading: true })

                const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin123@gmail.com').toLowerCase().trim();
                const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

                // ── ADMIN CHECK (local, no Supabase needed) ──
                if (email.toLowerCase().trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                    const adminUser = {
                        id: 'admin-local',
                        username: 'Admin',
                        email: ADMIN_EMAIL,
                        avatarColor: '#ff6b6b',
                        createdAt: new Date().toISOString(),
                        isAdmin: true,
                    };
                    set({ isLoading: false, currentUser: adminUser, isAuthenticated: true });
                    // Set admin authenticated flag in player store via existing action
                    usePlayerStore.getState().loginAdmin(ADMIN_PASSWORD);
                    return { success: true, isAdmin: true };
                }

                if (isSupabaseConfigured()) {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email: email.toLowerCase().trim(),
                        password
                    })

                    set({ isLoading: false })

                    if (error) return { success: false, error: 'Email atau password salah.' }

                    if (data.user) {
                        const user = {
                            id: data.user.id,
                            username: data.user.user_metadata?.username || email.split('@')[0],
                            email: data.user.email,
                            avatarColor: data.user.user_metadata?.avatar_color || '#00f0ff',
                            createdAt: data.user.created_at,
                        }
                        set({ currentUser: user, isAuthenticated: true })
                        usePlayerStore.getState().loadUserData(user.id)
                        return { success: true }
                    }
                }

                // ── FALLBACK: local store ──
                await new Promise(r => setTimeout(r, 400))
                const { registeredUsers } = get()
                const user = registeredUsers.find(
                    u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password
                )

                set({ isLoading: false })

                if (!user) return { success: false, error: 'Email atau password salah.' }

                set({
                    currentUser: { ...user, password: undefined },
                    isAuthenticated: true,
                })
                usePlayerStore.getState().loadUserData(user.id)
                return { success: true }
            },


            /**
             * Log out the current user.
             */
            logout: async () => {
                usePlayerStore.getState().clearUserData()
                usePlayerStore.getState().logoutAdmin()

                if (isSupabaseConfigured()) {
                    await supabase.auth.signOut()
                }

                set({ currentUser: null, isAuthenticated: false })
            },


            /**
             * Restore session from Supabase on app start.
             * Call this once in App.jsx useEffect.
             */
            restoreSession: async () => {
                if (!isSupabaseConfigured()) return

                const { data: { session } } = await supabase.auth.getSession()

                if (session?.user) {
                    const user = {
                        id: session.user.id,
                        username: session.user.user_metadata?.username || session.user.email.split('@')[0],
                        email: session.user.email,
                        avatarColor: session.user.user_metadata?.avatar_color || '#00f0ff',
                        createdAt: session.user.created_at,
                    }
                    set({ currentUser: user, isAuthenticated: true })
                    usePlayerStore.getState().loadUserData(user.id)
                }
            },

            /**
             * Update the current user's profile (username, avatarColor).
             */
            updateProfile: async (updates) => {
                if (isSupabaseConfigured()) {
                    await supabase.auth.updateUser({ data: updates })
                    await supabase.from('profiles').update(updates).eq('id', get().currentUser?.id)
                }

                set((state) => ({
                    currentUser: { ...state.currentUser, ...updates },
                    registeredUsers: state.registeredUsers.map(u =>
                        u.id === state.currentUser?.id ? { ...u, ...updates } : u
                    )
                }))
            },
        }),
        {
            name: 'spotify-clone-auth',
            partialize: (state) => ({
                currentUser: state.currentUser,
                isAuthenticated: state.isAuthenticated,
                registeredUsers: state.registeredUsers,
            }),
        }
    )
)
