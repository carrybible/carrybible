import algolia from 'algoliasearch'
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { StreamChat } from 'stream-chat'
import { PubSub } from '@google-cloud/pubsub'

// Stream
const Stream = new StreamChat(functions.config().stream.key, functions.config().stream.secret, { timeout: 10000 })
Stream.setBaseURL(functions.config().stream.server)

// Agolia
const agoliaIndexes = algolia(functions.config().algolia.app, functions.config().algolia.key)
const usersIndex = agoliaIndexes.initIndex('users')
const groupIndex = agoliaIndexes.initIndex('groups')

// PubSub
const pubsubClient = new PubSub()

export default {
  Stream,
  Firebase: admin,
  PubSub: pubsubClient,
  Algolia: {
    usersIndex,
    groupIndex,
  },
}
