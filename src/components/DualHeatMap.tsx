"use client";

import { HeatNetworkMapWrapper } from "@/components/HeatNetworkMapWrapper";
import type { HeatNetworkData } from "@/components/HeatNetworkMap";

export function DualHeatMap({
  network,
  baselineRoutes,
  optimizedRoutes,
}: {
  network: HeatNetworkData;
  baselineRoutes: number[][];
  optimizedRoutes: number[][];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          <span className="text-sm font-medium">Baseline routing</span>
          <span className="text-xs text-muted-foreground">
            (each vehicle&apos;s own shortest path)
          </span>
        </div>
        <HeatNetworkMapWrapper network={network} routes={baselineRoutes} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">Optimized routing</span>
          <span className="text-xs text-muted-foreground">
            (jointly coordinated)
          </span>
        </div>
        <HeatNetworkMapWrapper network={network} routes={optimizedRoutes} />
      </div>
    </div>
  );
}
