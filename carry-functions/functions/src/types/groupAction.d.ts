export type GroupActionsType = 'prayer' | 'gratitude'
export interface GroupActions {
  id: string
  type: GroupActionsType
  creator: string
  content: string
  viewerIds: string[]
  reactedUserIds?: string[]
  created: FirebaseFirestore.Timestamp
  updated: FirebaseFirestore.Timestamp

  orgSyncStatus?: string
}

export default GroupActions
