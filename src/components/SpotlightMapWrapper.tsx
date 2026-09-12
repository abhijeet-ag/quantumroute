"use client";

import dynamic from "next/dynamic";
import type { HeatNetworkData } from "./HeatNetworkMap";

const SpotlightMap = dynamic(() => import("./SpotlightMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function SpotlightMapWrapper(props: {
  network: HeatNetworkData;
  baselinePath: number[] | null;
  optimizedPath: number[] | null;
  selectedSource: number | null;
  selectedDest: number | null;
  onNodeClick: (nodeId: number) => void;
  height?: number;
}) {
  return <SpotlightMap {...props} />;
}
