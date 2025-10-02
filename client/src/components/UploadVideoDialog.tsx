import { useState } from "react";
import { Upload, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export function UploadVideoDialog() {
  const [open, setOpen] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleUpload = () => {
    console.log("Upload video triggered");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-upload-video">
          <Upload className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl" data-testid="dialog-upload-video">
        <DialogHeader>
          <DialogTitle>Upload New Video</DialogTitle>
          <DialogDescription>
            Share your content with your subscribers
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="border-2 border-dashed rounded-lg p-8 text-center hover-elevate cursor-pointer">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              {selectedFile ? selectedFile.name : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              MP4, MOV or AVI (max. 2GB)
            </p>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              data-testid="input-file"
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter video title"
                data-testid="input-title"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your video"
                rows={4}
                data-testid="input-description"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select>
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="fitness">Fitness</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="lifestyle">Lifestyle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="paid">Premium Content</Label>
                <p className="text-sm text-muted-foreground">
                  Only subscribers can access this video
                </p>
              </div>
              <Switch
                id="paid"
                checked={isPaid}
                onCheckedChange={setIsPaid}
                data-testid="switch-premium"
              />
            </div>

            {isPaid && (
              <div>
                <Label htmlFor="price">Price (for non-subscribers)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="5.00"
                  step="0.01"
                  data-testid="input-price"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleUpload} data-testid="button-submit-upload">
              Upload Video
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
