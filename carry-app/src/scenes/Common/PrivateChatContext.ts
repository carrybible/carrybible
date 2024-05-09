import React from 'react'

const PrivateChatContext = React.createContext<{
  id: string
  name: string
  image: string
} | null>(null)

export default PrivateChatContext
