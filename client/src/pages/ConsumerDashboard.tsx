import { useState } from "react";
import { Header } from "@/components/Header";
import { CreatorCard } from "@/components/CreatorCard";
import { VideoCard } from "@/components/VideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConsumerDashboard() {
  const [userRole] = useState<"creator" | "consumer" | null>("consumer");

  const subscriptions = [
    {
      id: "1",
      name: "Sarah Wellness",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      banner: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=200&fit=crop",
      bio: "Fitness & wellness coach helping you live your best life",
      subscriberCount: 12500,
      videoCount: 156,
      subscriptionPrice: 9.99,
      isSubscribed: true,
    },
    {
      id: "2",
      name: "Chef Antonio",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      banner: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=200&fit=crop",
      bio: "Italian chef teaching authentic recipes from Italy",
      subscriberCount: 15700,
      videoCount: 203,
      subscriptionPrice: 12.99,
      isSubscribed: true,
    },
  ];

  const recommendedVideos = [
    {
      id: "1",
      title: "Evening Meditation Practice",
      thumbnail: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=450&fit=crop",
      duration: "20:15",
      isPaid: true,
      creatorName: "Sarah Wellness",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      views: 7500,
    },
    {
      id: "2",
      title: "Homemade Pizza Dough",
      thumbnail: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&h=450&fit=crop",
      duration: "18:30",
      isPaid: true,
      creatorName: "Chef Antonio",
      creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      views: 11200,
    },
    {
      id: "3",
      title: "Strength Training Basics",
      thumbnail: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=450&fit=crop",
      duration: "25:45",
      isPaid: true,
      creatorName: "Sarah Wellness",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      views: 9300,
    },
    {
      id: "4",
      title: "Italian Desserts Collection",
      thumbnail: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&h=450&fit=crop",
      duration: "30:20",
      isPaid: true,
      creatorName: "Chef Antonio",
      creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      views: 13100,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Subscriptions</h1>

        <Tabs defaultValue="subscriptions">
          <TabsList className="mb-8">
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">Active Subscriptions</TabsTrigger>
            <TabsTrigger value="content" data-testid="tab-content">Recommended Content</TabsTrigger>
          </TabsList>
          
          <TabsContent value="subscriptions">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((creator) => (
                <CreatorCard key={creator.id} {...creator} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="content">
            <h2 className="text-2xl font-semibold mb-6">New Videos from Your Subscriptions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedVideos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
