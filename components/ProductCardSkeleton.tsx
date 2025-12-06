import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProductCardSkeleton() {
  return (
    <Card className="hover:shadow-lg transition">
      <CardHeader className="p-0">
        <div className="w-full h-56 bg-slate-200 animate-pulse rounded-t-lg" />
      </CardHeader>

      <CardContent className="p-4">
        <div className="h-6 bg-slate-200 animate-pulse rounded mb-2" />
        <div className="h-5 w-20 bg-slate-200 animate-pulse rounded" />
      </CardContent>
    </Card>
  );
}

