import { VideoCard } from '../VideoCard';

export default function VideoCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <VideoCard
        id="1"
        title="Morning Yoga Routine for Beginners"
        thumbnail="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop"
        duration="15:32"
        isPaid={false}
        creatorName="Sarah Wellness"
        creatorAvatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
        views={12500}
        onClick={() => console.log('Video clicked')}
      />
    </div>
  );
}
