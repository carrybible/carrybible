import { SUPPORT_LANGUAGES } from '@shared/Constants'
import Smartlook, { CUSTOM_EVENTS } from '@shared/Smartlook'
import { wait } from '@shared/Utils'
import _ from 'lodash'
import * as Client from 'stream-chat'
import { StreamChat } from 'stream-chat'
import { Streami18n } from 'stream-chat-react-native'
import Config from './Config'
import translations from '@assets/i18n'

type LocalAttachmentType = any
type LocalChannelType = any
type LocalCommandType = string
type LocalEventType = any
type LocalMessageType = any
type LocalResponseType = any
type LocalUserType = any

const chatClient: StreamChat = new Client.StreamChat<
  LocalAttachmentType,
  LocalChannelType,
  LocalCommandType,
  LocalEventType,
  LocalMessageType,
  LocalResponseType,
  LocalUserType
>(Config.STREAMIO.KEY)

chatClient.setBaseURL(Config.STREAMIO.SERVER)

const streamI18n = new Streami18n()
SUPPORT_LANGUAGES.forEach(language => {
  streamI18n.registerTranslation(language.value, translations[language.value]?.streamI18n ?? {})
})

export async function login(user: App.User): Promise<any> {
  const RETRY = 3
  let retryCount = 0
  if (user.uid && user.streamToken) {
    devLog(`[StreamIO UserToken] ${user.streamToken}`)
    while (retryCount < RETRY) {
      try {
        const userData = await chatClient.connectUser(
          {
            id: user.uid,
            name: user.name,
            firstname: user.name?.split(' ')[0] ?? user.name,
            image: user.image,
          },
          user.streamToken,
        )

        return userData
      } catch (e) {
        Smartlook.trackCustomEvent(CUSTOM_EVENTS.FAILED_CONNECTING_STREAM_IO, {
          // @ts-ignore
          error: typeof e === 'string' ? e : e?.message,
        })
        retryCount++
        if (retryCount < RETRY) {
          devLog(`Retrying connect to StreamIO, attempts ${retryCount}`)
          await wait(100)
        } else {
          throw e
        }
      }
    }
  }
  return undefined
}

export async function updateUser(user: App.User) {
  await chatClient.upsertUser({
    id: user.uid,
    name: user.name,
    image: user.image,
    book: _.get(chatClient, 'user.book', ''),
  })
}

async function getChannelList(filter: any, sort?: any) {
  const channels = await chatClient.queryChannels(filter, sort, {
    watch: true,
    presence: true,
    state: true,
  })
  return channels
}

function localChannel(id: string): Promise<Client.Channel> {
  return new Promise((resolve, reject) => {
    resolve(chatClient.channel('messaging', id))
  })
}

async function getChannel(id: string, force = false): Promise<Client.Channel | undefined> {
  if (force) {
    const r = await getChannelList({ id })
    if (r) return r[0]
  } else {
    let c = await localChannel(id)
    if (!c || !c.data) {
      const r = await getChannelList({ id })
      if (r) c = r[0]
    }
    return c
  }
  return undefined
}

export async function getThread(id: string) {
  const m = await chatClient.getMessage(id)
  return m
}

export default {
  client: chatClient,
  streamI18n,
  channel: {
    get: getChannel,
  },
  login,
}
