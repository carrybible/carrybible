import axios from 'axios'
import { config } from 'firebase-functions'
import { Service } from '../shared'
import { Plan } from './'
import { CarryPlan } from './Plan'

const OPEN_AI_API_KEY = config().openai.apikey;
const db = Service.Firebase.firestore()

type OpenAIData = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    text: string;
    index: number;
    logProbs: any;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }
}

type OpenAIError = {
  error: {
    message: string;
    type: string,
    param: string,
    code: string
  }
}

export interface OpenAIPlan extends CarryPlan {
  planOpenAiOutput: string,
  planTextVersion: Array<string>,
  planVideoVersion: {
    title: string,
    passage: string
  }[],
  planGenerator:
  {
    version: number,
    id: string
  },
  sermonSummary: string,
  origin: 'video',
  planVideo?: string,
  planVideoId?: string,
  planYouTubeVideoUrl?: string,
}

export async function getCompletion(prompt: string, model: string = "text-davinci-002", temperature: number = 0.5,
  maxTokens: number = 1024, topP: number = 1, frequencyPenalty: number = 0, presencePenalty: number = 0, stop: Array<string> = ["///"]) {

  const openAiUrl = "https://api.openai.com/v1/completions";
  const payload = {
    model: model,
    prompt: prompt,
    temperature: temperature,
    max_tokens: maxTokens,
    top_p: topP,
    frequency_penalty: frequencyPenalty,
    presence_penalty: presencePenalty,
    stop: ["///"]
  }

  const postConfig = {
    headers: { Authorization: `Bearer ${OPEN_AI_API_KEY}` }
  }

  let data

  try {
    const response = await axios.post(openAiUrl, payload, postConfig)
    data = response.data as OpenAIData;

  } catch (e) {
    let message;
    if (e instanceof Error) {
      message = e.message;
      if (axios.isAxiosError(e)) {
        if (e.response?.data) {
          message = (e.response.data as OpenAIError).error.message
        }
      }
    }
    throw new Error(message)
  }
  return data;
}

async function getCompletionText(prompt: string, model: string = "text-davinci-002", temperature: number = 0.5,
  maxTokens: number = 1024, topP: number = 1, frequencyPenalty: number = 0, presencePenalty: number = 0, stop: Array<string> = ["///"]): Promise<string | undefined> {

  const data = await getCompletion(prompt, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, stop)

  if ((data.choices?.length || 0) === 0) {
    throw new Error(`No options given from OpenAI Completion`)
  } else if (data.choices.length === 1) {
    return data.choices[0].text;

  } else if ((data.choices.length > 1)) {
    console.log(`Unused ${data.choices.length - 1} options from OpenAI`)
    return data.choices[0].text;
  } else {
    console.log("Problem with Open AI response:")
    console.log(data)
  }
  return undefined
}

async function getPromptFromDb(promptType: string, templateValues: any) {
  const generator = await (
    await db.collection('openai').doc(promptType).collection('versions').orderBy('created', 'desc').limit(1).get()
  ).docs[0].data() as any

  if (generator && generator.prompt) {
    console.log(`Found OpenAI prompt for ${promptType} version ${generator.version}`)
    let prompt: string = generator.prompt

    prompt = prompt.replace(/\\n/g, '\n')

    const templates = generator.templates

    for (const template of templates) {
      prompt = prompt.replace(`{{${template}}}`, templateValues[template] || "")
    }

    prompt = prompt.trim();

    generator.prompt = prompt;
  }
  return generator
}

/**
 * Attempts to build a 7-day plan using gpt3
 * 
 * Open AI does not reliably create it in the same format, so we try 3 times and validate each try.
 * **/
