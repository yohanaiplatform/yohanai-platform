"use client";

// src/components/property/CategoryManager.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  restoreCategory,
  type Category,
} from "@/lib/property/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CategoryManagerProps {
  categories: Category[];
}

function AddCategoryForm({ onAdded }: { onAdded: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error: createError } = await createCategory(supabase, { name, description });

    setSubmitting(false);

    if (createError) {
      setError(createError);
      return;
    }

    setName("");
    setDescription("");
    onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
      <div className="space-y-2">
        <Label htmlFor="new-category-name">Nama Kategori *</Label>
        <Input
          id="new-category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="mis. Rumah Cluster"
          className="w-56"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-category-description">Deskripsi</Label>
        <Input
          id="new-category-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Opsional"
          className="w-64"
        />
      </div>
      <Button type="submit" size="sm" disabled={submitting || !name.trim()}>
        {submitting ? "Menyimpan..." : "+ Tambah Kategori"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </form>
  );
}

function CategoryRow({ category, onChanged }: { category: Category; onChanged: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCancel() {
    setName(category.name);
    setDescription(category.description ?? "");
    setError(null);
    setIsEditing(false);
  }

  async function handleSave() {
    if (!name.trim()) return;

    setSaving(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await updateCategory(supabase, category.id, { name, description });

    setSaving(false);

    if (updateError) {
      setError(updateError);
      return;
    }

    setIsEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!window.confirm(`Hapus kategori "${category.name}"? Listing yang sudah pakai kategori ini tetap aman.`)) {
      return;
    }

    const supabase = createClient();
    const { error: deleteError } = await deleteCategory(supabase, category.id);

    if (deleteError) {
      setError(deleteError);
      return;
    }

    onChanged();
  }

  if (isEditing) {
    return (
      <li className="flex flex-wrap items-end gap-3 py-3">
        <div className="space-y-2">
          <Label htmlFor={`edit-name-${category.id}`}>Nama Kategori *</Label>
          <Input
            id={`edit-name-${category.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-56"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`edit-description-${category.id}`}>Deskripsi</Label>
          <Input
            id={`edit-description-${category.id}`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? "Menyimpan..." : "Save"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleCancel} disabled={saving}>
            Batal
          </Button>
        </div>
        {error && <p className="w-full text-sm text-destructive">{error}</p>}
      </li>
    );
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div>
        <p className="text-sm font-medium">{category.name}</p>
        {category.description && (
          <p className="text-xs text-muted-foreground">{category.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleDelete}>
          Hapus
        </Button>
      </div>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </li>
  );
}

function DeletedCategoryRow({ category, onChanged }: { category: Category; onChanged: () => void }) {
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRestore() {
    setRestoring(true);
    setError(null);

    const supabase = createClient();
    const { error: restoreError } = await restoreCategory(supabase, category.id);

    setRestoring(false);

    if (restoreError) {
      setError(restoreError);
      return;
    }

    onChanged();
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <p className="text-sm text-muted-foreground line-through">{category.name}</p>
      <Button type="button" size="sm" variant="outline" onClick={handleRestore} disabled={restoring}>
        {restoring ? "Memulihkan..." : "Pulihkan"}
      </Button>
      {error && <p className="w-full text-sm text-destructive">{error}</p>}
    </li>
  );
}

export function CategoryManager({ categories }: CategoryManagerProps) {
  const router = useRouter();
  const [showDeleted, setShowDeleted] = useState(false);

  const activeCategories = categories.filter((c) => !c.deleted_at);
  const deletedCategories = categories.filter((c) => c.deleted_at);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <AddCategoryForm onAdded={refresh} />

      {activeCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada kategori aktif.</p>
      ) : (
        <ul className="divide-y divide-border">
          {activeCategories.map((c) => (
            <CategoryRow key={c.id} category={c} onChanged={refresh} />
          ))}
        </ul>
      )}

      {deletedCategories.length > 0 && (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowDeleted((v) => !v)}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {showDeleted ? "Sembunyikan" : "Tampilkan"} kategori terhapus ({deletedCategories.length})
          </button>
          {showDeleted && (
            <ul className="mt-2 divide-y divide-border">
              {deletedCategories.map((c) => (
                <DeletedCategoryRow key={c.id} category={c} onChanged={refresh} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
