import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ProductCardSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden border-2 border-slate-200/50 bg-gradient-to-br from-white to-slate-50/30">
      <CardHeader className="p-0">
        <div className="w-full h-64 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      </CardHeader>

      <CardContent className="p-5 flex flex-col flex-1 space-y-3">
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse rounded w-3/4" />
          <div className="h-5 bg-gradient-to-r from-slate-200 to-slate-100 animate-pulse rounded w-1/2" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
          <div className="h-6 bg-gradient-to-r from-amber-200 to-amber-100 animate-pulse rounded w-20" />
          <div className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

