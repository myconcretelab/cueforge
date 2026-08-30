import type { BridgeOutput, BridgeStatus } from './bridge-client';

const outputColors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#84cc16'];

export interface RoutedBridgeOutput extends BridgeOutput {
  color: string;
}

export function bridgePhysicalOutputs(outputs: BridgeOutput[]): RoutedBridgeOutput[] {
  const seen = new Set<string>();
  return outputs.filter((output) => {
    if (output.id === 'default' || seen.has(output.id)) return false;
    seen.add(output.id);
    return true;
  }).map((output, index) => ({
    ...output,
    color: outputColors[index % outputColors.length]!,
  }));
}

export function supportsPerPlaybackOutput(status: BridgeStatus): boolean {
  return status.capabilities?.includes('perPlaybackOutput') ?? false;
}

export function routableBridgeOutputs(outputs: BridgeOutput[], supported: boolean): RoutedBridgeOutput[] {
  if (!supported) return [];
  const physicalOutputs = bridgePhysicalOutputs(outputs);
  if (physicalOutputs.length < 2) return [];
  return physicalOutputs;
}

export function playbackBridgeOutput(outputs: RoutedBridgeOutput[], outputId: string | undefined): RoutedBridgeOutput | undefined {
  if (!outputId) return undefined;
  return outputs.find((output) => output.id === outputId)
    ?? (outputId === 'default' ? outputs.find((output) => output.isDefault) ?? outputs[0] : undefined);
}
