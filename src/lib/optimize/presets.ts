// Vehicle counts per preset — mirrors the network generator presets.
export const PRESET_VEHICLES: Record<string, number> = {
  small: 20,
  medium: 40,
  large: 60,
};

// Infer preset key from a network label (labels start with "Small"/"Medium"/"Large").
export function vehicleCountForLabel(label: string): number {
  const lower = label.toLowerCase();
  if (lower.startsWith("small")) return PRESET_VEHICLES.small;
  if (lower.startsWith("large")) return PRESET_VEHICLES.large;
  return PRESET_VEHICLES.medium;
}
