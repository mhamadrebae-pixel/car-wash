import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'سیستەمی غەسلی ئۆتۆمبێل | Car Wash Pro',
    short_name: 'غەسل Pro',
    description: 'سیستەمی بەڕێوەبردنی غەسلی ئۆتۆمبێل، کاشێر، لۆیەڵتی تابلۆ و شیکاری دارایی',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b1329',
    theme_color: '#2563eb',
    orientation: 'any',
    dir: 'rtl',
    lang: 'ku',
    scope: '/',
    categories: ['business', 'finance', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'کاشێر و هۆڵەکان',
        short_name: 'کاشێر',
        description: 'چوونە ناو هۆڵەکانی شۆردن و پسوولەی کاشێر',
        url: '/',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
      {
        name: 'شاشەی TV',
        short_name: 'تیڤی',
        description: 'شاشەی ژووری چاوەڕوانی کڕیاران',
        url: '/tv',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }],
      },
    ],
  };
}
