"use client";

import { useState } from "react";
import { Project } from "@/types/project";
import { deleteProject } from "@/lib/github";
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
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteProjectDialogProps {
  project: Project;
  accessToken: string;
  onDeleteStart: () => void;
  onDeleteComplete: () => void;
}

export function DeleteProjectDialog({
  project,
  accessToken,
  onDeleteStart,
  onDeleteComplete,
}: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = confirmName === project.name;

  async function handleDelete() {
    if (!isConfirmed) return;

    // Close dialog immediately and show deleting state on card
    setOpen(false);
    setConfirmName("");
    onDeleteStart();

    try {
      const [owner, repo] = project.fullName.split("/");
      await deleteProject(accessToken, owner, repo);
      onDeleteComplete();
    } catch (err) {
      console.error("Failed to delete project:", err);
      // If deletion fails, we should show an error - for now just log it
      // The card will remain in "deleting" state, user can refresh
      setError(err instanceof Error ? err.message : "Failed to delete project");
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen);
    if (!newOpen) {
      setConfirmName("");
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#111113] border-zinc-800 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <DialogTitle className="text-white text-lg">
              Delete project
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            This action cannot be undone. This will permanently delete the{" "}
            <span className="text-white font-semibold">{project.name}</span>{" "}
            repository from GitHub.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <label className="block text-sm text-zinc-400 mb-2">
            Type <span className="text-white font-mono">{project.name}</span> to
            confirm
          </label>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={project.name}
            className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:ring-red-500/20"
            autoComplete="off"
          />
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="bg-transparent border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={!isConfirmed}
            className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
