import type { CommitAnalysisResponse, ActionAugmentationResponse } from '@geut/chan-ai'

// keepachangelog verbs that chan uses as <action>.
export const CHAN_ACTIONS = [
  'added',
  'changed',
  'deprecated',
  'removed',
  'fixed',
  'security',
] as const

export type ChanAction = (typeof CHAN_ACTIONS)[number]

// chan-ai precise taxonomy → keepachangelog verb used as the chan <action>.
// The precise AI category is still preserved in the `## Action` Classification line.
const AI_CATEGORY_TO_ACTION: Record<CommitAnalysisResponse['category'], ChanAction> = {
  Feature: 'added',
  Fix: 'fixed',
  Documentation: 'changed',
  Refactor: 'changed',
  Test: 'changed',
  Chore: 'changed',
  Style: 'changed',
  Performance: 'changed',
  Security: 'security',
}

export function aiCategoryToAction(
  category: CommitAnalysisResponse['category']
): ChanAction {
  return AI_CATEGORY_TO_ACTION[category] ?? 'changed'
}

// Derive the chan <action> from an augmentation's classification list.
// Pick the most "specific" verb: security > removed > deprecated > fixed > added > changed.
const SPECIFICITY: ChanAction[] = [
  'security',
  'removed',
  'deprecated',
  'fixed',
  'added',
  'changed',
]

export function classificationToAction(
  classification: ActionAugmentationResponse['classification']
): ChanAction {
  const actions = new Set(
    classification.map(c => AI_CATEGORY_TO_ACTION[c] ?? 'changed')
  )
  for (const action of SPECIFICITY) {
    if (actions.has(action)) return action
  }
  return 'changed'
}

export function isChanAction(value: string): value is ChanAction {
  return (CHAN_ACTIONS as readonly string[]).includes(value)
}
