"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { syncClerkUser } from "@/lib/api";

/**
 * Automatically syncs the Clerk authenticated user profile
 * to our FastAPI backend and Neon PostgreSQL database.
 */
export function ClerkUserSync() {
  const { isLoaded, isSignedIn, user } = useUser();
  const lastSyncedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;
    if (lastSyncedIdRef.current === user.id) return;

    async function syncUser() {
      try {
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          null;
        const firstName = user?.firstName || null;
        const lastName = user?.lastName || null;
        const imageUrl = user?.imageUrl || null;

        await syncClerkUser({
          clerk_id: user?.id || "",
          email,
          first_name: firstName,
          last_name: lastName,
          image_url: imageUrl,
        });

        lastSyncedIdRef.current = user?.id || null;
        console.log("[Auth] Clerk user profile synchronized to backend database:", user?.id);
      } catch (err) {
        console.warn("[Auth] Failed to sync Clerk user with backend database:", err);
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, user]);

  return null;
}

