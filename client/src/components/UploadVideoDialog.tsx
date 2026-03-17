import { useState, useRef, useEffect } from "react";
import { Upload, Loader2, CheckCircle, FileVideo, X, Play, Pause } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { videoApi, categoryApi } from "@/lib/api";

interface UploadVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess?: () => void;
}

type Step = "idle" | "uploading" | "saving" | "done";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(secs: number): string {
  if (!isFinite(secs)) return "--:--";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function UploadVideoDialog({
  open,
  onOpenChange,
  onUploadSuccess,
}: UploadVideoDialogProps) {
  const { toast } = useToast();

  // Load real categories from DB (UUIDs)
  const { data: categories = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["categories"],
    queryFn: () => categoryApi.getAll(),
  });

  // form state
  const [isPaid, setIsPaid] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  // categoryId will be a real UUID from the DB, or empty string = no category
  const [categoryId, setCategoryId] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // preview player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // upload state
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [step, setStep] = useState<Step>("idle");
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  const handleFile = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast({ title: "Invalid file", description: "Please select a video file.", variant: "destructive" });
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setVideoDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setIsPlaying(true); }
    else { v.pause(); setIsPlaying(false); }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      toast({ title: "Missing title", description: "Please enter a video title.", variant: "destructive" });
      return;
    }
    if (!selectedFile) {
      toast({ title: "No file", description: "Please select a video file.", variant: "destructive" });
      return;
    }
    if (isPaid && (!price || parseFloat(price) <= 0)) {
      toast({ title: "Missing price", description: "Please enter a price for paid content.", variant: "destructive" });
      return;
    }

    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName === "your_cloud_name") {
      toast({ title: "Config error", description: "VITE_CLOUDINARY_CLOUD_NAME is not set in .env", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);
    setStep("uploading");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", "fandomforge_preset");

    try {
      // Step 1: upload file directly to Cloudinary from the browser
      const videoUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            if (!data.secure_url) {
              reject(new Error("Cloudinary did not return a URL. Check your upload preset is set to Unsigned."));
              return;
            }
            resolve(data.secure_url as string);
          } else {
            let msg = `Cloudinary error (${xhr.status})`;
            try { msg = JSON.parse(xhr.responseText)?.error?.message || msg; } catch {}
            reject(new Error(msg));
          }
        };
        xhr.onerror = () => reject(new Error("Network error — check your connection"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
        xhr.send(formData);
      });

      console.log("✅ Cloudinary URL:", videoUrl);

      // Step 2: save metadata to your DB — only pass categoryId when it's a real UUID
      setStep("saving");
      setUploadProgress(100);

      // Generate a thumbnail image URL from the video
      // Cloudinary transforms: so_0 = start frame at 0 seconds
      // Convert .mp4 to .jpg for the thumbnail
      const thumbnailUrl = videoUrl
        .replace(/\/upload\//, "/upload/so_0/")
        .replace(/\.[^/.]+$/, ".jpg");

      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl,
        thumbnailUrl,
        type: isPaid ? "paid" : "free",
        price: isPaid ? parseFloat(price) : 0,
      };

      // Only include categoryId when the user actually selected one (real UUID from DB)
      // Never pass the empty string — that would hit the FK constraint
      if (categoryId && categoryId.trim() !== "") {
        payload.categoryId = categoryId;
      }

      await videoApi.create(payload);

      setStep("done");
      toast({ title: "Uploaded!", description: `"${title}" is now live.` });

      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        onUploadSuccess?.();
      }, 1000);

    } catch (err) {
      console.error("Upload failed:", err);
      setStep("idle");
      setUploadProgress(0);
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      xhrRef.current = null;
    }
  };

  const handleCancel = () => {
    if (isLoading) xhrRef.current?.abort();
    resetForm();
    onOpenChange(false);
  };

  const resetForm = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setTitle(""); setDescription(""); setIsPaid(false);
    setPrice(""); setCategoryId(""); setSelectedFile(null);
    setPreviewUrl(null); setUploadProgress(0); setStep("idle");
    setIsDragging(false); setIsPlaying(false); setCurrentTime(0);
    setVideoDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const barColor =
    step === "done"     ? "#22c55e"
    : step === "saving" ? "#3b82f6"
    : "#a855f7";

  const stepLabel =
    step === "uploading" ? "Uploading to Cloudinary…"
    : step === "saving"  ? "Saving to database…"
    : step === "done"    ? "Done!"
    : "";

  const progressPct = step === "saving" || step === "done" ? 100 : uploadProgress;

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-lg">Upload New Video</DialogTitle>
          <DialogDescription className="text-sm">
            File uploads go straight from your browser to Cloudinary — no server size limit.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* ── Video preview ── */}
          {previewUrl ? (
            <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", background: "#000", aspectRatio: "16/9" }}>
              <video
                ref={videoRef}
                src={previewUrl}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                onLoadedMetadata={(e) => setVideoDuration((e.target as HTMLVideoElement).duration)}
                onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                onEnded={() => setIsPlaying(false)}
                playsInline
              />
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 45%)",
                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                padding: "10px 12px",
              }}>
                <input
                  type="range" min={0} max={videoDuration || 100} step={0.1} value={currentTime}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setCurrentTime(t);
                    if (videoRef.current) videoRef.current.currentTime = t;
                  }}
                  disabled={isLoading}
                  style={{ width: "100%", marginBottom: 6, accentColor: "#a855f7", cursor: "pointer" }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button onClick={togglePlay} disabled={isLoading} style={{
                    background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                    width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "#fff", flexShrink: 0,
                  }}>
                    {isPlaying ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
                  </button>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontVariantNumeric: "tabular-nums" }}>
                    {formatDuration(currentTime)} / {formatDuration(videoDuration)}
                  </span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginLeft: "auto" }}>
                    {selectedFile ? formatBytes(selectedFile.size) : ""}
                  </span>
                  {!isLoading && (
                    <button onClick={clearFile} style={{
                      background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "50%",
                      width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "#fff", flexShrink: 0,
                    }}>
                      <X style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Drop zone ── */
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragging ? "#a855f7" : "hsl(var(--border))"}`,
                borderRadius: 8, padding: "2rem 1rem", textAlign: "center",
                cursor: "pointer", transition: "border-color 0.2s",
                background: isDragging ? "rgba(168,85,247,0.06)" : "transparent",
              }}
            >
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Drop a video here, or click to browse</p>
              <p className="text-xs text-muted-foreground mt-1">MP4 · MOV · AVI · WebM</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
            disabled={isLoading}
            data-testid="input-file"
          />

          {/* ── Progress bar ── */}
          <div style={{ opacity: step === "idle" ? 0 : 1, transition: "opacity 0.2s", pointerEvents: "none" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: "hsl(var(--foreground))" }}>{stepLabel}</span>
              <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))", fontVariantNumeric: "tabular-nums" }}>
                {step === "uploading" ? `${uploadProgress}%` : ""}
              </span>
            </div>
            <div style={{ width: "100%", height: 8, borderRadius: 9999, background: "hsl(var(--muted))", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 9999, background: barColor,
                width: `${progressPct}%`,
                transition: "width 0.25s ease-out, background 0.4s",
              }} />
            </div>
          </div>

          {/* ── Title ── */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm">Title <span className="text-red-400">*</span></Label>
            <Input id="title" placeholder="Enter video title" value={title}
              onChange={(e) => setTitle(e.target.value)} disabled={isLoading} data-testid="input-title" />
          </div>

          {/* ── Description ── */}
          <div className="space-y-1">
            <Label htmlFor="description" className="text-sm">Description</Label>
            <Textarea id="description" placeholder="Describe your video" rows={2}
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="resize-none" disabled={isLoading} data-testid="input-description" />
          </div>

          {/* ── Category — loaded from DB so IDs are real UUIDs ── */}
          <div className="space-y-1">
            <Label htmlFor="category" className="text-sm">
              Category <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={isLoading}>
              <SelectTrigger id="category" data-testid="select-category">
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                {/* "no category" option — clears the selection */}
                <SelectItem value="none">No category</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
                {categories.length === 0 && (
                  <SelectItem value="empty" disabled>
                    No categories in DB yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* ── Premium toggle ── */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div>
              <p className="text-sm font-medium">Premium Content</p>
              <p className="text-xs text-muted-foreground">Subscribers only</p>
            </div>
            <Switch id="paid" checked={isPaid} onCheckedChange={setIsPaid}
              disabled={isLoading} data-testid="switch-premium" />
          </div>

          {isPaid && (
            <div className="space-y-1">
              <Label htmlFor="price" className="text-sm">Price ($)</Label>
              <Input id="price" type="number" placeholder="9.99" step="0.01" min="0.01"
                value={price} onChange={(e) => setPrice(e.target.value)}
                disabled={isLoading} data-testid="input-price" />
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
            {isLoading ? "Cancel upload" : "Cancel"}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isLoading || !selectedFile}
            className="min-w-[130px]"
            data-testid="button-submit-upload"
          >
            {step === "done"      ? <><CheckCircle className="w-4 h-4 mr-2" />Done!</> :
             step === "uploading" ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{uploadProgress}%</> :
             step === "saving"    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving…</> :
                                    <><Upload className="w-4 h-4 mr-2" />Upload Video</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}