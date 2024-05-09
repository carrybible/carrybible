import one_time, { createOneTimeWorker } from './one_time'
import planned, { createPlannedWorker } from './planned'
import recurring, { createRecurringWorker } from './recurring'

const Worker = {
  createOneTimeWorker,
  createPlannedWorker,
  createRecurringWorker,
  one_time,
  planned,
  recurring,
}

export default Worker
