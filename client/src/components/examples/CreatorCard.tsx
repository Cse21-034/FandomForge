import { CreatorCard } from '../CreatorCard';

export default function CreatorCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <CreatorCard
        id="1"
        name="Sarah Wellness"
        avatar="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop"
        banner="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=200&fit=crop"
        bio="Fitness & wellness coach helping you live your best life"
        subscriberCount={12500}
        videoCount={156}
        subscriptionPrice={9.99}
        onSubscribe={() => console.log('Subscribe clicked')}
      />
    </div>
  );
}
