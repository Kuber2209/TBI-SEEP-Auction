import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEEP 4.0 — Live Startup Auction Platform | BITS Pilani TBI',
  description: 'Official real-time startup auction platform for Student Entrepreneurs Encouragement Program 4.0 at BITS Pilani Hyderabad Campus.',
};

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('seep-theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-amber-500 selection:text-white dark:selection:bg-gold-500 dark:selection:text-navy-950">
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
