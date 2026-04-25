import React from "react";
import { supabase } from "../../supabaseClient";

export async function getOrCreateSession(courseId, userId) {
  // Try to find an existing session for this user and course
  const { data: existing, error: findError } = await supabase
    .from("sessions")
    .select("id")
    .eq("course_id", courseId)
    .eq("user_id", userId)
    .single();
  if (existing) return existing.id;
  // If not found, create a new session
  const { data: created, error: createError } = await supabase
    .from("sessions")
    .insert([{ course_id: courseId, user_id: userId }])
    .select("id")
    .single();
  return created?.id || null;
}
