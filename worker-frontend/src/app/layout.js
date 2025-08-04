'use client';

import { Inter, Poppins } from 'next/font/google';
import { WalletContextProvider } from '../components/WalletContextProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { Toaster } from 'react-hot-toast'; // Temporarily disabled
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <head>
        <title>Previewer Workers - Earn by Evaluating Content</title>
        <meta name="description" content="Join the Previewer workforce and earn Solana by evaluating marketing content. Help creators optimize their images, thumbnails, and videos while earning cryptocurrency." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#d946ef" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://workers.previewer.app/" />
        <meta property="og:title" content="Previewer Workers - Earn by Evaluating Content" />
        <meta property="og:description" content="Join the Previewer workforce and earn Solana by evaluating marketing content." />
        <meta property="og:image" content="/og-image-worker.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://workers.previewer.app/" />
        <meta property="twitter:title" content="Previewer Workers - Earn by Evaluating Content" />
        <meta property="twitter:description" content="Join the Previewer workforce and earn Solana by evaluating marketing content." />
        <meta property="twitter:image" content="/og-image-worker.png" />

        {/* Favicon */}
        <link rel="icon" href="/favicon-worker.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon-worker.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-worker-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-worker-16x16.png" />
        <link rel="manifest" href="/site-worker.webmanifest" />

        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.className} antialiased bg-gray-50 min-h-screen`}>
        <QueryClientProvider client={queryClient}>
          <WalletContextProvider>
            <div className="min-h-screen flex flex-col">
              {/* Skip to main content for accessibility */}
              <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-secondary-600 text-white px-4 py-2 rounded-lg z-50"
              >
                Skip to main content
              </a>
              
              {/* Main content */}
              <main id="main-content" className="flex-1">
                {children}
              </main>
              
              {/* Footer */}
              <footer className="bg-white border-t border-gray-200 py-8 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                      <div className="flex items-center space-x-2 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-secondary-600 to-accent-600 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">W</span>
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent">
                          Previewer Workers
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 max-w-md">
                        Earn cryptocurrency by evaluating marketing content. Join thousands of workers 
                        helping creators optimize their materials for maximum impact.
                      </p>
                      <div className="flex space-x-4">
                        <a href="#" className="text-gray-400 hover:text-secondary-600 transition-colors">
                          <span className="sr-only">Twitter</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </a>
                        <a href="#" className="text-gray-400 hover:text-secondary-600 transition-colors">
                          <span className="sr-only">Discord</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.942 4.556a16.3 16.3 0 0 0-4.126-1.3 12.04 12.04 0 0 0-.529 1.1 15.175 15.175 0 0 0-4.573 0 11.585 11.585 0 0 0-.535-1.1 16.274 16.274 0 0 0-4.129 1.3A17.392 17.392 0 0 0 .182 13.218a15.785 15.785 0 0 0 4.963 2.521c.41-.564.773-1.16 1.084-1.785a10.63 10.63 0 0 1-1.706-.83c.143-.106.283-.217.418-.33a11.664 11.664 0 0 0 10.118 0c.137.113.277.224.418.33-.544.328-1.116.606-1.71.832a12.52 12.52 0 0 0 1.084 1.785 16.46 16.46 0 0 0 5.064-2.595 17.286 17.286 0 0 0-2.973-11.59ZM6.678 10.813a1.941 1.941 0 0 1-1.8-2.045 1.93 1.93 0 0 1 1.8-2.047 1.919 1.919 0 0 1 1.8 2.047 1.93 1.93 0 0 1-1.8 2.045Zm6.644 0a1.94 1.94 0 0 1-1.8-2.045 1.93 1.93 0 0 1 1.8-2.047 1.918 1.918 0 0 1 1.8 2.047 1.93 1.93 0 0 1-1.8 2.045Z" />
                          </svg>
                        </a>
                        <a href="#" className="text-gray-400 hover:text-secondary-600 transition-colors">
                          <span className="sr-only">Telegram</span>
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm4.987 6.79l-1.731 8.157c-.13.578-.472.72-.956.448l-2.64-1.946-1.273 1.226c-.141.141-.259.259-.532.259l.19-2.69 4.896-4.424c.213-.19-.046-.295-.33-.105L7.26 10.74l-2.61-.816c-.567-.177-.578-.567.119-.84l10.197-3.93c.472-.177.886.105.731.84z"/>
                          </svg>
                        </a>
                      </div>
                    </div>
                    
                    {/* Worker Resources */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                        For Workers
                      </h3>
                      <ul className="space-y-2">
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Getting Started</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Earning Guide</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Best Practices</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Payment Info</a></li>
                      </ul>
                    </div>
                    
                    {/* Support */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                        Support
                      </h3>
                      <ul className="space-y-2">
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Worker Help</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Contact Support</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Community</a></li>
                        <li><a href="#" className="text-gray-600 hover:text-secondary-600 transition-colors">Terms & Conditions</a></li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
                    <p className="text-gray-600 text-sm">
                      © 2024 Previewer Workers. All rights reserved.
                    </p>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                      <span className="text-sm text-gray-600">Powered by</span>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-900">Solana</span>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
            
            {/* Toast notifications - temporarily disabled */}
            {/* <Toaster ... /> */}
          </WalletContextProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
