import { useAppDispatch, useAppSelector } from '@redux/hooks'
import { loadUserInfos } from '@redux/thunks/members'
import { useEffect } from 'react'

const useMemberInfo = (
  uid: string
): { name: string; image: string } | undefined => {
  const dispatch = useAppDispatch()
  const memberInfo = useAppSelector((state) => state.members.membersInfo[uid])

  useEffect(() => {
    const run = async () => {
      if (!memberInfo) {
        await dispatch(loadUserInfos({ uids: [uid] }))
      }
    }
    run()
  }, [dispatch, memberInfo, uid])

  return memberInfo
}

export default useMemberInfo
