"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { createList } from "@/lib/lists/actions";
import { cn } from "@/lib/utils";

export function CreateListForm({ className }: { className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const list = await createList({ title: title.trim() });
      setTitle("");
      setOpen(false);
      router.push(`/lists/${list.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the list.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)} className={className}>
        + New list
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-2", className)}>
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="List title"
        className="input flex-1"
      />
      <Button type="submit" disabled={submitting || !title.trim()}>
        Create
      </Button>
      <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  );
}
