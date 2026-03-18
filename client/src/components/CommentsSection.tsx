import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commentApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface CommentsSectionProps {
  videoId: string;
}

export function CommentsSection({ videoId }: CommentsSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const [commentContent, setCommentContent] = useState("");
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: () => commentApi.getByVideoId(videoId),
  });

  const createMutation = useMutation({
    mutationFn: () => commentApi.create(videoId, commentContent),
    onSuccess: () => {
      setCommentContent("");
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => commentApi.delete(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
    },
  });

  const handleAddComment = () => {
    if (commentContent.trim()) {
      createMutation.mutate();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Comments ({comments.length})</h3>
      </div>

      {isAuthenticated && (
        <div className="space-y-3 bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
          <Textarea
            placeholder="Add a comment..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            className="min-h-24"
          />
          <Button
            onClick={handleAddComment}
            disabled={createMutation.isPending || !commentContent.trim()}
            className="w-full"
          >
            {createMutation.isPending ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      )}

      {!isAuthenticated && (
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          Sign in to comment
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div>Loading comments...</div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            No comments yet
          </div>
        ) : (
          comments.map((comment: any) => (
            <div key={comment.id} className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">User {comment.userId?.slice(0, 8)}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {format(new Date(comment.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                {user?.id === comment.userId && (
                  <button
                    onClick={() => deleteMutation.mutate(comment.id)}
                    disabled={deleteMutation.isPending}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
