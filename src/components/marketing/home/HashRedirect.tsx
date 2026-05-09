"use client";

import { useEffect } from "react";

export function HashRedirect() {
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) return;

    const hashParams = new URLSearchParams(hash.substring(1));
    if (hashParams.get("type") === "recovery" && hashParams.get("access_token")) {
      window.location.replace(`/auth/reset-password${hash}`);
    }
  }, []);

  return null;
}
