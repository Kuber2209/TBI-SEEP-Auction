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
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen bg-[#f0f5f1] text-[#33404f] font-sans antialiased selection:bg-[#1a5c3e] selection:text-white">
        <ThemeProvider>
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
