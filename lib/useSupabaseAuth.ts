"use client";

import { useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

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

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!mounted) return;
        if (sessionError) {
          setError(sessionError.message);
        }
        setUser((data.session as Session | null)?.user ?? null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!mounted) return;
        setError(err.message);
        setLoading(false);
      });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
      }
    });

    if (signInError) {
      setError(signInError.message);
      throw signInError;
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
