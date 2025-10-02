import { StatCard } from '../StatCard';
import { DollarSign } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-4 max-w-sm">
      <StatCard
        title="Total Earnings"
        value="$2,847"
        icon={DollarSign}
        description="+12% from last month"
      />
    </div>
  );
}
