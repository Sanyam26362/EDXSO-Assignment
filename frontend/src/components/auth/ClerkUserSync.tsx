"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";

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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          null;
        const firstName = user?.firstName || null;
        const lastName = user?.lastName || null;
        const imageUrl = user?.imageUrl || null;

        const res = await fetch(`${apiUrl}/auth/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerk_id: user?.id,
            email,
            first_name: firstName,
            last_name: lastName,
            image_url: imageUrl,
          }),
        });

        if (res.ok) {
          lastSyncedIdRef.current = user?.id || null;
          console.log("[Auth] Clerk user profile synchronized to backend database:", user?.id);
        }
      } catch (err) {
        console.warn("[Auth] Failed to sync Clerk user with backend database:", err);
      }
    }

    syncUser();
  }, [isLoaded, isSignedIn, user]);

  return null;
}

