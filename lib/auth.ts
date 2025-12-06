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
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  // If profile doesn't exist, create it
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([{ id: user.id, email: user.email, role: "user" }])
      .select("id, email, role, created_at, updated_at")
      .single();

    if (createError || !newProfile) {
      console.error("Error creating profile:", createError);
      return null;
    }

    return newProfile as UserProfile;
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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // If profile doesn't exist, create it with default 'user' role
  let userProfile = profile;
  if (!profile && !error) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert([{ id: user.id, email: user.email, role: "user" }])
      .select("role")
      .single();
    userProfile = newProfile;
  }

  if (!userProfile || userProfile.role !== "admin") {
    redirect("/not-authorized");
  }

  return { user, profile: userProfile };
}

