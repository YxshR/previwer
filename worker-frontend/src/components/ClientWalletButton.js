'use client';

import { useState, useEffect } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function ClientWalletButton({ className, ...props }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button 
        className={`wallet-adapter-button wallet-adapter-button-trigger ${className || ''}`}
        disabled
      >
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton className={className} {...props} />;
}