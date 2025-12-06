"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "./LogoutButton";
import type { User } from "@supabase/supabase-js";

export function AuthNav() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      router.refresh();
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <Button asChild size="sm" disabled>
        <Link href="/login">Loading...</Link>
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button asChild size="sm" variant="outline">
          <Link href="/login">Login</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/signup">Signup</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <Button asChild size="sm" variant="outline">
        <Link href="/account">Profile</Link>
      </Button>
      <LogoutButton />
    </>
  );
}

