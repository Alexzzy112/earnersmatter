'use client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <Component {...pageProps} />
      </AuthProvider>
    </ErrorBoundary>
  );
}
