import { Service } from '../shared'
import { Branch } from './'
import { generateQrFromInviteId } from '../https/func_generate_invite_qr_code'

const db = Service.Firebase.firestore()

const carryUID: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : ''

async function createOrg(
  orgName: string,
  orgImage: string,
  mainEmail: string,
  source = 'study-creator',
  subscription?: any,
) {
  const org: any = {
    id: '',
    image: orgImage,
    name: orgName,
    mainEmail: mainEmail,
    source: source,
    created: new Date(),
    newGroupPermission: 'leader',
  }

  if (subscription) {
    org.subscription = subscription
  } else {
    org.subscription = {
      active: true,
      name: 'Free',
      memberCap: 15,
      videoCap: 1,
    }
  }

  const orgRef = await db.collection('organisations').doc()

  org.id = orgRef.id

  await orgRef.set(org)

  return orgRef.id
}

async function createCampus(orgId: string, orgName: string, orgImage: string, ownerUid?: string) {
  const campusRef = await db.collection('organisations').doc(orgId).collection('campuses').doc()

  const createdDate = new Date()
  const owner = ownerUid || carryUID

  const campus = {
    name: orgName,
    organisationId: orgId,
    createBy: owner,
    owner: owner,
    created: createdDate,
    updated: createdDate,
    image: orgImage,
    id: campusRef.id,
  }

  await campusRef.set(campus)

  const orgRef = await db.collection('organisations').doc(orgId)

  await orgRef.update({ mainCampus: campusRef.id })

  return campusRef.id
}

async function createVideoPlanGroup(
  groupName: string,
  orgId: string,
  campusId: string,
  groupImage: string,
  offset: number,
) {
  return await createGroup(groupName, orgId, campusId, groupImage, offset, carryUID, 'video-sermon-generator', true)
}

async function createGroup(
  groupName: string,
  orgId: string,
  campusId: string,
  groupImage: string,
  offset: number,
  ownerUid: string,
  source: string,
  mainGroup: boolean,
) {
  const createTime = new Date()
  const owner = ownerUid

  console.log(`Creating group with owner ${owner}`)

  const group = {
    id: '',
    name: groupName,
    visibility: 'private',
    hasActiveGoal: false,
    publicEnemy: true,
    timeZone: offset,
    communicationType: 'group',
    owner: owner,
    memberCount: 1,
    image: groupImage,
    service: 'StreamIO',
    created: createTime,
    updated: createTime,
    activity: 60,
    age: 'Any',
    ageFrom: 0,
    ageTo: 100,
    isNewGroup: true,
    location: '',
    members: [owner],
    organisation: {
      id: orgId,
      campusId: campusId,
    },
    source: source,
  }

  const groupRef = await db.collection('groups').doc()
  group.id = groupRef.id
  await groupRef.set(group)

  if (mainGroup) {
    const orgRef = await db.collection('organisations').doc(orgId)
    await orgRef.update({ mainGroup: group.id })
  }
  return group.id
}

export async function createInvite(iuid: string, groupId: string, orgId: string) {
  let inviteUrl = ''
  let inviteId = ''

  const queryResults = (await db.collection('invites').where('groupId', '==', groupId).get()).docs

  if (queryResults.length === 0) {
    const inviteRef = await db.collection('invites').doc()
    inviteId = inviteRef.id
    inviteUrl = await Branch.createBranchDynamicLink(inviteId)

    const invite = {
      id: inviteId,
      created: new Date(),
      url: inviteUrl,
      type: 'group',
      groupId: groupId,
      iuid: iuid,
    }

    await inviteRef.set(invite)
  } else {
    inviteId = queryResults[0].id
    inviteUrl = queryResults[0].data().url
  }

  if (inviteId && inviteUrl && inviteId !== '' && inviteUrl !== '') {
    const inviteCode: string = await createInviteCode(groupId)
    const inviteQrCodeUrl: string = await generateQrFromInviteId(inviteId, orgId)

    return {
      inviteId: inviteId,
      inviteUrl: inviteUrl,
      inviteCode: inviteCode,
      inviteQrCodeUrl: inviteQrCodeUrl,
    }
  } else {
    throw new Error(`Cannot create invite for user ${iuid} for group ${groupId} for org ${orgId}`)
  }
}

export async function createInviteCode(groupId: string) {
  let inviteCode = ''

  const queryResults = await (await db.collection('codes').where('groupId', '==', groupId).get()).docs

  if (queryResults.length === 0) {
    let usedCode = true
    const creationDate = new Date()

    const inviteCodeData = {
      code: '',
      groupId: groupId,
      creator: 'Video growth experiment',
      created: creationDate,
      updated: creationDate,
    }

    while (usedCode) {
      inviteCode = generateInviteCode()
      inviteCodeData.code = inviteCode
      try {
        await db.collection('codes').doc(inviteCode).set(inviteCodeData)
        usedCode = false
      } catch (e) {}
    }
  } else {
    inviteCode = queryResults[0].data().code
  }

  const formattedCode = inviteCode.slice(0, 3) + '-' + inviteCode.slice(3)

  return formattedCode
}

function generateInviteCode() {
  const characters = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '0',
  ]

  let code = ''

  for (let i = 0; i < 6; i++) {
    const index = getRandomInt(0, characters.length)

    code += characters[index]
  }
  return code
}

function getRandomInt(min: number, max: number) {
  const newMin = Math.ceil(min)
  const newMax = Math.floor(max)
  return Math.floor(Math.random() * (newMax - newMin) + newMin) // The maximum is exclusive and the minimum is inclusive
}

const response = (data: any, success: boolean, message: string, code: number, error?: string) => {
  return {
    data,
    success,
    message,
    code,
    error,
  }
}

export default {
  createCampus,
  createGroup,
  createVideoPlanGroup,
  createOrg,
  createInvite,
  createInviteCode,
  carryUID,
  response,
}
