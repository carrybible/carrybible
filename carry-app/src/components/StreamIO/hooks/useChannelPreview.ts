import { useChatContext } from 'stream-chat-react-native'
import { useEffect, useState } from 'react'
import { Channel } from 'stream-chat'

type GetChannelPreviewDisplayNameType = (arg: {
  channelName?: string
  currentUserId?: string
  members?: Channel['state']['members']
}) => string

export const getChannelPreviewDisplayName: GetChannelPreviewDisplayNameType = ({ channelName, currentUserId, members }) => {
  if (channelName) return channelName

  const channelMembers = Object.values(members || {})
  const otherMembers = channelMembers.filter(member => member.user?.id !== currentUserId)

  const name = otherMembers.slice(0).reduce((returnString, currentMember, index, originalArray) => {
    const returnStringLength = returnString.length
    const currentMemberName = currentMember.user?.name || currentMember.user?.id || 'Unknown User'
    // a rough approximation of when the +Number shows up
    if (returnStringLength + (currentMemberName.length + 2) > 0) {
      if (returnStringLength) {
        returnString += `, ${currentMemberName}`
      } else {
        returnString = currentMemberName
      }
    } else {
      const remainingMembers = originalArray.length - index
      returnString += `, +${remainingMembers}`
      originalArray.splice(1) // exit early
    }
    return returnString
  }, '')

  return name
}

function useChannelPreview(channel: Channel): { name: string; type: 'direct' | 'group'; image: string; members: any; creator: any } {
  const { client } = useChatContext()

  const currentUserId = client.userID
  const numOfMembers = Object.keys(channel?.state.members || {}).length
  const channelName = channel.id?.includes('!members') || channel.id?.includes('private') ? undefined : channel?.data?.name
  const type = channel.id?.includes('!members') || channel.id?.includes('private') ? 'direct' : 'group' // direct || group
  const image: string = (channel?.data?.image as string) || ''
  const members = Object.values(channel.state.members).map(i => i.user)
  const creator = channel.data?.created_by

  const [displayName, setDisplayName] = useState(
    getChannelPreviewDisplayName({
      channelName,
      currentUserId,
      members: channel?.state.members,
    }),
  )

  useEffect(() => {
    setDisplayName(
      getChannelPreviewDisplayName({
        channelName,
        currentUserId,
        members: channel?.state.members,
      }),
    )
  }, [channelName, currentUserId, numOfMembers])

  return { name: displayName, image, creator, type, members }
}

export default useChannelPreview