export async function createCarryPlanFromSermonSummary(
  author: string,
  sermonSummary: string,
  verses: string[],
  planLength: number,
  title?: string,
  image?: string,
): Promise<OpenAIPlan> {

  const defaultGenerator = {
    prompt: `This creates a hopeful ${planLength} day Bible study plan based on the biblical themes in the sermon summary. It adds one relevant Bible passage and creates one question for each day of the study. It does not create titles or questions that are offensive or political.\n\n///\nSermon Summary: Paul was overwhelmed by the challenges he faced on his missionary journeys. He was honest about the difficulties he encountered, including shipwrecks, stonings, and beatings. Despite the hardships, he persevered because he knew that God was with him. Joni Eareckson Tada, who has been paralyzed for 55 years, also knows the sustaining power of God. She encourages others to trust in God, even when they feel overwhelmed. (2 Corinthians 4:7-18, Romans 15:1-13)\n\nStudy plan title: With us through trials \n\n**\nDay 1\nTitle: When You're Overwhelmed\nBible Passage: 2 Corinthians 4:7-18\nDiscussion question 1: What verse stood out to you?\n\n**\nDay 2\nTitle: Facing The Trials\nBible Passage: 2 Corinthians 6:1-10\nDiscussion question 1: How does Paul say we should face difficulties? \n\n**\nDay 3\nTitle: God is with us\nBible Passage: 2 Corinthians 12:1-10\nDiscussion question 1: What can you learn from Paul's example? \n\n**\nDay 4\nTitle: Trusting in God\nBible Passage: Psalm 46\nDiscussion question 1: How can you increase your trust in God this week? \n\n**\nDay 5\nTitle: God's sustaining power\nBible Passage: Isaiah 40:1-11\nDiscussion question 1: What do you find comfort in knowing about God? \n\n**\nDay 6\nTitle: Hope in God\nBible Passage: Romans 15:1-13\nDiscussion question 1: What is a way you can grow in your hope in God? \n\n**\nDay 7\nTitle: God's strength in our weakness\nBible Passage: 2 Corinthians 12:9-10\nDiscussion question 1: What's an area you need God's strength in your weakness?\n\n///\nSermon Summary: A 20-year-old man moves from Los Angeles to Illinois to escape the drug culture and find hope in the church. He gets a job at the church and starts to turn his life around. He meets a woman who inspires him to be generous. He and his wife start to understand the power of God's promises. They start to give beyond their ability and see the purposes of God working in their lives. The man has a panic attack at church but is inspired by the worship service. (2 Corinthians 8:1-2, 2 Corinthians 8:7)\n\nStudy plan title: The Power of God's Promises\n\n**\nDay 1\nTitle: Turning to God\nBible Passage: Psalm 51:1-17\nDiscussion question 1: What are ways you turn to God?\n\n**\nDay 2\nTitle: Finding Hope in the Church\nBible Passage: Acts 2:1-47\nDiscussion question 1: What did you learn from the example of the early church?\n\n**\nDay 3\nTitle: The Generous Life\nBible Passage: 2 Corinthians 8:1-15\nDiscussion question 1: What are ways you'd like to be more generous?\n\n**\nDay 4\nTitle: God's Promises\nBible Passage: 2 Corinthians 1:20-22\nDiscussion question 1: In what ways do you trust in God's promises?\n\n**\nDay 5\nTitle: Giving Beyond Our Ability\nBible Passage: 2 Corinthians 9:1-15\nDiscussion question 1: Are there any ways you're challenged to give beyond your ability? \n\n**\nDay 6\nTitle: Seeing God at Work\nBible Passage: Ephesians 1:1-14\nDiscussion question 1: Where can you see God at work in your life? \n\n**\nDay 7\nTitle: Worshiping God\nBible Passage: Psalm 100\nDiscussion question 1: How do you worship God? \n\n///\nSermon Summary: Being bored with life is a dangerous feeling—one that often leads us to search for excitement and fulfillment in all the wrong places. Join us as we learn what boredom-free living looks like when we walk with our thrilling God! \n\nStudy plan title: Thrilling Living \n\n**\nDay 1\nTitle: The Dangers of Boredom\nBible Passage: Ecclesiastes 4:1-16\nDiscussion question 1: What are some of the dangers of feeling bored with life? \n\n**\nDay 2\nTitle: The Excitement of God\nBible Passage: Psalm 16:1-11\nDiscussion question 1: What are some ways you walk with God? \n\n**\nDay 3\nTitle: The Fulfillment of God's Promises\nBible Passage: Isaiah 55:1-13\nDiscussion question 1: What did you learn about God's promises? \n\n**\nDay 4\nTitle: God's Thrilling Presence\nBible Passage: Exodus 33:1-23\nDiscussion question 1: How do you experience God's presence in your life? \n\n**\nDay 5\nTitle: God's Exciting Plans\nBible Passage: Jeremiah 29:1-14\nDiscussion question 1: How does this passage challenge your view of God's plans? \n\n**\nDay 6\nTitle: God's Adventure\nBible Passage: 1 Peter 4:1-11\nDiscussion question 1: How would you like to adventure with God? \n\n**\nDay 7\nTitle: Boredom-Free Living\nBible Passage: Colossians 3:1-17\nDiscussion question 1: How can we live exciting, boredom-free lives?\n\n///\nSermon Summary: ${sermonSummary}
  
  Study plan title: ${title}`,
    model: "text-davinci-002",
    temperature: 0.5,
    max_tokens: 500,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ['///'],
    version: 'default',
    id: 'default'
  }

  const versesString = verses.length > 0 ? `(${verses.join(', ')})` : ""

  const templateValues = {
    sermonSummary: sermonSummary,
    planLength: planLength.toString(),
    sermonTitle: title || "",
    versesString: versesString
  }

  let generator = await getPromptFromDb("plan", templateValues)

  if (!generator && !generator.prompt) {
    console.log('Using default generator')
    generator = defaultGenerator
  }

  if (title) generator.prompt += "\n\n"; // add two new line on to sermon title

  const maxTries = 3
  let openAiPlanText: string | undefined = ''

  for (let i = 0; i < maxTries; i++) {
    try {
      openAiPlanText = await getCompletionText(
        generator.prompt,
        generator.model,
        generator.temperature,
        generator.max_tokens,
        generator.top_p,
        generator.frequency_penalty,
        generator.presence_penalty,
        generator.stop,
      )

      if (openAiPlanText !== undefined) {

        const lines = openAiPlanText.split('\n')
        let line: string

        const days: Array<any> = []
        let planTitle: string = title || ""
        let dayTitle = ''
        let dayIndex = 0
        let dayActivities: Array<any> = []
        let newDay, hasVerse, hasQuestion = false;
        let completeDays = 0;

        const textVersion: Array<string> = [];
        let textVersionDay = '<b>';
        const videoVersion: Array<{
          title: string,
          passage: string
        }> = [];
        let videoVersionDay: {
          title: string,
          passage: string
        } = { title: "", passage: "" };

        // parse the text output from gpt3 into the required data format
        for (line of lines) {
          if (line.startsWith('Study plan title:') && planTitle === "") {
            planTitle = line.substring(18).trim();
          } else if (line.startsWith('Title:')) {
            dayTitle = line.substring(7).trim();
            newDay = true;
            textVersionDay += `${dayTitle}</b> | `
            videoVersionDay.title = dayTitle
          } else if (line.startsWith('Bible Passage:')) {
            const verseString = line.substring(15).trim();
            textVersionDay += `${verseString} | `
            videoVersionDay.passage = verseString
            videoVersion.push(videoVersionDay)
            videoVersionDay = { title: "", passage: "" };
            const verseActivity = Plan.createVerseActivityFromString(verseString)
            dayActivities.push(verseActivity)
            hasVerse = true
          } else if (line.startsWith('Discussion question 1:')) {
            const questionText = line.substring(22).trim();
            textVersionDay += questionText
            const questionActivity = Plan.createQuestionActivity(questionText)
            hasQuestion = true;
            dayActivities.push(questionActivity)
          } else if (line.startsWith('**')) {
            if (dayActivities.length > 0) {
              if (newDay && hasVerse && hasQuestion) completeDays++;
              const day = Plan.createDay(dayIndex, dayTitle, dayActivities)
              days.push(day)
              dayTitle = ''
              dayIndex++
              dayActivities = []
              newDay = false;
              hasVerse = false;
              hasQuestion = false;
              textVersion.push(textVersionDay)
              textVersionDay = '<b>';
            }
          } else if (line !== "" && planTitle === "") planTitle = line // if plan title hasn't been provided, the first line with no special characters is likely to be to title
        }

        if (newDay && hasVerse && hasQuestion) completeDays++;
        const lastDay = Plan.createDay(dayIndex, dayTitle, dayActivities)
        days.push(lastDay)
        textVersion.push(textVersionDay)

        if (days.length === planLength && completeDays === planLength) {
          const plan: CarryPlan = Plan.createPlan(author, days, days.length, planTitle, sermonSummary, image || "")
          const openAiPlan: OpenAIPlan = {
            ...plan,
            planOpenAiOutput: openAiPlanText,
            planTextVersion: textVersion,
            planVideoVersion: videoVersion,
            planGenerator: { version: generator.version, id: generator.id },
            sermonSummary: sermonSummary,
            origin: 'video'
          }
          return openAiPlan
        } else {
          console.log(`Generated Open AI plan was not ${planLength} complete days, ${i + 1} try`)
          console.log(openAiPlanText)
        }
      } else {
        console.log('Error generating plan, created empty plan')
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log('Error generating plan ' + e.stack)
        console.log(openAiPlanText)
      }
    }
  }
  throw new Error('Unable to generate a plan, tries exahusted')
}

