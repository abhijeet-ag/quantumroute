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
}: {
  network: HeatNetworkData;
  routes: number[][] | null;
}) {
  return <HeatNetworkMap network={network} routes={routes} />;
}
