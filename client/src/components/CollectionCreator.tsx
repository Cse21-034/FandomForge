import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Plus, Trash2, GripVertical, Upload, X, Loader2,
  Film, ImageIcon, FileText, Eye, EyeOff, ExternalLink,
  ChevronDown, ChevronUp,
} from "lucide-react";

// ── Item icon mapping ─────────────────────────────────────────────
const ITEM_ICON: Record<string, any> = {
  video: Film,
  image: ImageIcon,
  text: FileText,
};

// ── Cloudinary direct upload ──────────────────────────────────────────
async function uploadToCloudinary(
  file: File,
  resourceType: "video" | "image" | "auto",
  onProgress?: (pct: number) => void
): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  // Fallback to "fandomforge_preset" — same preset used by UploadVideoDialog
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "fandomforge_preset";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", "fandomforge/collections");

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url);
      } else {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(formData);
  });
}

interface Props {
  creatorId: string;
}

type UploadingFile = {
  id: string;
  name: string;
  type: "video" | "image" | "text";
  progress: number;
  status: "uploading" | "done" | "error";
  url?: string;
};

export function CollectionCreator({ creatorId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", type: "series", price: "9.99", thumbnailUrl: "" });
  const [uploading, setUploading] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [textPost, setTextPost] = useState({ title: "", content: "" });
  const [showTextForm, setShowTextForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  const { data: collectionsData = [], isLoading } = useQuery({
    queryKey: ["creator-collections", creatorId],
    queryFn: () => collectionApi.getByCreatorId(creatorId),
  });

  const { data: editingCollection } = useQuery({
    queryKey: ["collection", editingId],
    queryFn: () => collectionApi.getById(editingId!),
    enabled: !!editingId,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => collectionApi.create(data),
    onSuccess: (collection: any) => {
      queryClient.invalidateQueries({ queryKey: ["creator-collections", creatorId] });
      setEditingId(collection.id);
      setView("edit");
      toast({ title: "Collection created! Now add your items." });
    },
    onError: () => toast({ title: "Failed to create collection", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => collectionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", editingId] });
      queryClient.invalidateQueries({ queryKey: ["creator-collections", creatorId] });
      toast({ title: "Saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => collectionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creator-collections", creatorId] });
      toast({ title: "Collection deleted" });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: ({ collectionId, itemId }: { collectionId: string; itemId: string }) =>
      collectionApi.deleteItem(collectionId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["collection", editingId] }),
  });

  const reorderMutation = useMutation({
    mutationFn: ({ collectionId, orderedIds }: { collectionId: string; orderedIds: string[] }) =>
      collectionApi.reorder(collectionId, orderedIds),
  });

  const addTextMutation = useMutation({
    mutationFn: (data: any) => collectionApi.addItem(editingId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", editingId] });
      setTextPost({ title: "", content: "" });
      setShowTextForm(false);
      toast({ title: "Text post added" });
    },
  });

const handleFiles = useCallback(async (files: File[]) => {
  if (!editingId) return;

  const newUploads: UploadingFile[] = files.map((f) => ({
    id: Math.random().toString(36).slice(2),
    name: f.name,
    type: f.type.startsWith("video/") ? "video" : "image",
    progress: 0,
    status: "uploading",
  }));

  setUploading((prev) => [...prev, ...newUploads]);
  const currentItems: any[] = (editingCollection as any)?.items ?? [];

  await Promise.all(
    files.map(async (file, i) => {
      const uid = newUploads[i].id;
      const resourceType = file.type.startsWith("video/") ? "video" : "image";
      try {
        const url = await uploadToCloudinary(file, resourceType, (pct) => {
          setUploading((prev) =>
            prev.map((u) => (u.id === uid ? { ...u, progress: pct } : u))
          );
        });

        // ── Save url to the correct field based on type ──
        await collectionApi.addItem(editingId, {
          itemType: resourceType,
          ...(resourceType === "video" 
            ? { videoUrl: url }      // ← video URL stored directly
            : { imageUrl: url }),    // ← image URL stored directly
          title: file.name.replace(/\.[^.]+$/, ""),
          position: currentItems.length + i + 1,
        });

        queryClient.invalidateQueries({ queryKey: ["collection", editingId] });
        setUploading((prev) =>
          prev.map((u) => (u.id === uid ? { ...u, status: "done" as const, url } : u))
        );
      } catch {
        setUploading((prev) =>
          prev.map((u) => (u.id === uid ? { ...u, status: "error" as const } : u))
        );
      }
    })
  );

  setTimeout(() => setUploading((prev) => prev.filter((u) => u.status !== "done")), 2000);
}, [editingId, editingCollection, queryClient]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.type.startsWith("video/") || f.type.startsWith("image/")
    );
    if (files.length) handleFiles(files);
  };

  const handleItemDragStart = (id: string) => setDraggedItemId(id);
  const handleItemDrop = async (targetId: string) => {
    if (!draggedItemId || draggedItemId === targetId || !editingId || !editingCollection) return;
    const items: any[] = [...(editingCollection as any).items];
    const fromIdx = items.findIndex((i: any) => i.id === draggedItemId);
    const toIdx = items.findIndex((i: any) => i.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const reordered = [...items];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const orderedIds = reordered.map((i: any) => i.id);
    await reorderMutation.mutateAsync({ collectionId: editingId, orderedIds });
    queryClient.invalidateQueries({ queryKey: ["collection", editingId] });
    setDraggedItemId(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── LIST VIEW ────────────────────────────────────────────────────────
  if (view === "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold font-display text-sm text-muted-foreground uppercase tracking-wider">
            Your Collections
          </h2>
          <Button
            size="sm"
            className="rounded-full text-white border-none"
            style={{ background: "hsl(var(--primary))" }}
            onClick={() => { setForm({ title: "", description: "", type: "series", price: "9.99", thumbnailUrl: "" }); setView("create"); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New Collection
          </Button>
        </div>

        {(collectionsData as any[]).length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border bg-muted/20">
            <Film className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">No collections yet</p>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => setView("create")}>
              Create your first collection
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {(collectionsData as any[]).map((col) => (
            <div key={col.id} className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
              {col.thumbnailUrl ? (
                <img src={col.thumbnailUrl} className="h-12 w-20 object-cover rounded-xl flex-shrink-0" alt={col.title} />
              ) : (
                <div className="h-12 w-20 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Film className="h-5 w-5 text-muted-foreground/40" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{col.title}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    col.isPublished
                      ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {col.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground capitalize">{col.type} · ${col.price}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" className="rounded-full h-8 px-3 text-xs"
                  onClick={() => { setEditingId(col.id); setView("edit"); }}>
                  Edit
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full h-8 w-8 p-0 text-destructive hover:text-destructive"
                  onClick={() => deleteMutation.mutate(col.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── CREATE VIEW ──────────────────────────────────────────────────────
  if (view === "create") {
    return (
      <div className="space-y-4">
        <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← Back to collections
        </button>
        <h2 className="font-bold font-display text-base">New Collection</h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Title *</label>
            <input
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="e.g. Complete React Tutorial Series"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              rows={3}
              placeholder="What will viewers learn or see?"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="series">Series (videos)</option>
                <option value="course">Course (mixed)</option>
                <option value="gallery">Gallery (images)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Bundle price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.99"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="rounded-full flex-1" onClick={() => setView("list")}>
            Cancel
          </Button>
          <Button
            className="rounded-full flex-1 text-white border-none"
            style={{ background: "hsl(var(--primary))" }}
            disabled={!form.title.trim() || createMutation.isPending}
            onClick={() => createMutation.mutate(form)}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create & Add Items"}
          </Button>
        </div>
      </div>
    );
  }

  // ── EDIT VIEW ────────────────────────────────────────────────────────
  const items: any[] = (editingCollection as any)?.items ?? [];
  const ec = editingCollection as any;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => { setView("list"); setEditingId(null); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          ← All collections
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="rounded-full h-8 gap-1 text-xs"
            onClick={() => window.open(`/collection/${editingId}`, "_blank")}>
            <ExternalLink className="h-3 w-3" />
            Preview
          </Button>
          <Button
            size="sm"
            className="rounded-full h-8 text-xs text-white border-none"
            style={{ background: ec?.isPublished ? "hsl(var(--muted))" : "hsl(var(--primary))" }}
            onClick={() => updateMutation.mutate({ id: editingId!, data: { isPublished: !ec?.isPublished } })}
          >
            {ec?.isPublished
              ? <><EyeOff className="h-3 w-3 mr-1" />Unpublish</>
              : <><Eye className="h-3 w-3 mr-1" />Publish</>
            }
          </Button>
        </div>
      </div>

      <div>
        <p className="font-bold text-base">{ec?.title}</p>
        <p className="text-xs text-muted-foreground">{items.length} items · ${ec?.price}</p>
      </div>

      {/* Batch upload drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium">Drop videos or images here</p>
        <p className="text-xs text-muted-foreground mt-1">or click to browse — multiple files allowed</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) handleFiles(files);
            e.target.value = "";
          }}
        />
      </div>

      {/* Upload progress */}
      {uploading.length > 0 && (
        <div className="space-y-2">
          {uploading.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-muted/40 rounded-xl">
              {u.type === "video"
                ? <Film className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                : <ImageIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{u.name}</p>
                {u.status === "uploading" && (
                  <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${u.progress}%`, background: "hsl(var(--primary))" }} />
                  </div>
                )}
              </div>
              <span className="text-xs flex-shrink-0 text-muted-foreground">
                {u.status === "uploading" ? `${u.progress}%` : u.status === "done" ? "✓" : "✗"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add text post */}
      <div>
        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full p-3 rounded-xl border border-dashed border-border hover:border-primary/40 transition-colors"
          onClick={() => setShowTextForm(!showTextForm)}
        >
          <FileText className="h-4 w-4" />
          Add a text post
          {showTextForm ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
        </button>
        {showTextForm && (
          <div className="mt-2 space-y-2 p-3 bg-muted/30 rounded-xl">
            <input
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none"
              placeholder="Post title"
              value={textPost.title}
              onChange={(e) => setTextPost({ ...textPost, title: e.target.value })}
            />
            <textarea
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none resize-none"
              rows={4}
              placeholder="Write your post content..."
              value={textPost.content}
              onChange={(e) => setTextPost({ ...textPost, content: e.target.value })}
            />
            <Button
              size="sm"
              className="rounded-full text-white border-none"
              style={{ background: "hsl(var(--primary))" }}
              disabled={!textPost.content.trim() || addTextMutation.isPending}
              onClick={() => addTextMutation.mutate({
                itemType: "text",
                title: textPost.title,
                textContent: textPost.content,
                position: items.length + 1,
              })}
            >
              {addTextMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add Post"}
            </Button>
          </div>
        )}
      </div>

      {/* Items list */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Items — drag to reorder
          </p>
          {items.map((item: any, idx: number) => {
            const ItemIcon = ITEM_ICON[item.itemType] || Film;
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleItemDragStart(item.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleItemDrop(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                  draggedItemId === item.id
                    ? "opacity-50 border-primary"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold bg-muted text-muted-foreground">
                  {idx + 1}
                </div>
                <ItemIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.title || `Episode ${item.position}`}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {item.itemType}
                    {idx === 0 && <span className="ml-1 text-primary">· free preview</span>}
                  </p>
                </div>
                {item.itemType === "image" && item.imageUrl && (
                  <img src={item.imageUrl} className="h-8 w-12 object-cover rounded-lg flex-shrink-0" alt="" />
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full h-7 w-7 p-0 text-destructive hover:text-destructive flex-shrink-0"
                  onClick={() => deleteItemMutation.mutate({ collectionId: editingId!, itemId: item.id })}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {items.length === 0 && uploading.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No items yet — upload videos or images above
        </div>
      )}
    </div>
  );
}