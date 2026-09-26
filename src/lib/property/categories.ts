// src/lib/property/categories.ts

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  deleted_at: string | null;
}

export interface CategoryMutationResult {
  error: string | null;
}

const UNIQUE_VIOLATION = "23505";

function friendlyError(message: string, code?: string): string {
  if (code === UNIQUE_VIOLATION) {
    return "Nama kategori sudah dipakai (termasuk kategori yang sudah dihapus) -- pakai nama lain atau pulihkan yang lama.";
  }
  return message;
}

/** Ambil kategori aktif saja (dipakai dropdown listing) atau termasuk yang sudah dihapus (dipakai halaman kelola). */
export async function getCategories(
  supabase: SupabaseClient<Database>,
  { includeDeleted = false }: { includeDeleted?: boolean } = {}
): Promise<{ data: Category[]; error: boolean }> {
  let query = supabase
    .schema("property")
    .from("categories")
    .select("id, name, description, deleted_at")
    .order("name");

  if (!includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { data: [], error: true };
  }

  return { data, error: false };
}

export async function createCategory(
  supabase: SupabaseClient<Database>,
  input: { name: string; description?: string }
): Promise<CategoryMutationResult> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .schema("property")
    .from("categories")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      created_by: userData.user?.id ?? null,
    });

  if (error) {
    return { error: friendlyError(error.message, error.code) };
  }

  return { error: null };
}

export async function updateCategory(
  supabase: SupabaseClient<Database>,
  id: string,
  input: { name: string; description?: string }
): Promise<CategoryMutationResult> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .schema("property")
    .from("categories")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() || null,
      updated_by: userData.user?.id ?? null,
    })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error.message, error.code) };
  }

  return { error: null };
}

/** Soft delete -- listing yang masih memakai kategori ini tetap menampilkan namanya (lihat getListings.ts). */
export async function deleteCategory(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<CategoryMutationResult> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .schema("property")
    .from("categories")
    .update({ deleted_at: new Date().toISOString(), updated_by: userData.user?.id ?? null })
    .eq("id", id);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function restoreCategory(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<CategoryMutationResult> {
  const { data: userData } = await supabase.auth.getUser();

  const { error } = await supabase
    .schema("property")
    .from("categories")
    .update({ deleted_at: null, updated_by: userData.user?.id ?? null })
    .eq("id", id);

  if (error) {
    return { error: friendlyError(error.message, error.code) };
  }

  return { error: null };
}
