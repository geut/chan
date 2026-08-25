export interface Actions {
  ADDED: 'Added'
  CHANGED: 'Changed'
  DEPRECATED: 'Deprecated'
  REMOVED: 'Removed'
  FIXED: 'Fixed'
  SECURITY: 'Security'
}

export const actions = {
  ADDED: 'Added' as const,
  CHANGED: 'Changed' as const,
  DEPRECATED: 'Deprecated' as const,
  REMOVED: 'Removed' as const,
  FIXED: 'Fixed' as const,
  SECURITY: 'Security' as const,
} as const satisfies Actions