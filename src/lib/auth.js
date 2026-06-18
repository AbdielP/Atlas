import { supabase } from "./supabase";

export async function ensureAnonymousSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return;
    await supabase.auth.signInAnonymously();
}