export async function getSermonSummaryFromSubtitles(sermonTranscript: string) {

  const defaultGenerator = {
    prompt: `This creates a sermon summary based on the video transcript of a sermon. It uses relevant Bible passages and themes to create an accurate summary of the sermons topic. It does not create a sermon summary that is offensive or political.\n\n///\nTranscript: \" Jesus tells this story in Luke chapter 12 or at this Parable and he basically says if if you invite somebody to a party don't invite people who can repay you but invite the lame the blind those who are suffering the poor the outcasts invite those who cannot repay you at all and so God's heart is for those with special needs 70 percent of families with special needs who have tried to go to church are turned away from the church because perhaps the church doesn't feel like it can serve those families which means that some say a special needs Community is an unreached Community but we believe each individual created in the image of God and we are excited that we are ramping up our special needs ministry here at marriage Church it started several years ago but we are bringing greater focus and intensity to this important Ministry so we want to care for the prisoner for The Unborn and the mother of The Unborn for those with special needs and their families and you may ask why would we do that why does it matter for Christians to care for these because we aren't just any organization we get to serve people in the name of Jesus we get to serve the needs of people but also bring the gospel the good news of Jesus to people as we serve them and why why must we be this kind of people I want to show you or remind you of an incredible passage in the gospel of Matthew today it's very famous this is The Sermon on the Mount when Jesus speaks to his disciples about the kind of people they're going to be and I want to challenge you that if you're a Christian if you claim to be a Christian this is the kind of person that Jesus invites us to be Matthew chapter 5 verse 1 and this is all under the banner of why do we want to be a church that's for the good of those we serve for the good of our cities for the good of the prisoner The Unborn and the special needs for the good of our communities why would we be that kind of church Matthew 5 verse 1. when Jesus saw the crowds he went up on the mountain and after he sat down his disciples came to him then he began to teach them sane blessed are the poor in spirit for the Kingdom of Heaven is theirs blessed are those who mourn for they will be comforted blessed are the humble for they will inherit the earth blessed are those who hunger and thirst for righteousness for they will be filled blessed are the merciful for they will be shown Mercy blessed are the pure in heart for they will see God blessed are the peacemakers for they will be called sons of God blessed are those who are persecuted because of righteousness for\"\n*Sermon Summary: Jesus calls the Church a city on a hill—a community of His people who serve the needy with humility. Join us as we learn how to serve others and transform our communities in a way that can’t be hidden!\n\n///\nTranscript: ${sermonTranscript}
  
  Sermon summary:`,
    model: "text-davinci-002",
    temperature: 0.5,
    max_tokens: 110,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stop: ['///'],
    version: 'default',
    id: 'default'
  }
  const templateValues = { sermonTranscript: sermonTranscript }

  let generator = await getPromptFromDb("sermonSummary", templateValues)

  if (!generator && !generator.prompt) {
    console.log('Using default sermon summary creator')
    generator = defaultGenerator
  }

  const maxTries = 3
  let openAiSummary: string | undefined = "";

  for (let i = 0; i < maxTries; i++) {
    try {
      openAiSummary = await getCompletionText(
        generator.prompt,
        generator.model,
        generator.temperature,
        generator.max_tokens,
        generator.top_p,
        generator.frequency_penalty,
        generator.presence_penalty,
        generator.stop,
      )

      if (openAiSummary !== undefined) {
        return openAiSummary

      } else {
        console.log('Error generating sermon summary, empty summary')
      }
    } catch (e) {
      console.log('Error creating summary ' + e)
      console.log(openAiSummary)
    }
  }
  throw new Error('Unable to generate a plan')
}

export default {
  getCompletion,
  getSermonSummaryFromSubtitles,
  createCarryPlanFromSermonSummary
}