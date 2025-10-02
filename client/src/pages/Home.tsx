import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { VideoCard } from "@/components/VideoCard";
import { CreatorCard } from "@/components/CreatorCard";
import { Play, Users, DollarSign, Sparkles } from "lucide-react";

export default function Home() {
  const [userRole] = useState<"creator" | "consumer" | null>(null);

  const featuredVideos = [
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
  ];

  const featuredCreators = [
    {
      id: "1",
      name: "Sarah Wellness",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      banner: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=200&fit=crop",
      bio: "Fitness & wellness coach helping you live your best life",
      subscriberCount: 12500,
      videoCount: 156,
      subscriptionPrice: 9.99,
    },
    {
      id: "2",
      name: "Mike Photos",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      banner: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=200&fit=crop",
      bio: "Professional photographer sharing tips and tricks",
      subscriberCount: 8900,
      videoCount: 89,
      subscriptionPrice: 14.99,
    },
    {
      id: "3",
      name: "Chef Antonio",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      banner: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=200&fit=crop",
      bio: "Italian chef teaching authentic recipes from Italy",
      subscriberCount: 15700,
      videoCount: 203,
      subscriptionPrice: 12.99,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userRole={userRole} />
      
      <div className="relative h-96 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1920&h=800&fit=crop')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />
        <div className="relative container mx-auto px-4 h-full flex flex-col items-center justify-center text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Discover Amazing Content
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mb-8">
            Support your favorite creators and get exclusive access to premium content
          </p>
          <div className="flex gap-4">
            <Link href="/browse">
              <Button size="lg" data-testid="button-browse-content">
                <Play className="mr-2 h-5 w-5" />
                Browse Content
              </Button>
            </Link>
            <Link href="/become-creator">
              <Button size="lg" variant="outline" data-testid="button-become-creator">
                <Sparkles className="mr-2 h-5 w-5" />
                Become a Creator
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-8">
            <div className="bg-primary/10 rounded-full p-6 w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Connect with Creators</h3>
            <p className="text-muted-foreground">
              Follow and support your favorite content creators
            </p>
          </div>
          <div className="text-center p-8">
            <div className="bg-primary/10 rounded-full p-6 w-fit mx-auto mb-4">
              <Play className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Exclusive Content</h3>
            <p className="text-muted-foreground">
              Access premium videos and behind-the-scenes content
            </p>
          </div>
          <div className="text-center p-8">
            <div className="bg-primary/10 rounded-full p-6 w-fit mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Support Creators</h3>
            <p className="text-muted-foreground">
              Help creators earn from their passion and work
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Featured Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredVideos.map((video) => (
              <VideoCard key={video.id} {...video} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-8">Featured Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCreators.map((creator) => (
              <CreatorCard key={creator.id} {...creator} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
