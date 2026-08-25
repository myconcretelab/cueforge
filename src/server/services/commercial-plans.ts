export function planDeletionError(input: { isDefault: boolean; accountCount: number }): string | null {
  if (input.isDefault) return 'Le forfait par défaut ne peut pas être supprimé.';
  if (input.accountCount > 0) return 'Ce forfait est encore attribué à un ou plusieurs comptes.';
  return null;
}

export function planPublicationError(input: { visibleOnWebsite: boolean; featuredOnWebsite: boolean }): string | null {
  if (input.featuredOnWebsite && !input.visibleOnWebsite) return 'Un forfait mis en avant doit être visible sur le site.';
  return null;
}
