import { supabaseServer } from "./supabaseServer";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export interface UserProfile {
  id: string;
  email: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export async function getUserProfile() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as UserProfile;
}

export async function requireAdmin() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/not-authorized");
  }

  return { user, profile };
}

