import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../lib/axios';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  user: UserProfile | null; 
  isLoading: boolean;
}

// Estado inicial del Auth
const initialState: AuthState = {
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  user: null,
  isLoading: false,
};

// Acción para obtener el perfil del usuario desde la API
export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/me');
      return response.data; // Esto es el UserProfile
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Error fetching profile');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload);
    },
    logout: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.user = null;
      state.isLoading = false;
      localStorage.removeItem('token');
    },
  },
  // Manejo del ciclo de vida de la petición asíncrona
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.isLoading = false;
        state.user = action.payload; // Se guarda los permisos del usuario
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.isLoading = false;
        // Si falla el perfil, se cierra sesión
        state.token = null;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('token');
      });
  },
});

export const { setToken, logout } = authSlice.actions;
export default authSlice.reducer;