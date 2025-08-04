/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        buffer: false,
      };
    }
    
    // Handle ESM modules
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Handle module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    return config;
  },
  transpilePackages: [
    '@solana/wallet-adapter-base',
    '@solana/wallet-adapter-react',
    '@solana/wallet-adapter-react-ui',
    '@solana/wallet-adapter-wallets',
    '@solana/web3.js',
    '@solana/codecs-numbers',
    '@solana/codecs-core',
  ],
  experimental: {
    esmExternals: 'loose'
  }
};

export default nextConfig;
