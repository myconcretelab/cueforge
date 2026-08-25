export function planDeletionError(input: { isDefault: boolean; accountCount: number }): string | null {
  if (input.isDefault) return 'Le forfait par défaut ne peut pas être supprimé.';
  if (input.accountCount > 0) return 'Ce forfait est encore attribué à un ou plusieurs comptes.';
  return null;
}
