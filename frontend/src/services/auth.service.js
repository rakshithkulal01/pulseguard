import { supabase } from "../utils/supabase";
export const signInWithGoogle = () => supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/dashboard` } });
export const signOut = () => supabase.auth.signOut();
