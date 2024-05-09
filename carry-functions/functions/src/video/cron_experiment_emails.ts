import * as functions from 'firebase-functions'
import { Service } from '../shared'
import { MailchimpMarketing } from './'

const db = Service.Firebase.firestore()
const MAILCHIMP_AUDIENCE_ID = ''
const sendExperimentEmails = functions.pubsub.schedule('0 9 * * *').onRun(async (context) => {
  const orgQuery = db
    .collection('organisations')
    .where('mainEmail', '!=', null)
    .where('subscription.name', '==', 'Free')
    .where('source', '==', 'study-creator')
  const orgs = (await orgQuery.get()).docs

  console.log(`Found ${orgs.length} orgs using the free product that we can possibly update with stats`)

  for (const orgRef of orgs) {
    try {
      const org = orgRef.data()

      if (org.mainEmail) {
        if (await MailchimpMarketing.checkMember(MAILCHIMP_AUDIENCE_ID, org.mainEmail)) {
          console.log(`Found ${org.mainEmail} for ${org.id} updating`)

          const readingMilli = org.totalReadingTime || 0
          const readingMins = readingMilli / 1000 / 60
          const readingDisplay = readingMins > 1000 ? (readingMins / 1000).toFixed(1) + 'K' : readingMins
          const prayers = org.totalPrayer || 0
          let groupMemberCount = 0

          let mainGroupId = org.mainGroup

          if (!mainGroupId) {
            const groupQuery = db.collection('groups').where('organisation.id', '==', org.id)
            const groups = (await groupQuery.get()).docs
            if (groups.length > 0) {
              mainGroupId = groups[0].id
            }
          }

          if (mainGroupId) {
            const groupRef = db.collection('groups').doc(mainGroupId)
            const group = (await groupRef.get()).data()
            groupMemberCount = group?.memberCount || 0
          }

          const mergeTags = {
            PRAYERS: prayers,
            MIN_READ: readingDisplay,
            NUM_MEMBER: groupMemberCount,
          }

          console.log(`Updating ${org.id} with ${JSON.stringify(mergeTags)}`)

          await MailchimpMarketing.updateMemberData(MAILCHIMP_AUDIENCE_ID, org.mainEmail, mergeTags)
        } else {
          console.log(`${org.mainEmail} for ${org.id} not found in Mailchimp Audience`)
        }
      }
    } catch (error) {
      console.log(error)
    }

    /*console.log(`Test Send stats email: to ${org.mainEmail} with ${readingDisplay} and ${prayersDisplay}`)

    const mergeVars = [
      {
        name: 'MINUTES_READING',
        content: readingDisplay,
      },
      {
        name: 'PRAYERS',
        content: prayersDisplay,
      },
    ]


    await Mailchimp.sendEmailTemplate(
      'Carry',
      'hello@carrybible.com',
      'growth-experiment-ministray-stats',
      devPrefix + 'See how your ministry is engaging on Carry ✨',
      "phil+emailtest@carrybible.com",
      "phil+emailtest@carrybible.com",
      mergeVars,
    )*/
  }
})

export default sendExperimentEmails
