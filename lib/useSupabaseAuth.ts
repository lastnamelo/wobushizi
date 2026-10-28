"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { formatAuthError } from "@/lib/authErrors";

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const client = supabase;

    // Redirect failures are returned by initialize(), not by getUser().
    client.auth
      .initialize()
      .then(async ({ error: redirectError }) => {
        const { data, error: userError } = await client.auth.getUser();
        if (!mounted) return;
        if (data.user) {
          setError(null);
        } else if (redirectError) {
          setError(formatAuthError(redirectError));
        } else if (userError && !/auth session missing/i.test(userError.message)) {
          setError(formatAuthError(userError));
        }
        setUser(data.user ?? null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(formatAuthError(err));
        setLoading(false);
      });

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) {
        setError(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signInWithEmail(email: string) {
    if (!isSupabaseConfigured || !supabase) {
      const err = new Error("Supabase is not configured.");
      setError(err.message);
      throw err;
    }
    setError(null);
    try {
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
        }
      });
      if (signInError) throw signInError;
    } catch (err) {
      setError(formatAuthError(err));
      throw err;
    }
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) return;
    setError(null);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      throw signOutError;
    }
  }

  return {
    isSupabaseConfigured,
    user,
    loading,
    error,
    signInWithEmail,
    signOut
  };
}
