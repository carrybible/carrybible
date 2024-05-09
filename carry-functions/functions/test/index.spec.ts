/*
 * @jest-environment node
 */

import { clearDb, getApp } from './db'

const sleep = (milli) => new Promise((res) => setTimeout(res, milli))

describe('Test', () => {
  beforeEach(async () => {
    await clearDb()
  })

  test('goal_onCreate', async function () {
    const db = getApp().firestore()
    const group = await db.collection('groups').add({ name: 'Test group' })
    await sleep(5000)
    console.log('checking collection')
    const postCount = (await db.collection('gro').get()).docs.length
    expect(postCount).toBe(1)
    const statsCount = (await db.collection('stats').get()).docs.length
    expect(statsCount).toBe(1)
  }, 10000)
})
