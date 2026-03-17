import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { profileApi, videoApi } from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VideoCard } from "@/components/VideoCard";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  Camera, Pencil, Check, X, Loader2, User, Mail, Video,
  Users, DollarSign, Eye, Shield, LogOut, ChevronRight,
  ImagePlus, Sparkles,
} from "lucide-react";

// ── Avatar upload area ─────────────────────────────────────────────
function AvatarUpload({
  currentImage,
  username,
  onUploadComplete,
}: {
  currentImage?: string;
  username: string;
  onUploadComplete: (url: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const initials = username.slice(0, 2).toUpperCase();
  const displayImage = preview || currentImage;

  const handleFile = useCallback(
    async (file: File | null | undefined) => {
      if (!file) return;

      // Validate type
      if (!file.type.startsWith("image/")) {
        toast({ title: "Please select an image file", variant: "destructive" });
        return;
      }
      // Validate size (5 MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Image must be under 5 MB", variant: "destructive" });
        return;
      }

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);

      setIsUploading(true);
      try {
        const cloudinaryUrl = await profileApi.uploadImageToCloudinary(file);
        await profileApi.updateProfileImage(cloudinaryUrl);
        onUploadComplete(cloudinaryUrl);
        toast({ title: "Profile photo updated! 🎉" });
      } catch (err) {
        setPreview(null);
        URL.revokeObjectURL(objectUrl);
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Something went wrong",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [onUploadComplete, toast]
  );

  return (
    <div className="relative inline-block">
      {/* Avatar circle */}
      <div
        className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 ${
          isDragging ? "scale-105 ring-4 ring-primary/50" : "hover:scale-105"
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
      >
        {displayImage ? (
          <img
            src={displayImage}
            alt={username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-white text-3xl font-bold"
            style={{
              background: "linear-gradient(135deg, hsl(350,100%,65%), hsl(195,100%,50%))",
            }}
          >
            {initials}
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center gap-1">
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <>
                <Camera className="h-6 w-6 text-white" />
                <span className="text-white text-xs font-medium">Change</span>
              </>
            )}
          </div>
        </div>

        {/* Loading spinner overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-7 w-7 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Camera button badge */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={isUploading}
        className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 border-2 border-background"
        style={{ background: "hsl(var(--primary))" }}
        aria-label="Upload profile photo"
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4 text-white" />
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={isUploading}
      />
    </div>
  );
}

// ── Inline editable field ──────────────────────────────────────────
function EditableField({
  label,
  value,
  multiline = false,
  onSave,
  placeholder,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  onSave: (val: string) => Promise<void>;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  return (
    <div className="group">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
        {label}
      </p>
      {editing ? (
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="rounded-2xl resize-none text-sm"
              autoFocus
            />
          ) : (
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="rounded-2xl h-10 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          )}
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl h-8 px-4 font-semibold text-white border-none"
              style={{ background: "hsl(var(--primary))" }}
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <><Check className="h-3.5 w-3.5 mr-1" /> Save</>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="rounded-xl h-8 px-4"
            >
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="flex items-start gap-2 cursor-pointer group/field"
          onClick={() => { setDraft(value); setEditing(true); }}
        >
          <p className={`text-sm flex-1 ${!value ? "text-muted-foreground italic" : "text-foreground"}`}>
            {value || placeholder || "Not set"}
          </p>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground/0 group-hover/field:text-muted-foreground transition-all flex-shrink-0 mt-0.5" />
        </div>
      )}
    </div>
  );
}

// ── Main ProfilePage ───────────────────────────────────────────────
export default function ProfilePage() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [_location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state that mirrors user data (updated optimistically)
  const [localUser, setLocalUser] = useState<typeof user>(null);
  const effectiveUser = localUser || user;

  // Fetch user's videos (if creator)
  const { data: myVideos = [] } = useQuery({
    queryKey: ["creator-videos", effectiveUser?.creator?.id],
    queryFn: () => videoApi.getByCreatorId(effectiveUser!.creator!.id),
    enabled: !!effectiveUser?.creator?.id,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center animate-pulse"
            style={{ background: "hsl(var(--primary) / 0.15)" }}
          >
            <User className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <p className="text-sm text-muted-foreground">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !effectiveUser) {
    navigate("/auth");
    return null;
  }

  const isCreator = effectiveUser.role === "creator";

  // ── Optimistic update helper ───────────────────────────────────
  const applyUpdate = (patch: Partial<typeof effectiveUser>) => {
    setLocalUser((prev) => ({ ...(prev || effectiveUser!), ...patch } as typeof user));
    // Also invalidate the auth/me cache so header updates too
    queryClient.invalidateQueries({ queryKey: ["auth-me"] });
  };

  const handleUsernameUpdate = async (val: string) => {
    try {
      const updated = await profileApi.updateProfile({ username: val });
      applyUpdate({ username: updated.username });
      toast({ title: "Username updated ✓" });
    } catch (err) {
      toast({
        title: "Failed to update username",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleBioUpdate = async (val: string) => {
    try {
      const updated = await profileApi.updateProfile({ bio: val });
      applyUpdate({ bio: updated.bio });
      toast({ title: "Bio updated ✓" });
    } catch (err) {
      toast({
        title: "Failed to update bio",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
      throw err;
    }
  };

  const handleImageUploadComplete = (url: string) => {
    applyUpdate({ profileImage: url });
  };

  const totalViews = myVideos.reduce(
    (sum: number, v: any) => sum + (v.views || 0),
    0
  );

  return (
    <div className="min-h-screen bg-background mobile-content-pad">
      <Header
        isAuthenticated={isAuthenticated}
        userRole={effectiveUser.role as "creator" | "consumer"}
        username={effectiveUser.username}
        profileImage={effectiveUser.profileImage}
        onLogout={logout}
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 page-enter space-y-5">

        {/* ── Profile card ── */}
        <div className="bg-card border border-card-border rounded-3xl overflow-hidden">
          {/* Cover / gradient banner */}
          <div
            className="h-28 sm:h-36 relative"
            style={{
              background:
                "linear-gradient(135deg, hsl(350 100% 65% / 0.7) 0%, hsl(195 100% 50% / 0.5) 50%, hsl(280 70% 60% / 0.4) 100%)",
            }}
          >
            {/* Noise texture */}
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.07'/%3E%3C/svg%3E\")",
              }}
            />
            {/* Role badge */}
            <div className="absolute top-3 right-3">
              <span
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white"
                style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }}
              >
                <Sparkles className="h-3 w-3" />
                {isCreator ? "Creator" : "Fan"}
              </span>
            </div>
          </div>

          <div className="px-5 sm:px-6 pb-6">
            {/* Avatar — overlaps banner */}
            <div className="-mt-14 sm:-mt-16 mb-4 flex items-end justify-between">
              <AvatarUpload
                currentImage={effectiveUser.profileImage ?? undefined}
                username={effectiveUser.username}
                onUploadComplete={handleImageUploadComplete}
              />
              <p className="text-xs text-muted-foreground pb-1">
                Tap photo to change
              </p>
            </div>

            {/* Name & role */}
            <div className="mb-5">
              <h1 className="text-2xl font-bold font-display leading-tight">
                {effectiveUser.username}
              </h1>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5" />
                {effectiveUser.email}
              </p>
            </div>

            {/* Editable fields */}
            <div className="space-y-5 divide-y divide-border">
              <EditableField
                label="Username"
                value={effectiveUser.username}
                onSave={handleUsernameUpdate}
                placeholder="Enter your username"
              />
              <div className="pt-5">
                <EditableField
                  label="Bio"
                  value={effectiveUser.bio || ""}
                  multiline
                  onSave={handleBioUpdate}
                  placeholder="Tell people a little about yourself…"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Creator stats (only for creators) ── */}
        {isCreator && (
          <div className="bg-card border border-card-border rounded-3xl p-5">
            <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Creator Stats
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: "Videos",
                  value: myVideos.length,
                  icon: Video,
                  color: "hsl(var(--primary))",
                  bg: "hsl(var(--primary) / 0.10)",
                },
                {
                  label: "Subscribers",
                  value: effectiveUser.creator?.totalSubscribers || 0,
                  icon: Users,
                  color: "hsl(195 100% 42%)",
                  bg: "hsl(195 100% 50% / 0.10)",
                },
                {
                  label: "Total Views",
                  value:
                    totalViews >= 1000
                      ? `${(totalViews / 1000).toFixed(1)}K`
                      : totalViews,
                  icon: Eye,
                  color: "hsl(43 100% 45%)",
                  bg: "hsl(43 100% 55% / 0.10)",
                },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div
                  key={label}
                  className="rounded-2xl p-3 sm:p-4 text-center"
                  style={{ background: bg }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: "hsl(var(--card))" }}
                  >
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <p className="text-lg sm:text-xl font-bold font-display leading-none">
                    {value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Creator subscription price ── */}
        {isCreator && effectiveUser.creator && (
          <div className="bg-card border border-card-border rounded-3xl p-5">
            <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-4">
              Subscription Settings
            </h2>
            <SubscriptionPriceEditor
              currentPrice={parseFloat(effectiveUser.creator.subscriptionPrice || "9.99")}
              onSave={async (price) => {
                await profileApi.updateCreatorSettings({ subscriptionPrice: price });
                applyUpdate({
                  creator: {
                    ...effectiveUser.creator!,
                    subscriptionPrice: price.toFixed(2),
                  },
                });
                toast({ title: "Subscription price updated ✓" });
              }}
            />
          </div>
        )}

        {/* ── Recent videos (creator only) ── */}
        {isCreator && myVideos.length > 0 && (
          <div className="bg-card border border-card-border rounded-3xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider">
                Your Videos
              </h2>
              <button
                onClick={() => navigate("/creator/dashboard")}
                className="text-xs font-semibold flex items-center gap-0.5"
                style={{ color: "hsl(var(--primary))" }}
              >
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myVideos.slice(0, 4).map((video: any) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => navigate(`/video/${video.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Account actions ── */}
        <div className="bg-card border border-card-border rounded-3xl overflow-hidden">
          <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider px-5 pt-5 mb-2">
            Account
          </h2>

          <div className="divide-y divide-border">
            {/* Security (placeholder) */}
            <button className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors text-left group">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(150 60% 42% / 0.10)" }}
              >
                <Shield className="h-4 w-4" style={{ color: "hsl(150 60% 38%)" }} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Security & Password</p>
                <p className="text-xs text-muted-foreground">Change your password</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </button>

            {/* Go to dashboard */}
            {isCreator && (
              <button
                onClick={() => navigate("/creator/dashboard")}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors text-left group"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--primary) / 0.10)" }}
                >
                  <DollarSign className="h-4 w-4" style={{ color: "hsl(var(--primary))" }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Creator Studio</p>
                  <p className="text-xs text-muted-foreground">Manage videos & earnings</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
              </button>
            )}

            {/* Sign out */}
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="w-full flex items-center gap-3 px-5 py-4 hover:bg-destructive/5 transition-colors text-left group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-destructive/10">
                <LogOut className="h-4 w-4 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-destructive">Sign Out</p>
                <p className="text-xs text-muted-foreground">Log out of your account</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Subscription price editor sub-component ────────────────────────
function SubscriptionPriceEditor({
  currentPrice,
  onSave,
}: {
  currentPrice: number;
  onSave: (price: number) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(currentPrice));
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    const price = parseFloat(draft);
    if (isNaN(price) || price < 0) {
      toast({ title: "Please enter a valid price", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await onSave(price);
      setEditing(false);
    } catch {
      toast({ title: "Failed to update price", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
            Monthly Price
          </p>
          <p className="text-xs text-muted-foreground">
            Fans pay this to access your premium content
          </p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors hover:bg-muted"
            style={{ color: "hsl(var(--primary))", borderColor: "hsl(var(--primary) / 0.30)" }}
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="pl-7 rounded-2xl h-10 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
            />
          </div>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl h-10 px-4 font-semibold text-white border-none"
            style={{ background: "hsl(var(--primary))" }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setDraft(String(currentPrice)); setEditing(false); }}
            disabled={saving}
            className="rounded-xl h-10 w-10 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer hover:bg-muted/40 transition-colors"
          onClick={() => setEditing(true)}
          style={{ background: "hsl(var(--primary) / 0.06)" }}
        >
          <DollarSign className="h-5 w-5" style={{ color: "hsl(var(--primary))" }} />
          <span className="text-2xl font-bold font-display" style={{ color: "hsl(var(--primary))" }}>
            ${currentPrice.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">/ month</span>
        </div>
      )}
    </div>
  );
}