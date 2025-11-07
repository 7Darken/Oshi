import { useEffect, useMemo, useState } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export interface NetworkStatus {
  isOffline: boolean;
  isConnected: boolean;
  connectionType: NetInfoStateType;
}

export function useNetworkStatus(): NetworkStatus {
  const [netInfo, setNetInfo] = useState<NetInfoState | null>(null);

  useEffect(() => {
    let isMounted = true;

    NetInfo.fetch()
      .then((state: NetInfoState) => {
        if (isMounted) {
          setNetInfo(state);
        }
      })
      .catch((error: unknown) => {
        console.warn('⚠️ [Network] Impossible de récupérer l\'état réseau initial:', error);
      });

    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetInfo(state);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return useMemo(() => {
    const isConnected = netInfo?.isConnected ?? false;
    const isInternetReachable = netInfo?.isInternetReachable ?? netInfo?.isConnected ?? false;
    const isOffline = !(isConnected && isInternetReachable);

    return {
      isOffline,
      isConnected,
      connectionType: netInfo?.type ?? NetInfoStateType.unknown,
    };
  }, [netInfo]);
}
