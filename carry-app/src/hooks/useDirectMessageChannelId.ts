import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import md5 from 'md5'

import { RootState } from '@dts/state'

const useDirectMessageChannelId = (toUserId?: string): string | undefined => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)

  const channelId = useMemo(() => {
    if (!toUserId) {
      return
    }
    const id = `${group.id}-${[me.uid, toUserId].sort().join('-')}`
    const md5Id = md5(id)
    return `private-${md5Id}`
  }, [group.id, me.uid, toUserId])

  return channelId
}

export default useDirectMessageChannelId
