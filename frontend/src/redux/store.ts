import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Aquí irán más reducers (ui, assets, etc)
  },
});

// Tipos para usar TypeScript con Redux cómodamente
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;