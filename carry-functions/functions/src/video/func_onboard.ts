import { randomUUID } from 'crypto'
import { UserRecord } from 'firebase-admin/lib/auth/user-record'
import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service } from '../shared'
import CarryUtils from './CarryUtils'
import Mailchimp from './Mailchimp'
import MailchimpMarketing from './MailchimpMarketing'
import Slack from './Slack'

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

interface TypeformWebhook {
  event_id: string
  event_type: string
  form_response: {
    form_id: string
    token: string
    landed_at: string
    submitted_at: string
    hidden: any
    calculated: any
    variables: Array<{
      key: string
      type: 'string' | 'number'
      text?: string
      number?: number
    }>
    definition: {
      id: string
      title: string
      fields: Array<{
        id: string
        ref: string
        type: string
        title: string
        properties: any
        allow_other_choice?: boolean
        choices?: Array<{
          id: string
          label: string
        }>
      }>
      endings: Array<{
        id: string
        ref: string
        title: string
        type: string
        properties: any
      }>
    }
    answers: Array<{
      type: 'boolean' | 'choice' | 'text' | 'phone_number' | 'email'
      boolean?: boolean
      choice?: {
        label?: string
        other?: string
      }
      text?: string
      phone_number?: string
      email?: string
      field: {
        id: string
        type: string
        ref: string
      }
    }>
    ending: {
      id: string
      ref: string
    }
  }
}

export interface Onboarding {
  id: string
  typeformFormId: string
  typeformToken: string
  typeformSubmitted: Date
  isDev: boolean
  isOrg: boolean
  offset: number
  orgType?: string
  orgPhysicalLocations?: string
  orgName?: string
  orgRole?: string
  reason: string
  people: string
  multipleGroups: boolean
  setupOption: string
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  unknown: Array<any>
  orgId: string
  campusId: string
  groupId?: string
  userId: string
  groupInviteId?: string
  groupInviteUrl?: string
  groupInviteCode?: string
  groupInviteQrCodeUrl?: string
  error?: string
}

const db = Service.Firebase.firestore()
const auth = Service.Firebase.auth()
const ONBOARDING_FORM_ID = 'aFG502hu'
const DASHBOARD_URL: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : ''
const isDev: boolean = Service.Firebase.appCheck().app.options.projectId === 'carry-dev'
const devPrefix: string = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : '[Dev] '
const GROUP_IMAGE_URL = 'https://storage.googleapis.com/carry-public/images/group/default/<x>-small.jpg'
const GROUP_IMAGE_TEMPLATE = '<x>'
const GROUP_IMAGE_MAX = 36
const MAILCHIMP_AUDIENCE_ID = '5b12002c89'

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', '*')
  res.set('Access-Control-Allow-Methods', 'POST')

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    try {
      const event: TypeformWebhook = req.body

      if (event.event_type === 'form_response' && event.form_response.form_id === ONBOARDING_FORM_ID) {
        if (event.form_response.hidden.id && event.form_response.hidden.dev && event.form_response.hidden.offset) {
          const formIsDev = event.form_response.hidden.dev === 'true' ? true : false
          if (formIsDev === isDev) {
            const onboardingsEmpty = (
              await db.collection('onboardings').where('typeformToken', '==', 'event.form_response.token').get()
            ).empty
            if (onboardingsEmpty) {
              console.log(`Processing TypeForm Response ${event.form_response.token}`)
              await handleWebhook(event)
            } else {
              // duplicate webhook
              console.log(`Already processed ${event.form_response.token} typeform response - ignoring`)
            }
          } else {
            // wrong env
            console.log('Wrong environment - ignoring')
          }
        } else {
          // wrong fields
          console.log(event.form_response.hidden)
          throw new Error('Hidden fields not detected')
        }
      } else {
        // wrong form
        console.log('Wrong form id - ignoring')
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log(e.stack || e.message)
        console.log('Cannot handle TypeForm webhook' + req.errored?.stack || req.errored?.message)
        throw new Error(e.stack || e.message)
      }
    } finally {
      res.status(200).json({ success: true })
    }
  } else {
    res.status(405).send()
  }
})

