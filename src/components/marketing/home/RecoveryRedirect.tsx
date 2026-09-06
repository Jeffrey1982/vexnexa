"use client";
import { useEffect } from "react";

/** Preserve legacy recovery links without hydrating the entire homepage. */
export function RecoveryRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.slice(1));
    if (params.get("type") === "recovery" && params.get("access_token")) {
      window.location.replace(`/auth/reset-password${hash}`);
    }
  }, []);
  return null;
}
