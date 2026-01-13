"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  generatePayloadFiles,
  inferCollectionsFromContent,
  PayloadCollection,
} from "@/lib/payload-generator";
import { GeneratedFile } from "@/types/project";
import { Database, Loader2, Check } from "lucide-react";

interface CmsToggleProps {
  files: GeneratedFile[];
  onAddCmsFiles: (files: GeneratedFile[]) => void;
  projectName: string;
}

export function CmsToggle({ files, onAddCmsFiles, projectName }: CmsToggleProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<PayloadCollection[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(
    new Set()
  );

  function handleOpen() {
    // Infer collections from existing content
    const allContent = files.map((f) => f.content).join("\n");
    const inferred = inferCollectionsFromContent(allContent);
    setCollections(inferred);
    setSelectedCollections(new Set(inferred.map((c) => c.slug)));
    setOpen(true);
  }

  function toggleCollection(slug: string) {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(slug)) {
      newSelected.delete(slug);
    } else {
      newSelected.add(slug);
    }
    setSelectedCollections(newSelected);
  }

  async function handleEnable() {
    setLoading(true);

    try {
      const selectedCols = collections.filter((c) =>
        selectedCollections.has(c.slug)
      );
      const cmsFiles = generatePayloadFiles(projectName, selectedCols);
      onAddCmsFiles(cmsFiles);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          <Database className="h-4 w-4 mr-2" />
          Add CMS
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enable Payload CMS</DialogTitle>
          <DialogDescription>
            Add a content management system to your project. We&apos;ve detected
            some content types based on your website.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-4">
            <p className="text-sm font-medium">Detected Collections:</p>
            {collections.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No collections detected. A basic Pages collection will be created.
              </p>
            ) : (
              <div className="space-y-3">
                {collections.map((collection) => (
                  <div
                    key={collection.slug}
                    className="flex items-start space-x-3 p-3 rounded-lg border"
                  >
                    <Checkbox
                      id={collection.slug}
                      checked={selectedCollections.has(collection.slug)}
                      onCheckedChange={() => toggleCollection(collection.slug)}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={collection.slug}
                        className="font-medium cursor-pointer"
                      >
                        {collection.name}
                      </Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {collection.fields.slice(0, 4).map((field) => (
                          <Badge key={field.name} variant="secondary" className="text-xs">
                            {field.name}
                          </Badge>
                        ))}
                        {collection.fields.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{collection.fields.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="bg-muted/50 rounded-lg p-3 text-sm">
          <p className="font-medium mb-1">What this adds:</p>
          <ul className="text-muted-foreground space-y-1">
            <li>• Payload CMS configuration files</li>
            <li>• Collection schemas for your content</li>
            <li>• Admin panel at /admin</li>
            <li>• MongoDB database connection</li>
          </ul>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleEnable}
            disabled={loading || selectedCollections.size === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Enable CMS
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