async function handleWebhook(event: TypeformWebhook) {
  let onboarding: Partial<Onboarding> = {
    id: event.form_response.hidden.id,
    offset: event.form_response.hidden.offset || 0,
    typeformFormId: event.form_response.form_id,
    typeformToken: event.form_response.token,
    typeformSubmitted: new Date(event.form_response.submitted_at),
    isDev: event.form_response.hidden.dev === 'true' ? true : false,
  }

  try {
    console.log(`Processing onboarding ${onboarding.id}`)
    const response = convertResponse(event)
    //console.log(response);
    onboarding = { ...onboarding, ...response }

    // check we have all the fields we need
    if (!onboarding.email) throw new Error(`Missing data ${JSON.stringify(onboarding)}`)

    let userId, orgId, campusId
    let userQuery = await db.collection('users').where('email', '==', onboarding.email).get()

    if (userQuery.empty) {
      let userRecord: UserRecord

      console.info(`Getting firebase auth`)
      try {
        userRecord = await auth.getUserByEmail(onboarding.email)
        console.log(`Found user record with id ${userRecord.uid}`)
      } catch (e) {
        console.info(`Creating new firebase auth`)
        userRecord = await auth.createUser({
          email: onboarding.email,
          password: randomUUID(),
          phoneNumber: response.phoneNumber,
          displayName: `${response.firstName} ${response.lastName}`,
        })
      }

      const userRef = db.collection('users').doc(userRecord.uid)
      let userExists = (await userRef.get()).exists

      let counter = 0

      while (!userExists && counter <= 5) {
        console.log('User not found, waiting for auth hook to complete ' + counter)
        await new Promise((resolve) => setTimeout(resolve, 5000))
        userExists = (await userRef.get()).exists
        counter++
      }

      if (!userExists) throw new Error('Exhausted tries trying to create a user')

      userId = userRecord.uid
    } else {
      console.log(`Found user record with id ${userQuery.docs[0].id}`)
      userId = userQuery.docs[0].id

      const userData = userQuery.docs[0].data()

      if (
        userData.organisation &&
        (userData.organisation.role !== 'member' || userData.organisation.role !== 'leader')
      ) {
        console.log(`User has existing org with dashboard permissions set, setting org to ${userData.organisation.id}`)
        orgId = userData.organisation.id
      }
    }

    onboarding.userId = userId

    if (!orgId) {
      // see if an existing org exists for the email
      const orgs = (await db.collection('organisations').where('mainEmail', '==', onboarding.email).get()).docs

      if (orgs.length > 0) {
        if (orgs.length > 1) console.log(`multiple orgs with the same email ${onboarding.email}`)
        orgId = orgs[0].id
        campusId = orgs[0]?.data()?.mainCampus
      }
    }

    if (!orgId) {
      console.info(`Cannot find org for email ${onboarding.email}, creating a new org and campus`)
      const orgName = response.orgName || `${response.firstName} ${response.lastName}`

      orgId = await CarryUtils.createOrg(orgName, '', response.email, 'onboarding')
      campusId = await CarryUtils.createCampus(orgId, orgName, '')
    }

    if (!campusId) {
      const campuses = (await db.collection('organisations').doc(orgId).collection('campuses').limit(1).get()).docs

      if (campuses.length > 0) {
        campusId = campuses[0].id
      } else {
        campusId = await CarryUtils.createCampus(orgId, 'Main Campus', '')
        console.log(`Created campus ${campusId} `)
      }
    }

    const orgRef = db.collection('organisations').doc(orgId)
    const campusRef = db.collection('organisations').doc(orgId).collection('campuses').doc(campusId)

    let orgAndCampusExists = (await orgRef.get()).exists && (await campusRef.get()).exists
    let orgCounter = 0

    // there is a race condition where the user.onUpdate process tries to update the campus data before the campus has been created
    // need to wait until we can access the doc before proceeding.
    while (!orgAndCampusExists && orgCounter <= 10) {
      console.log('Org and campus not found ' + orgCounter)
      await new Promise((resolve) => setTimeout(resolve, 5000))
      orgAndCampusExists = (await orgRef.get()).exists && (await campusRef.get()).exists
      orgCounter++
    }

    if (!orgAndCampusExists) throw new Error('Exhausted tries trying to create an org and campus')

    onboarding.orgId = orgId
    onboarding.campusId = campusId

    const userUpdate: any = {
      name: `${onboarding.firstName} ${onboarding.lastName}`,
      email: onboarding.email,
      phoneNumber: onboarding.phoneNumber || '',
      organisation: {
        id: orgId,
        campusId: campusId,
        role: 'owner',
      },
    }

    let userUpdateSuccess = false

    try {
      console.info(`Updating user data`)
      await db.collection('users').doc(userId).update(userUpdate)
      userUpdateSuccess = true
    } catch (e) {
      console.warn("Can't update user record")
      console.log(e)
    }

    if (userUpdateSuccess) {
      try {
        const isMailchimpSubscriber = await MailchimpMarketing.checkMember(MAILCHIMP_AUDIENCE_ID, onboarding.email)

        const tags = []

        if (response.setupOption === 'dashboard') tags.push('Onboarded Dashboard')
        if (response.setupOption === 'group') tags.push('Onboarded Group')

        const mergeData = {
          FNAME: onboarding.firstName,
          LNAME: onboarding.lastName,
          PHONE: onboarding.phoneNumber,
          MINISTRY: onboarding.orgName || '',
        }

        if (isMailchimpSubscriber) {
          await MailchimpMarketing.updateMemberData(MAILCHIMP_AUDIENCE_ID, onboarding.email, mergeData)

          if (tags.length > 0) await MailchimpMarketing.addMemberTags(MAILCHIMP_AUDIENCE_ID, onboarding.email, tags)
        } else {
          await MailchimpMarketing.subscribeNewMember(MAILCHIMP_AUDIENCE_ID, onboarding.email, mergeData, tags)
        }
      } catch (e) {
        console.log('Cannot add user to mailchimp list')
        console.log(e)
      }
    }

    if (response.setupOption === 'dashboard') {
      console.log('dashboard signup')

      const mergeVars = [
        {
          name: 'DASHBOARDLINK',
          content: DASHBOARD_URL,
        },
      ]

      if (userUpdateSuccess) {
        await Mailchimp.sendEmailTemplate(
          'Carry',
          'hello@carrybible.com',
          'onboarding-welcome-dashboard',
          devPrefix + 'Your new Carry dashboard access 🔓',
          onboarding.email,
          onboarding.firstName || 'Carry User',
          mergeVars,
        )
      }
    } else if (response.setupOption === 'group') {
      console.log('group signup')

      const groupName =
        onboarding.firstName?.charAt(-1) === 's' ? `${onboarding.firstName}' Group` : `${onboarding.firstName}'s Group`
      const groupId = await CarryUtils.createGroup(
        groupName,
        orgId,
        campusId,
        getRandomGroupImage(),
        onboarding.offset || 0,
        userId,
        'onboarding',
        false,
      )
      const invite = await CarryUtils.createInvite(userId, groupId, orgId)

      onboarding.groupId = groupId
      onboarding.groupInviteId = invite.inviteId
      onboarding.groupInviteUrl = invite.inviteUrl
      onboarding.groupInviteCode = invite.inviteCode
      onboarding.groupInviteQrCodeUrl = invite.inviteQrCodeUrl

      const mergeVars = [
        {
          name: 'GROUPLINK',
          content: onboarding.groupInviteUrl,
        },
        {
          name: 'GROUPCODE',
          content: onboarding.groupInviteCode,
        },
      ]

      if (userUpdateSuccess) {
        await Mailchimp.sendEmailTemplate(
          'Carry',
          'hello@carrybible.com',
          'onboarding-welcome-group',
          devPrefix + 'Your new Carry group ✨',
          onboarding.email,
          onboarding.firstName || 'Carry User',
          mergeVars,
        )
      }

      await Slack.sendLoggingMessage(
        `${onboarding.firstName} (${onboarding.email}) ${
          onboarding.orgName ? 'from ' + onboarding.orgName : ''
        } has signed up to the ${onboarding.setupOption}`,
      )
    } else {
      throw new Error(`Unknown setup option ${response.setupOption}`)
    }

    if (!onboarding.id) {
      onboarding.id = randomUUID()
      throw new Error(`No onboarding Id, set to ${onboarding.id}`)
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e)
      onboarding.error = e.stack || e.message

      if (!isDev) {
        try {
          await Slack.sendLoggingMessage(`Problem with onboarding ${e.message} `)
        } catch (e) {
          console.log(e)
        }
      }
    }
  } finally {
    if (onboarding.id) {
      await db.collection('onboardings').doc(onboarding.id).set(onboarding)
    }
  }
}

