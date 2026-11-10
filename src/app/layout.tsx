import type { Metadata, Viewport } from 'next';
import './globals.css';
import { InstallPwaPrompt } from '@/components/ui/InstallPwaPrompt';

export const viewport: Viewport = {
  themeColor: '#2563eb',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'سیستەمی زیرەکی غەسلی دەریا | Darya Car Wash',
  description: 'سیستەمی بەڕێوەبردنی غەسلی دەریا، کاشێر، لۆیەڵتی تابلۆ و ژمێریاری',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'غەسلی دەریا',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ku" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="غەسل Pro" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Block iOS Safari gesture zooming (pinch to zoom)
              document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
              document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
              document.addEventListener('gestureend', function(e) { e.preventDefault(); });
              // Prevent double-tap to zoom on PWA & mobile
              let lastTouchEnd = 0;
              document.addEventListener('touchend', function(e) {
                const now = Date.now();
                if (now - lastTouchEnd <= 300) {
                  e.preventDefault();
                }
                lastTouchEnd = now;
              }, { passive: false });
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F4F6FA] text-slate-900 antialiased selection:bg-blue-600 selection:text-white font-sans overflow-x-hidden max-w-full w-full">
        <InstallPwaPrompt />
        {children}
      </body>
    </html>
  );
}
