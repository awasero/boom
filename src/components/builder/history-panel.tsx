"use client";

import { useState, useEffect } from "react";
import { getCommitHistory, revertToCommit, CommitInfo } from "@/lib/github-files";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { History, RotateCcw, Loader2, Check, GitCommit } from "lucide-react";

interface HistoryPanelProps {
  owner: string;
  repo: string;
  accessToken: string;
  isOpen: boolean;
  onClose: () => void;
  onRevert: () => void;
}

export function HistoryPanel({
  owner,
  repo,
  accessToken,
  isOpen,
  onClose,
  onRevert,
}: HistoryPanelProps) {
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [reverting, setReverting] = useState(false);
  const [selectedCommit, setSelectedCommit] = useState<CommitInfo | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  async function loadHistory() {
    setLoading(true);
    try {
      const history = await getCommitHistory(accessToken, owner, repo);
      setCommits(history);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevert() {
    if (!selectedCommit) return;

    setReverting(true);
    try {
      await revertToCommit(accessToken, owner, repo, selectedCommit.sha);
      setShowConfirm(false);
      setSelectedCommit(null);
      onRevert();
      onClose();
    } catch (err) {
      console.error("Failed to revert:", err);
    } finally {
      setReverting(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="bg-[#111113] border-zinc-800 w-[400px] max-w-[400px] overflow-hidden">
          <SheetHeader>
            <SheetTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5" />
              Version History
            </SheetTitle>
            <SheetDescription className="text-zinc-500">
              View past versions and restore if needed
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            ) : commits.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No history available</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2 pr-4 overflow-hidden">
                  {commits.map((commit, index) => (
                    <div
                      key={commit.sha}
                      className={`
                        p-3 rounded-lg border transition-all overflow-hidden
                        ${index === 0
                          ? "bg-emerald-500/10 border-emerald-500/30"
                          : "bg-zinc-900/50 border-zinc-800/50 hover:border-zinc-700/50"
                        }
                      `}
                    >
                      <div className="flex items-start gap-3 overflow-hidden">
                        <div className={`
                          mt-0.5 p-1.5 rounded-lg shrink-0
                          ${index === 0 ? "bg-emerald-500/20" : "bg-zinc-800"}
                        `}>
                          {index === 0 ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <GitCommit className="h-3.5 w-3.5 text-zinc-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p className={`text-sm font-medium truncate max-w-full ${
                            index === 0 ? "text-emerald-300" : "text-zinc-300"
                          }`}>
                            {commit.message.split("\n")[0].slice(0, 60)}{commit.message.split("\n")[0].length > 60 ? "..." : ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-zinc-500">
                              {formatDate(commit.date)}
                            </span>
                            <span className="text-[10px] text-zinc-600">•</span>
                            <code className="text-[10px] text-zinc-600 font-mono">
                              {commit.sha.slice(0, 7)}
                            </code>
                          </div>
                        </div>
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedCommit(commit);
                              setShowConfirm(true);
                            }}
                            className="text-zinc-400 hover:text-white hover:bg-zinc-800 shrink-0"
                          >
                            <RotateCcw className="h-3.5 w-3.5 mr-1" />
                            Restore
                          </Button>
                        )}
                      </div>
                      {index === 0 && (
                        <span className="inline-block mt-2 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Current version
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-[#111113] border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Restore this version?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will restore your project to the state from{" "}
              <span className="text-white font-medium">
                {selectedCommit && formatDate(selectedCommit.date)}
              </span>
              . A new commit will be created preserving the current state in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevert}
              disabled={reverting}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {reverting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
