import { RuntimeOptions, runWith } from 'firebase-functions'
import { Service } from '../shared'
import { OpenAI, Plan } from './'

const carryUID = Service.Firebase.appCheck().app.options.projectId === 'carry-live' ? '' : ''

const runtimeOpts: RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB',
}

export default runWith(runtimeOpts).https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Access-Control-Allow-Methods', 'POST')

  let promise

  if (req.method === 'OPTIONS') {
    res.status(204).send('')
  } else if (req.method === 'POST') {
    const event = req.body

    let orgId = ''
    let sermonSummary = ''

    if (event.event_type === 'form_response' && event.form_response.form_id === '') {
      res.status(200).send()

      if (event.form_response.variables[0]?.key === 'org_id') {
        orgId = event.form_response.variables[0]?.text
      }

      if (event.form_response.answers[1]?.text) sermonSummary = event.form_response.answers[1]?.text

      if (orgId !== '' && sermonSummary !== '') {
        console.log(`Received new request to add a new plan to ${orgId} with prompt ${sermonSummary}`)
        promise = createAndPushPlan(orgId, sermonSummary)
      }
    } else {
      res.status(400).send({ error: 'Missing data.' })
      console.log('Correct data not found in form response')
    }
  } else {
    res.status(405).send()
  }

  return promise
})

async function createAndPushPlan(orgId: string, sermonSummary: string) {
  const plan = await createCarryPlanFromSermonSummary(sermonSummary)

  await Plan.pushPlanToOrg(plan, orgId)
}

