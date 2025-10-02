import { useState } from "react";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { UploadVideoDialog } from "@/components/UploadVideoDialog";
import { VideoCard } from "@/components/VideoCard";
import { DollarSign, Users, Video as VideoIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CreatorDashboard() {
  const [userRole] = useState<"creator" | "consumer" | null>("creator");

  const myVideos = [
    {
      id: "1",
      title: "Morning Yoga Routine for Beginners",
      thumbnail: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop",
      duration: "15:32",
      isPaid: false,
      creatorName: "Sarah Wellness",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      views: 12500,
    },
    {
      id: "2",
      title: "Advanced Yoga Poses",
      thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=450&fit=crop",
      duration: "25:18",
      isPaid: true,
      creatorName: "Sarah Wellness",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      views: 8200,
    },
    {
      id: "3",
      title: "Meditation for Stress Relief",
      thumbnail: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=450&fit=crop",
      duration: "18:45",
      isPaid: true,
      creatorName: "Sarah Wellness",
      creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      views: 6800,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Creator Dashboard</h1>
            <p className="text-muted-foreground">Manage your content and track your growth</p>
          </div>
          <UploadVideoDialog />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard
            title="Total Earnings"
            value="$2,847"
            icon={DollarSign}
            description="+12% from last month"
          />
          <StatCard
            title="Active Subscribers"
            value="1,234"
            icon={Users}
            description="+45 this week"
          />
          <StatCard
            title="Total Videos"
            value="156"
            icon={VideoIcon}
            description="8 uploaded this month"
          />
        </div>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all-videos">All Videos</TabsTrigger>
            <TabsTrigger value="published" data-testid="tab-published">Published</TabsTrigger>
            <TabsTrigger value="drafts" data-testid="tab-drafts">Drafts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myVideos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="published" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myVideos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="drafts" className="mt-8">
            <div className="text-center py-12 text-muted-foreground">
              No drafts yet
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
