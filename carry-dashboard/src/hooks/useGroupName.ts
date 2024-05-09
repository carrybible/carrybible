import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { updateGroupNameMapping } from '@redux/slices/group'
import Firebase from '@shared/Firebase'
import { doc, DocumentReference, getDoc } from 'firebase/firestore'
import { useEffect } from 'react'

const useGroupName = (groupId: string): string | undefined => {
  const dispatch = useAppDispatch()
  const groupNameMapping = useAppSelector(
    (state) => state.group.groupNameMapping
  )

  const groupName = groupNameMapping[groupId]
  useEffect(() => {
    const run = async () => {
      if (!groupName) {
        try {
          const groupRef = doc(
            Firebase.firestore,
            Firebase.collections.GROUPS,
            groupId
          ) as DocumentReference<{ name: string }>

          const groupSnap = await getDoc(groupRef)
          if (groupSnap.exists()) {
            const group = groupSnap.data()
            dispatch(updateGroupNameMapping({ id: groupId, name: group.name }))
          }
        } catch (e) {}
      }
    }
    run()
  }, [dispatch, groupId, groupName])

  return groupName
}

export default useGroupName
