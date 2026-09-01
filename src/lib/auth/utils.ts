export function normalizeUserIdToEmail(userId: string): string {
  const cleanId = userId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${cleanId}@seep.internal`;
}
