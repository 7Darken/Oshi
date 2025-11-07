import React, { createContext, ReactNode, useContext } from 'react';
import { useNetworkStatus, NetworkStatus } from '@/hooks/useNetworkStatus';

const NetworkContext = createContext<NetworkStatus | undefined>(undefined);

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const status = useNetworkStatus();

  return <NetworkContext.Provider value={status}>{children}</NetworkContext.Provider>;
}

export function useNetworkContext(): NetworkStatus {
  const context = useContext(NetworkContext);

  if (context === undefined) {
    throw new Error('useNetworkContext must be used within a NetworkProvider');
  }

  return context;
}
