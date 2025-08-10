import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define state shape
interface AuthState {
  uid: string | null;
  email: string | null;
  displayName?: string | null;
  isLoggedIn: boolean;
}

// Initial state
const initialState: AuthState = {
  uid: null,
  email: null,
  displayName: null,
  isLoggedIn: false,
};

// Create auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (
      state,
      action: PayloadAction<{ uid: string; email: string; displayName?: string | null }>
    ) => {
      state.uid = action.payload.uid;
      state.email = action.payload.email;
      state.displayName = action.payload.displayName ?? null;
      state.isLoggedIn = true;
    },
    clearUser: (state) => {
      state.uid = null;
      state.email = null;
      state.displayName = null;
      state.isLoggedIn = false;
    },
  },
});

// Export actions
export const { setUser, clearUser } = authSlice.actions;

// Create store
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
