import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface CreatorCardProps {
  id: string;
  name: string;
  avatar?: string;
  banner?: string;
  bio: string;
  subscriberCount: number;
  videoCount: number;
  subscriptionPrice: number;
  isSubscribed?: boolean;
  onSubscribe?: () => void;
}

export function CreatorCard({
  name,
  avatar,
  banner,
  bio,
  subscriberCount,
  videoCount,
  subscriptionPrice,
  isSubscribed = false,
  onSubscribe,
}: CreatorCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate active-elevate-2 transition-all" data-testid={`card-creator-${name.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="relative h-32 bg-gradient-to-r from-primary/20 to-accent/20">
        {banner && (
          <img src={banner} alt={name} className="w-full h-full object-cover" />
        )}
      </div>
      <div className="px-6 pb-6">
        <div className="flex flex-col items-center -mt-12">
          <Avatar className="h-24 w-24 border-4 border-card">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h3 className="mt-4 text-xl font-semibold text-center">{name}</h3>
          <p className="text-sm text-muted-foreground text-center mt-2 line-clamp-2">
            {bio}
          </p>
          <div className="flex gap-4 mt-4">
            <div className="text-center">
              <div className="font-semibold">{subscriberCount.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Subscribers</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{videoCount}</div>
              <div className="text-xs text-muted-foreground">Videos</div>
            </div>
          </div>
          <div className="w-full mt-6">
            {isSubscribed ? (
              <Badge className="w-full justify-center py-2" variant="secondary">
                Subscribed
              </Badge>
            ) : (
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={onSubscribe}
                  data-testid="button-subscribe"
                >
                  Subscribe - ${subscriptionPrice}/mo
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or pay with</span>
                  </div>
                </div>
                <div className="bg-[#0070BA] hover-elevate active-elevate-2 text-white rounded-md py-2 px-4 text-center font-semibold cursor-pointer" onClick={onSubscribe} data-testid="button-paypal-subscribe">
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-bold">Pay</span>
                    <span className="font-bold">Pal</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
