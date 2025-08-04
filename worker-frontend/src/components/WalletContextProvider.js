'use client';

import React from 'react';

// Temporary minimal wallet context provider without Solana dependencies
export function WalletContextProvider({ children }) {
  return (
    <div>
      {children}
    </div>
  );
}

export default WalletContextProvider;