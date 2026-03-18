import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SendMessageDialogProps {
  recipientId: string;
  recipientName: string;
}

export function SendMessageDialog({ recipientId, recipientName }: SendMessageDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: () => messageApi.send(recipientId, content),
    onSuccess: () => {
      setContent("");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
      queryClient.invalidateQueries({ queryKey: ["messages-unread-count"] });
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (content.trim()) {
      sendMutation.mutate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Mail className="w-4 h-4 mr-2" />
          Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Message</DialogTitle>
          <DialogDescription>
            Send a direct message to {recipientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder="Type your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32"
          />
          <Button
            onClick={handleSend}
            disabled={sendMutation.isPending || !content.trim()}
            className="w-full"
          >
            {sendMutation.isPending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
