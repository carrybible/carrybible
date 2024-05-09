import { auth, logger } from 'firebase-functions'
import { firestore } from 'firebase-admin'
import { Service } from '../shared'

const onCreate = auth.user().onCreate(async (user) => {
  // Generate stream token
  let streamToken = ''
  try {
    streamToken = Service.Stream.createToken(user.uid)
  } catch (e) {
    logger.error(`Error creating Stream token:`, e)
  }

  const streamUpdate = {
    id: user.uid,
    set: {
      role: "user",
      field: {
        name: user.displayName
      },
    },
  };

  await Service.Stream.upsertUser(streamUpdate);

  // Generate user profile
  const profile: Carry.User = {
    uid: user.uid,
    name: user.displayName ?? user.email,
    image: user.photoURL,
    email: user.email,
    groups: [],
    streamToken,
    visibility: 'public',
    freemium: true, // if undefine mean old user
    created: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
    updated: firestore.FieldValue.serverTimestamp() as FirebaseFirestore.Timestamp,
  }



  // Set profile in Firestore
  await Service.Firebase.firestore().doc(`/users/${user.uid}`).set(profile, { merge: true })


})

export default onCreate
