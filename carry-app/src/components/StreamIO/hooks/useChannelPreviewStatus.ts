import StreamIO from '@shared/StreamIO'
import { useEffect, useState } from 'react'
import { Channel } from 'stream-chat'

function useChannelPreviewStatus(channel: Channel) {
  const [muted, setMuted] = useState(false)
  useEffect(() => {
    const status = channel.muteStatus()
    setMuted(status.muted)

    const handleEvent = e => {
      const status = channel.muteStatus()
      setMuted(status.muted)
    }
    //
    StreamIO.client?.on('notification.channel_mutes_updated', handleEvent)

    return () => {
      StreamIO.client?.off('notification.channel_mutes_updated', handleEvent)
    }
  }, [channel])

  return { muted }
}

export default useChannelPreviewStatus
