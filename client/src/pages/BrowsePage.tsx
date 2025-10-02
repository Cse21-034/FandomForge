import { useState } from "react";
import { Header } from "@/components/Header";
import { VideoCard } from "@/components/VideoCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BrowsePage() {
  const [userRole] = useState<"creator" | "consumer" | null>("consumer");

  const allVideos = [
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
      title: "Advanced Photography Techniques",
      thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=450&fit=crop",
      duration: "28:45",
      isPaid: true,
      creatorName: "Mike Photos",
      creatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      views: 8900,
    },
    {
      id: "3",
      title: "Cooking Traditional Italian Pasta",
      thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=450&fit=crop",
      duration: "22:10",
      isPaid: false,
      creatorName: "Chef Antonio",
      creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      views: 15700,
    },
    {
      id: "4",
      title: "Music Production Masterclass",
      thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=450&fit=crop",
      duration: "45:20",
      isPaid: true,
      creatorName: "DJ Alex",
      creatorAvatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop",
      views: 6400,
    },
    {
      id: "5",
      title: "Digital Marketing 101",
      thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
      duration: "32:15",
      isPaid: true,
      creatorName: "Business Coach Lisa",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      views: 9200,
    },
    {
      id: "6",
      title: "Guitar Basics for Beginners",
      thumbnail: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&h=450&fit=crop",
      duration: "18:50",
      isPaid: false,
      creatorName: "Music Teacher Tom",
      creatorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop",
      views: 11300,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Browse Content</h1>
          <Select>
            <SelectTrigger className="w-48" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="views">Most Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="all" className="mb-8">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All Content</TabsTrigger>
            <TabsTrigger value="free" data-testid="tab-free">Free</TabsTrigger>
            <TabsTrigger value="premium" data-testid="tab-premium">Premium</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allVideos.map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="free" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allVideos.filter(v => !v.isPaid).map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="premium" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allVideos.filter(v => v.isPaid).map((video) => (
                <VideoCard key={video.id} {...video} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center mt-12">
          <Button variant="outline" data-testid="button-load-more">
            Load More
          </Button>
        </div>
      </div>
    </div>
  );
}