async function createCarryPlanFromSermonSummary(sermonSummary: string) {
  const prompt = `This creates a hopeful 7-day Bible study plan based on the biblical themes in the sermon summary. It uses relevant Bible passages and creates questions for each day of the study. It does not create titles or questions that are offensive or political.\n\n///\nSermon Summary: Paul was overwhelmed by the challenges he faced on his missionary journeys. He was honest about the difficulties he encountered, including shipwrecks, stonings, and beatings. Despite the hardships, he persevered because he knew that God was with him. Joni Eareckson Tada, who has been paralyzed for 55 years, also knows the sustaining power of God. She encourages others to trust in God, even when they feel overwhelmed.\n\nStudy plan title: With us through trials \n\n**\nDay 1\nTitle: When You're Overwhelmed\nBible Passage: 2 Corinthians 4:10-15\nDiscussion question 1: What verse stood out to you?\n\n**\nDay 2\nTitle: Facing The Trials\nBible Passage: 2 Corinthians 6:1-10\nDiscussion question 1: What does Paul say about facing difficulties? \n\n**\nDay 3\nTitle: God is with us\nBible Passage: 2 Corinthians 12:1-10\nDiscussion question 2: What can we learn from Paul's example? \n\n**\nDay 4\nTitle: Trusting in God\nBible Passage: Psalm 46\nDiscussion question 1: What does this passage tell us about God? \nDiscussion question 2: What does it mean to trust in God? \n\n**\nDay 5\nTitle: God's sustaining power\nBible Passage: Isaiah 40:1-11\nDiscussion question 1: What do you find comfort in knowing about God? \n\n**\nDay 6\nTitle: Hope in God\nBible Passage: Romans 15:1-13\nDiscussion question 1: What does Paul say about hope? \n\n**\nDay 7\nTitle: God's strength in our weakness\nBible Passage: 2 Corinthians 12:9-10\nDiscussion question 1: What does it mean to have God's strength in our weakness?\n\n///\nSermon Summary: A 20-year-old man moves from Los Angeles to Illinois to escape the drug culture and find hope in the church. He gets a job at the church and starts to turn his life around. He meets a woman who inspires him to be generous. He and his wife start to understand the power of God's promises. They start to give beyond their ability and see the purposes of God working in their lives. The man has a panic attack at church but is inspired by the worship service.\n\nStudy plan title: The Power of God's Promises\n\n**\nDay 1\nTitle: Turning to God\nBible Passage: Psalm 51:1-17\nDiscussion question 1: What does it mean to turn to God?\n\n**\nDay 2\nTitle: Finding Hope in the Church\nBible Passage: Acts 2:1-47\nDiscussion question 1: What can we learn from the example of the early church?\n\n**\nDay 3\nTitle: The Generous Life\nBible Passage: 2 Corinthians 8:1-15\nDiscussion question 1: Why is it important to be generous?\n\n**\nDay 4\nTitle: God's Promises\nBible Passage: 2 Corinthians 1:20-22\nDiscussion question 1: What does it mean to trust in God's promises?\n\n**\nDay 5\nTitle: Giving Beyond Our Ability\nBible Passage: 2 Corinthians 9:1-15\nDiscussion question 1: What does it mean to give beyond our ability? \n\n**\nDay 6\nTitle: Seeing God at Work\nBible Passage: Ephesians 1:1-14\nDiscussion question 1: Where can you see God at work in your life? \n\n**\nDay 7\nTitle: Worshiping God\nBible Passage: Psalm 100\nDiscussion question 1: What does it mean to worship God? \n\n///\nSermon Summary: Being bored with life is a dangerous feeling—one that often leads us to search for excitement and fulfillment in all the wrong places. Join us as we learn what boredom-free living looks like when we walk with our thrilling God!\n\nStudy plan title: Thrilling Living \n\n**\nDay 1\nTitle: The Dangers of Boredom\nBible Passage: Ecclesiastes 4:1-16\nDiscussion question 1: What are some of the dangers of feeling bored with life? \n\n**\nDay 2\nTitle: The Excitement of God\nBible Passage: Psalm 16:1-11\nDiscussion question 1: What does it mean to walk with God? \n\n**\nDay 3\nTitle: The Fulfillment of God's Promises\nBible Passage: Isaiah 55:1-13\nDiscussion question 1: What can we learn from God's promises? \n\n**\nDay 4\nTitle: God's Thrilling Presence\nBible Passage: Exodus 33:1-23\nDiscussion question 1: What does it mean to have God's presence in our lives? \n\n**\nDay 5\nTitle: God's Exciting Plans\nBible Passage: Jeremiah 29:1-14\nDiscussion question 1: What can we learn from God's plans? \n\n**\nDay 6\nTitle: God's Adventure\nBible Passage: 1 Peter 4:1-11\nDiscussion question 1: What does it mean to adventure with God? \n\n**\nDay 7\nTitle: Boredom-Free Living\nBible Passage: Colossians 3:1-17\nDiscussion question 1: How can we live exciting, boredom-free lives?\n\n///\nSermon Summary: ${sermonSummary}`

  const completion = await OpenAI.getCompletion(prompt)

  const openAIPlan = completion.choices[0].text

  const lines = openAIPlan.split('\n')
  let line: string

  const days: Array<any> = []
  let title: string = 'Generated Plan'
  const description: string = 'Generated Plan'
  const image: string = ''
  let dayTitle = ''
  let dayIndex = 0
  let dayActivities: Array<any> = []

  for (line of lines) {
    if (line.startsWith('Study plan title:')) {
      title = line.substring(18)
    } else if (line.startsWith('Title:')) {
      dayTitle = line.substring(7)
    } else if (line.startsWith('Bible Passage:')) {
      const verseString = line.substring(15)
      const verseActivity = Plan.createVerseActivityFromString(verseString)
      dayActivities.push(verseActivity)
    } else if (line.startsWith('Discussion question')) {
      const split = line.split(':')
      const questionText = split[1].substring(1)

      const questionActivity = Plan.createQuestionActivity(questionText)

      dayActivities.push(questionActivity)
    } else if (line.startsWith('**')) {
      if (dayActivities.length > 0) {
        const day = Plan.createDay(dayIndex, dayTitle, dayActivities)
        days.push(day)
        dayTitle = ''
        dayIndex++
        dayActivities = []
      }
    }
  }

  const lastDay = Plan.createDay(dayIndex, dayTitle, dayActivities)
  days.push(lastDay)

  if (days.length === 7) {
    const plan = Plan.createPlan(carryUID, days, days.length, title, description, image)
    return plan
  } else {
    console.log(openAIPlan)
    throw new Error('Generated Open AI plan was not 7 days')
  }
}
