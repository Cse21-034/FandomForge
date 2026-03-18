import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageApi } from "@/lib/api";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { MessageCircle, Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

function ConversationSkeleton() {
  return (
    <div className="w-full text-left p-3 rounded-lg bg-slate-100 dark:bg-slate-800 space-y-2">
      <div className="h-4 rounded-full skeleton-wave w-3/4" />
      <div className="h-3 rounded-full skeleton-wave w-full" />
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="flex justify-start mb-4">
      <div className="max-w-xs rounded-lg p-3 space-y-2">
        <div className="h-3 rounded skeleton-wave w-48" />
        <div className="h-3 rounded skeleton-wave w-32" />
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [_location, navigate] = useLocation();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // All hooks must be called BEFORE any conditional returns
  const { data: inbox = [], isLoading: inboxLoading } = useQuery({
    queryKey: ["messages-inbox"],
    queryFn: () => messageApi.getInbox(),
    enabled: isAuthenticated && !authLoading,
  });

  const { data: conversation = [], isLoading: conversationLoading } = useQuery({
    queryKey: ["messages-conversation", selectedUserId],
    queryFn: () => messageApi.getConversation(selectedUserId!),
    enabled: !!selectedUserId && isAuthenticated && !authLoading,
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => {
      if (!selectedUserId) throw new Error("No user selected");
      return messageApi.send(selectedUserId, content);
    },
    onSuccess: () => {
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ["messages-conversation", selectedUserId] });
      queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Now we can do early returns after all hooks are declared
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <Header isAuthenticated={false} />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate("/");
    return null;
  }

  // Get unique conversation partners
  const conversationPartners = Array.from(
    new Map(
      inbox.flatMap((msg: any) => [
        [msg.senderId === user?.id ? msg.recipientId : msg.senderId, msg],
        [msg.recipientId === user?.id ? msg.senderId : msg.recipientId, msg],
      ])
    ).values()
  ).map((msg: any) => ({
    id: msg.senderId === user?.id ? msg.recipientId : msg.senderId,
    lastMessage: msg,
  }));

  const handleSendMessage = () => {
    if (messageContent.trim() && selectedUserId) {
      sendMutation.mutate(messageContent.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header
        isAuthenticated={isAuthenticated}
        userRole={user?.role as any}
        username={user?.username}
        profileImage={user?.profileImage}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <MessageCircle className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Messages</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Conversations List */}
          <div className="md:col-span-1 space-y-2">
            <h2 className="font-semibold text-lg">Conversations</h2>
            {inboxLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <ConversationSkeleton key={i} />
                ))}
              </div>
            ) : conversationPartners.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 py-4">
                No conversations yet
              </div>
            ) : (
              conversationPartners.map((partner: any) => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedUserId(partner.id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedUserId === partner.id
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="text-sm font-medium truncate">
                    User {partner.id.slice(0, 8)}
                  </div>
                  <div
                    className={`text-xs truncate ${
                      selectedUserId === partner.id
                        ? "text-blue-100"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {partner.lastMessage.content}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-lg shadow flex flex-col">
            {selectedUserId ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-96">
                  {conversationLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <MessageSkeleton key={i} />
                      ))}
                    </div>
                  ) : conversation.length === 0 ? (
                    <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                      No messages yet
                    </div>
                  ) : (
                    conversation.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.senderId === user?.id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs rounded-lg p-3 ${
                            msg.senderId === user?.id
                              ? "bg-blue-500 text-white"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.senderId === user?.id
                                ? "text-blue-100"
                                : "text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {format(new Date(msg.createdAt), "h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="border-t dark:border-slate-700 p-4 space-y-3">
                  <Textarea
                    placeholder="Type a message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="min-h-20"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sendMutation.isPending || !messageContent.trim()}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendMutation.isPending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-96 text-slate-500 dark:text-slate-400">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
