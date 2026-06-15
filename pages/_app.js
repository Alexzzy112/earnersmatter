'use client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
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
  );
}
