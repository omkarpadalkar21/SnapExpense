"use client";
import { useSyncExternalStore } from "react";

const noop = () => () => {};

/**
 * Returns true only after the component has mounted on the client.
 * Prevents SSR/hydration mismatches — server always gets false.
 */
export function useHasHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,   // client snapshot — true after mount
    () => false,  // server snapshot — false during SSR
  );
}

/**
 * Guards authenticated API queries.
 * Returns true only when hydrated AND an accessToken exists.
 */
export function useCanUseAuthenticatedApi(): boolean {
  const hydrated = useHasHydrated();
  return hydrated && !!localStorage.getItem("accessToken");
}