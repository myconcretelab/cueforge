export function planDeletionError(input: { isDefault: boolean; accountCount: number }): string | null {
  if (input.isDefault) return 'Le forfait par défaut ne peut pas être supprimé.';
  if (input.accountCount > 0) return 'Ce forfait est encore attribué à un ou plusieurs comptes.';
  return null;
}

export function planPublicationError(input: { visibleOnWebsite: boolean; featuredOnWebsite: boolean }): string | null {
  if (input.featuredOnWebsite && !input.visibleOnWebsite) return 'Un forfait mis en avant doit être visible sur le site.';
  return null;
}

export function planIsFree(input: { monthlyPriceCents: number | null; annualPriceCents: number | null }): boolean {
  const configuredPrices = [input.monthlyPriceCents, input.annualPriceCents]
    .filter((price): price is number => price !== null);
  return configuredPrices.length > 0 && configuredPrices.every((price) => price === 0);
}

export function planIncludesBridge(input: { monthlyPriceCents: number | null; annualPriceCents: number | null }): boolean {
  return [input.monthlyPriceCents, input.annualPriceCents].some((price) => price !== null && price > 0);
}

export function accountCanUseBridge(input: {
  monthlyPriceCents: number | null;
  annualPriceCents: number | null;
  accessStatus: string;
  isDemo: boolean;
}): boolean {
  return !input.isDemo
    && planIncludesBridge(input)
    && ['active', 'grace_period'].includes(input.accessStatus);
}
