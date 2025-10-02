import { VideoPlayer } from '../VideoPlayer';

export default function VideoPlayerExample() {
  return (
    <div className="p-4 max-w-4xl">
      <VideoPlayer
        isLocked={true}
        thumbnail="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=675&fit=crop"
        onUnlock={() => console.log('Unlock clicked')}
      />
    </div>
  );
}