function convertResponse(event: TypeformWebhook): {
  isOrg: boolean
  orgtype?: string
  orgTypeText?: string
  orgPhysicalLocations?: string
  orgName?: string
  orgRole?: string
  reason: string
  people: string
  multipleGroupsText: string
  multipleGroups: boolean
  firstName: string
  lastName: string
  phoneNumber: string
  email: string
  setupOption: 'group' | 'dashboard'
  unknown: Array<any>
} {
  const typeformDefinition: { [index: string]: string } = {
    d7NZa2yLjXjN: 'isOrg',
    nHPaeUPafQ3r: 'orgTypeText',
    '7lo6nhN7O4xp': 'orgPhysicalLocations',
    MhEbO4owobDA: 'orgName',
    RUw25iLwLL9n: 'orgRole',
    MVQS1BdXN4e9: 'orgRole',
    RwEsajhQp8gw: 'orgRole',
    Fd3KoRrPm8Yi: 'orgRole',
    QDqzvwo3Gc9E: 'reason',
    shdiqfqrJGpc: 'people',
    Y07T97kjVZWY: 'multipleGroupsText',
    TVWowVKoYoyB: 'firstName',
    M23RfD0g9JZO: 'lastName',
    L0uwtuYPFalf: 'phoneNumber',
    MI2Gnbb3vH1W: 'email',
  }

  const result: any = {
    unknown: [],
  }

  for (const answer of event.form_response.answers) {
    let value: any

    switch (answer.type) {
      case 'boolean':
        if (answer.hasOwnProperty('boolean')) value = answer.boolean
        break
      case 'choice':
        if (answer.hasOwnProperty('choice') && answer.choice) value = answer.choice.label || answer.choice.other
        break
      case 'text':
        if (answer.hasOwnProperty('text')) value = answer.text
        break
      case 'phone_number':
        if (answer.hasOwnProperty('phone_number')) value = answer.phone_number
        break
      case 'email':
        if (answer.hasOwnProperty('email')) value = answer.email
        break
    }

    if (value === undefined) {
      console.log(answer)
      throw new Error(`Unknown typeform response type: ${answer.type} `)
    }

    const field = typeformDefinition[answer.field.id]

    if (field === undefined) {
      result.unknown.push({ [answer.field.id]: value })
    } else {
      result[field] = value
    }
  }

  for (const variable of event.form_response.variables) {
    switch (variable.key) {
      case 'org_type':
        result.orgType = variable.text
        break
      case 'setup_option':
        result.setupOption = variable.text
        break
      case 'score':
        break
      default:
        result.unknown.push({ [variable.key]: variable.text || variable.number })
    }
  }

  return result
}

function getRandomGroupImage() {
  const randomNumber = Math.floor(Math.random() * (GROUP_IMAGE_MAX - 1)) + 1
  return GROUP_IMAGE_URL.replace(GROUP_IMAGE_TEMPLATE, randomNumber.toString())
}
