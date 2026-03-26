"use client";

import { useState, useEffect } from "react";

interface GpsStatus {
  enabled: boolean;
  isReady: boolean;
  minutesUntilReady: number;
  inActiveWindow: boolean;
}

export function useGpsStatus() {
  const [status, setStatus] = useState<GpsStatus>({
    enabled: false,
    isReady: false,
    minutesUntilReady: 0,
    inActiveWindow: false,
  });

  useEffect(() => {
    let mounted = true;

    async function fetchStatus() {
      try {
        const res = await fetch("/api/v1/hourly-gps/status");
        if (res.ok && mounted) {
          const json = await res.json();
          setStatus(json.data);
        }
      } catch {
        // silently fail
      }
    }

    fetchStatus();
    // Refresh every 360 seconds
    const interval = setInterval(fetchStatus, 360_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
