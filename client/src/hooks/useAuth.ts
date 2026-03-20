// client/src/hooks/useAuth.ts
// This now just re-exports from the global AuthContext
// so all components share the same auth state

export { useAuth, type User } from "@/contexts/AuthContext";