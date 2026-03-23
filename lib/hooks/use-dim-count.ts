"use client";

import { useState, useEffect } from "react";

export function useDimCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const res = await fetch("/api/v1/dims/count");
        if (res.ok && mounted) {
          const json = await res.json();
          setCount(json.data?.count ?? 0);
        }
      } catch {
        // silently fail
      }
    }

    fetchCount();
    // Refresh every 60 seconds
    const interval = setInterval(fetchCount, 60_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return count;
}
