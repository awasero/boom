"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/lib/github";
import { Loader2, Plus } from "lucide-react";

export function CreateProjectDialog() {
  const { data: session } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!session?.accessToken || !name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const project = await createProject(
        session.accessToken,
        name.trim().toLowerCase().replace(/\s+/g, "-"),
        description.trim()
      );

      setOpen(false);
      setName("");
      setDescription("");
      router.push(`/project/${project.fullName}`);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create project. The repository name might already exist."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new project</DialogTitle>
          <DialogDescription>
            This will create a new GitHub repository with an Astro template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              placeholder="my-awesome-website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              This will be your repository name (lowercase, no spaces)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A beautiful website for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
