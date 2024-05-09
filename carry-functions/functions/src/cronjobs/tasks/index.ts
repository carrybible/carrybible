import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions'
import { Service } from '../../shared'
import { syncGroups, syncMembers } from '../../shared/reports/syncGroupData'
import { WorkerType } from './types'
import workers from './workers'

const db = Service.Firebase.firestore()
const taskRunner = functions
  .runWith({ memory: '2GB' })
  .pubsub.schedule('every 2 minutes')
  .onRun(async (context) => {
    // Consistent timestamp
    const now = admin.firestore.Timestamp.now()
    // Query all documents ready to perform
    const query = db.collection('tasks').where('performAt', '<=', now).where('status', '==', 'scheduled').limit(1000)
    const tasks = await query.get()
    functions.logger.info(`[Schedule Task] Execute total ${tasks.size} task(s)`)
    // Jobs to execute concurrently.
    const jobs: Promise<any>[] = []
    // Loop over documents and push job.
    tasks.forEach((snapshot) => {
      const workerData = snapshot.data() as WorkerType
      const job = workers[workerData.worker](snapshot, workerData as any)
      jobs.push(job)
    })

    // Task to trigger save data to org:
    const syncSettingDoc = await db.collection('systemSettings').doc('cronjobs').get()
    const syncSettings = syncSettingDoc.data()
    if (syncSettings?.orgDataSync) {
      jobs.push(syncMembers({ limit: syncSettings?.syncMemberLimit || 50 }))
      jobs.push(syncGroups({ limit: syncSettings?.syncGroupLimit || 5 }))
    }

    // Execute all jobs concurrently
    return await Promise.all(jobs)
  })

export default taskRunner
