"use client";

import dynamic from "next/dynamic";
import type { NetworkData } from "./NetworkMap";

// Load the Leaflet map only in the browser. Leaflet touches `window`,
// which doesn't exist during server-side rendering, so ssr:false is required.
const NetworkMap = dynamic(() => import("./NetworkMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] w-full items-center justify-center rounded-lg border bg-muted/30 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function NetworkMapWrapper({ network }: { network: NetworkData }) {
  return <NetworkMap network={network} />;
}
