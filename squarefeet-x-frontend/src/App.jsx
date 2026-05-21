import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './config/queryClient';
import { useThemeStore } from './store/themeStore';
import AppRouter from './routes/AppRouter';
import './index.css';

const App = () => {
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? '#141829' : '#ffffff',
              color: isDark ? '#e2e8f0' : '#0f172a',
              border: isDark ? '1px solid #2a2f4a' : '1px solid #e2e8f0',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: isDark ? '#fff' : '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: isDark ? '#fff' : '#fff' },
            },
          }}
        />
      </QueryClientProvider>
    </HelmetProvider>
  );
};

export default App;

