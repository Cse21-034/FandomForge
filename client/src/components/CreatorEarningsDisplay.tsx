import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentApi } from "@/lib/api";

interface CreatorEarningsDisplayProps {
  creatorId: string;
}

export function CreatorEarningsDisplay({ creatorId }: CreatorEarningsDisplayProps) {
  const { data: earnings, isLoading } = useQuery({
    queryKey: ["creator-earnings", creatorId],
    queryFn: () => paymentApi.getCreatorEarnings(creatorId),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-8 w-28" />
          </Card>
        ))}
      </div>
    );
  }

  if (!earnings) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Earnings */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
            <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
              ${parseFloat(earnings.totalEarnings || "0").toFixed(2)}
            </p>
          </div>
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </Card>

      {/* Subscription Earnings */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">From Subscriptions</p>
            <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${parseFloat(earnings.subscriptionEarnings || "0").toFixed(2)}
            </p>
          </div>
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
            <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      {/* PPV Earnings */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">From PPV</p>
            <p className="mt-1 text-2xl font-bold text-purple-600 dark:text-purple-400">
              ${parseFloat(earnings.ppvEarnings || "0").toFixed(2)}
            </p>
          </div>
          <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/20">
            <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      {/* Transaction Count */}
      <Card className="p-6 md:col-span-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
          <p className="mt-1 text-xl font-semibold">{earnings.transactionCount || 0} sales</p>
        </div>
      </Card>
    </div>
  );
}
