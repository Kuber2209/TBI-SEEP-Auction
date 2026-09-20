import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from '@/lib/theme/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEEP 4.0 — Live Startup Auction Platform | BITS Pilani TBI',
  description: 'Official real-time startup auction platform for Student Entrepreneurs Encouragement Program 4.0 at BITS Pilani Hyderabad Campus.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/tbi-crest.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

const themeInitScript = `
(function() {
  try {
    localStorage.removeItem('seep-theme');
    document.documentElement.classList.remove('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[#dfe7e0] text-[#203126] font-sans antialiased selection:bg-[#1a5c3e] selection:text-white">
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
