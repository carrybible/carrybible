import admin from 'firebase-admin'
import firebaseTesting from '@firebase/testing'
const projectId = 'testdb'

export function getApp() {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  process.env.FIREBASE_FIRESTORE_EMULATOR_ADDRESS = 'localhost:8080'
  admin.initializeApp({
    // projectId: projectId,
    credential: admin.credential.cert({}),
    // credential: admin.credential.applicationDefault(),
  })
  return admin.app()
}

export function getTestDb() {
  const db = firebaseTesting
    .initializeAdminApp({
      projectId: projectId,
      databaseName: 'carry-dev',
    })
    .firestore()
  db.settings({
    host: 'localhost:8080',
    ssl: false,
  })
  return db
}

export function getTestClientDb() {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  const db = firebaseTesting
    .initializeTestApp({
      projectId: projectId,
      auth: { uid: 'alice', email: 'alice@example.com' },
    })
    .firestore()
  return db
}

export async function clearDb() {
  return firebaseTesting.clearFirestoreData({ projectId: projectId })
}
