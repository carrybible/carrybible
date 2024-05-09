import { DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { Service } from '../shared'
import { Verse, validateVerse } from './Bible'

const db = Service.Firebase.firestore()

export default {
  createPlan,
  pushPlanToOrg,
  updatePlanToOrg,
  pushPlanToGroup,
  createDay,
  createQuestionActivity,
  createVerseActivityFromString,
}

export interface CarryPlan {
  author: string
  lastUpdatedAuthor: string
  blocks: any[]
  duration: number
  id?: string
  name: string
  description: string
  owner: string
  pace: 'day'
  state: 'completed' | 'processing'
  mode: 'normal'
  type: 'advanced'
  version: number
  featuredImage: string
}

export interface ScheduledPlan extends CarryPlan {
  created: Date
  updated: Date
  startDate: Date
  endDate: Date
  originalId: string
  targetGroupId: string
  memberProgress: {
    [key: string]: {
      uid: string
      isCompleted: boolean
      percent: number
      totalReadingTime: number
    }
  }
  status: 'ended' | 'normal' | 'future'
}

export function createPlan(
  author: string,
  blocks: Array<any>,
  duration: number,
  name: string,
  description: string,
  image: string,
): CarryPlan {
  const plan: CarryPlan = {
    author: author,
    lastUpdatedAuthor: author,
    blocks: blocks,
    duration: duration,
    name: name,
    description: description,
    owner: author,
    pace: 'day',
    state: 'completed',
    mode: 'normal',
    type: 'advanced',
    version: 1,
    featuredImage: image,
  }

  return plan
}

export async function pushPlanToOrg(plan: CarryPlan | Partial<CarryPlan>, orgId: string, campusId?: string) {
  const createdDate = new Date()

  const planRef = db.collection('organisations').doc(orgId).collection('orgPlans').doc()

  const planId = planRef.id

  const orgPlan = {
    ...plan,
    created: createdDate,
    updated: createdDate,
    campus: {
      campusId: campusId,
    },
    id: planId,
  }

  orgPlan.id = planId

  await planRef.set(orgPlan)

  return planId
}

export async function updatePlanToOrg(planId: string, plan: CarryPlan, orgId: string, campusId?: string) {
  const createdDate = new Date()

  const orgPlan = {
    ...plan,
    created: createdDate,
    updated: createdDate,
    campus: {
      campusId: campusId,
    },
  }

  const planRef = db.collection('organisations').doc(orgId).collection('orgPlans').doc(planId)
  await planRef.set(orgPlan)

  return planId
}

export async function pushPlanToGroup(
  plan: CarryPlan,
  groupId: string,
  offset: number,
  overwrite: boolean,
): Promise<ScheduledPlan | undefined> {
  // get current active goal to see if there is one set
  const groupData: any = (await db.collection('groups').doc(groupId).get()).data
  const existingEndDate = groupData?.activeGoal?.endDate?.toDate()

  if (!overwrite && existingEndDate >= new Date()) {
    console.log(`Group ${groupId} has existing plan ending on ${existingEndDate} and didn't want to overwrite`)
    return undefined
  }

  // get active or future plans
  const activeOrFuturePlans: QueryDocumentSnapshot<DocumentData>[] = (
    await db.collection('groups').doc(groupId).collection('plans').where('status', 'in', ['normal', 'future']).get()
  ).docs

  // create new plan objects
  const createdDate = new Date()
  const startDate = setStartDate(createdDate, offset)
  const endDate = addMinutesToDate(startDate, 60 * 24 * plan.duration)

  const groupPlan: ScheduledPlan = {
    ...plan,
    status: 'normal',
    created: createdDate,
    updated: createdDate,
    startDate: startDate,
    endDate: endDate,
    originalId: '',
    targetGroupId: groupId,
    memberProgress: {
      [plan.owner]: {
        uid: plan.owner,
        isCompleted: false,
        percent: 0,
        totalReadingTime: 0,
      },
    },
  }

  // set new plan
  const planRef = db.collection('groups').doc(groupId).collection('plans').doc()
  const planId = planRef.id
  groupPlan.id = planId
  await planRef.set(groupPlan)

  const planPromises: Promise<FirebaseFirestore.WriteResult>[] = []

  for (const otherPlan of activeOrFuturePlans) {
    planPromises.push(otherPlan.ref.update({ status: 'ended ' }))
  }

  await Promise.all(planPromises)

  const newActiveGoal = {
    id: planId,
    startDate: startDate,
    endDate: endDate,
    pace: 'day',
    duration: plan.duration,
    name: plan.name,
  }

  const groupRef = await db.collection('groups').doc(groupId)

  await groupRef.update({ activeGoal: newActiveGoal })

  return groupPlan
}

export function createDay(index: number, name: string, activities: Array<any>) {
  return {
    index: index,
    name: name,
    activities: activities,
  }
}

export function createQuestionActivity(questionText: string) {
  return {
    question: questionText,
    type: 'question',
  }
}

export function createVerseActivityFromString(verseString: string) {
  try {
    const verse: Verse = validateVerse(verseString)

    const verseActivity = {
      chapter: {
        bookAbbr: verse.abbr.toUpperCase(),
        bookId: verse.bookId,
        bookName: verse.bookName,
        chapterId: verse.chapterNumber,
        chapterNumber: verse.chapterNumber,
        toChapterId: null,
        toChapterNumber: null,
      },
      type: 'passage',
      verseRange: verse.verseFrom + '-' + verse.verseTo,
      verses: [{ from: verse.verseFrom, to: verse.verseTo }],
    }

    return verseActivity
  } catch (e) {
    console.log(`Plan generated invalid verse: ${verseString} ${e}`)
    throw new Error()
  }
}

function addMinutesToDate(date: Date, minutes: number) {
  const dateMilli = date.getTime()
  const addMilliSeconds = 60 * 1000 * minutes
  const newDate = new Date(dateMilli + addMilliSeconds)
  return newDate
}

function setStartDate(startDate: Date, offset: number) {
  const startDateString = startDate.toDateString() + ' 00:00:00 UTC+0000'

  const midnightStartDate = new Date(startDateString)

  //console.log(midnightStartDate);

  const fixedStartDate = addMinutesToDate(midnightStartDate, offset)

  return fixedStartDate
}
