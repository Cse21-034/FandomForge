// =====================================================================
// client/src/hooks/useReferralTracker.ts
// =====================================================================

import { useEffect } from "react";
import { referralApi } from "@/lib/api";

/**
 * Drop this hook into App.tsx (inside the App component, before the
 * return statement):
 *
 *   import { useReferralTracker } from "@/hooks/useReferralTracker";
 *   function App() {
 *     useReferralTracker();
 *     return <QueryClientProvider ...>...</QueryClientProvider>;
 *   }
 *
 * It reads ?ref=CODE from the URL, fires a single click-tracking
 * call (once per session per code), and stores the code in
 * sessionStorage for use after the user registers.
 */
export function useReferralTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code   = params.get("ref");
    if (!code) return;

    // Persist so we can credit after registration
    sessionStorage.setItem("referralCode", code);

    // Only fire one click per session per code
    if (sessionStorage.getItem("refClickTracked") === code) return;

    referralApi
      .trackClick(code)
      .then((result: any) => {
        if (result?.counted) {
          sessionStorage.setItem("refClickTracked", code);
        }
      })
      .catch(() => { /* never break the user experience */ });
  }, []);
}

/**
 * Call this immediately after a successful registration.
 *
 * In client/src/pages/AuthPage.tsx, inside handleRegister:
 *
 *   import { trackReferralRegistration } from "@/hooks/useReferralTracker";
 *
 *   const handleRegister = async (e) => {
 *     e.preventDefault();
 *     try {
 *       const response = await register(username, email, password, role);
 *       await trackReferralRegistration(response.user.id);   // ← add
 *       navigate("/");
 *     } catch {}
 *   };
 */
export async function trackReferralRegistration(newUserId: string) {
  const code = sessionStorage.getItem("referralCode");
  if (!code) return;

  try {
    const result: any = await referralApi.trackRegistration(code, newUserId);
    if (result?.counted) {
      // Clear so it cannot be double-credited
      sessionStorage.removeItem("referralCode");
      sessionStorage.removeItem("refClickTracked");
    }
  } catch {
    // silently ignore
  }
}