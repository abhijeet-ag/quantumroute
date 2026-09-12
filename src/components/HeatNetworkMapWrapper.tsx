"use client";

import dynamic from "next/dynamic";
import type { HeatNetworkData } from "./HeatNetworkMap";

const HeatNetworkMap = dynamic(() => import("./HeatNetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function HeatNetworkMapWrapper({
  network,
  routes,
  height,
  spotlight,
  selectedSource,
  selectedDest,
  onNodeClick,
}: {
  network: HeatNetworkData;
  routes: number[][] | null;
  height?: number;
  spotlight?: boolean;
  selectedSource?: number | null;
  selectedDest?: number | null;
  onNodeClick?: (nodeId: number) => void;
}) {
  return (
    <HeatNetworkMap
      network={network}
      routes={routes}
      height={height}
      spotlight={spotlight}
      selectedSource={selectedSource}
      selectedDest={selectedDest}
      onNodeClick={onNodeClick}
    />
  );
}
