import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { watchlistApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Bookmark } from "lucide-react";

interface WatchlistButtonProps {
  videoId: string;
  className?: string;
}

export function WatchlistButton({ videoId, className }: WatchlistButtonProps) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: checkResult } = useQuery({
    queryKey: ["watchlist-check", videoId],
    queryFn: () => watchlistApi.check(videoId),
    enabled: isAuthenticated,
  });

  const isInWatchlist = checkResult?.isInWatchlist ?? false;

  const addMutation = useMutation({
    mutationFn: () => watchlistApi.add(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist-check", videoId] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => watchlistApi.remove(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist-check", videoId] });
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const handleToggle = () => {
    if (!isAuthenticated) return;

    if (isInWatchlist) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = addMutation.isPending || removeMutation.isPending;

  return (
    <Button
      onClick={handleToggle}
      disabled={isLoading}
      variant={isInWatchlist ? "default" : "outline"}
      size="sm"
      className={className}
    >
      <Bookmark
        className={`w-4 h-4 mr-2 ${isInWatchlist ? "fill-current" : ""}`}
      />
      {isInWatchlist ? "Saved" : "Save"}
    </Button>
  );
}
