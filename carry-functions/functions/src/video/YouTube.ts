import { Bible, OpenAI } from './'
import axios from 'axios'
import he from 'he';
import { find } from 'lodash';
import striptags from 'striptags';
import ytdl from 'ytdl-core';
import { Names } from './Names'

function validateYouTubeUrl(youTubeUrl: string) {
  return ytdl.validateURL(youTubeUrl)
}

async function getYouTubeInfo(youTubeVideoUrl: string) {
  const info = await ytdl.getInfo(youTubeVideoUrl);

  const format = findBestFormat(info.formats)

  let bestThumbnail: ytdl.thumbnail = {
    url: "",
    height: 0,
    width: 0
  }

  for (const thumbnail of info.videoDetails.thumbnails) {
    if (thumbnail.height > bestThumbnail.height) bestThumbnail = thumbnail
  }

  const image = bestThumbnail.url.split("?")[0] || ""

  bestThumbnail = {
    url: "",
    height: 0,
    width: 0
  }

  for (const thumbnail of info.videoDetails.author.thumbnails || []) {
    if (thumbnail.height > bestThumbnail.height) bestThumbnail = thumbnail
  }

  const channelImage = bestThumbnail.url

  let captionsUrl: undefined | string
  let hasOtherLanguages = false;

  //console.log(info.player_response.captions?.playerCaptionsTracklistRenderer.captionTracks)

  if (info.player_response.captions) {
    for (const captions of info.player_response.captions.playerCaptionsTracklistRenderer.captionTracks) {
      if (captions.languageCode !== "en") hasOtherLanguages = true;
      if (captionsUrl) {
        if (captions.languageCode === "en" && !captions.kind) captionsUrl = captions.baseUrl;
      } else {
        if (captions.languageCode === "en") captionsUrl = captions.baseUrl;
      }
    }
  }

  let videoSubtitles: string | undefined;

  if (captionsUrl) {
    videoSubtitles = await downloadYouTubeSubtitles(captionsUrl);
  }

  const youTubeVideoValid = validateVideoAndChannel(info.videoDetails.title, info.videoDetails.description || "", info.videoDetails.author.name);

  let youTubeVideoTime = 0;
  const youTubeVideoLengthSeconds = parseInt(info.videoDetails.lengthSeconds)

  if (youTubeVideoUrl.includes("t=")) {
    const time = youTubeVideoUrl.split("t=")[1];
    console.log(`time is ${time}`)
    youTubeVideoTime = parseInt(time);
  } else {
    if (youTubeVideoLengthSeconds) {
      youTubeVideoTime = Math.floor(youTubeVideoLengthSeconds * 0.75) //3/4 through the video
    } else {
      youTubeVideoTime = 1800 // 30 mins
    }
  }

  const video = {
    youTubeVideoId: info.videoDetails.videoId,
    youTubeVideoTitle: info.videoDetails.title,
    youTubeVideoDescription: info.videoDetails.description || "",
    youTubeVideoThumbnail: image,
    youTubeChannelId: info.videoDetails.author.id,
    youTubeChannelName: info.videoDetails.author.name,
    youTubeChannelImage: channelImage,
    //channelDescription: info.videoDetails.author.
    youTubeVideoLengthSeconds: youTubeVideoLengthSeconds,
    youTubeVideoIsLive: info.videoDetails.isLiveContent,
    youTubeVideoDirectUrl: format?.url,
    youTubeVideoSubtitlesUrl: captionsUrl,
    youTubeVideoSubtitles: videoSubtitles,
    youTubeVideoSubtitlesOtherLanguages: hasOtherLanguages,
    youTubeVideoValid: youTubeVideoValid,
    youTubeVideoFormat: format,
    youTubeVideoTime: youTubeVideoTime
  }

  //console.log(video);

  return video
}

export async function getYouTubeDirectVideoUrl(youTubeVideoId: string) {
  const info = await ytdl.getInfo(`https://youtube.com/watch?v=${youTubeVideoId}`);

  const format = findBestFormat(info.formats);

  return format?.url;
}

/**
 * Find the best format that can be used by `@remotion/lambda`, this is typically a non-live video, mp4 or vp9.
 * YouTube sometimes still uses the live feed after the livestream has ended, so some filters are required to remove these
 * **/
function findBestFormat(formats: ytdl.videoInfo["formats"]) {

  const qualityOrder = ["1080p", "1440p", "2160p", "720p", "720p60", "480p", "360p", "1080p60", "2160p60", "1440p60"]
  const filterFormats = formats.filter((v: any) => v.container !== "ts" && v.hasVideo && !v.isLive && v.targetDurationSec === undefined && !v.isDashMPD)

  let bestFormat;

  for (const format of filterFormats) {
    //console.log(format.qualityLabel + " " + format.videoCodec)
    if (!bestFormat) bestFormat = format
    if (qualityOrder.includes(format.qualityLabel)) {
      if (qualityOrder.indexOf(format.qualityLabel) <
        qualityOrder.indexOf(bestFormat.qualityLabel)) bestFormat = format
    }
  }

  if (bestFormat) {
    console.log("found best format: " + bestFormat.qualityLabel + " " + bestFormat.videoCodec)
  }

  return bestFormat
}

/**
 * Looking for church-related words in the video title, description, or channel name. Uses Books of the bible too.
 * If a video is incorrectly filtered out - update this method
 * **/
function validateVideoAndChannel(title: string, description: string, channelName: string) {
  const validationRegexString = "(church|chapel|worship|ministry|ministries|bible|god|jesus|service|prayer|gathering|sermon|preach|gospel|nativity|baptist|parish|bishop|christian|christ|christianity|thanksgiving|praise|lutheran"
  const validationRegex = new RegExp(validationRegexString + Bible.buildBibleBookString() + ")", "i")
  if (validationRegex.test(title) ||
    validationRegex.test(description) ||
    validationRegex.test(channelName)) {
    return true;
  }
  return false;
}

/**
 * Attempts to get the sermon title from the YouTube video title.
 * 
 * It will aggressively remove commonly used additions until what is left. e.g.:
 * name of the channel (commonly the church name), dates, episodes, books of the bible, names of preachers etc.
 *
 * For livestreams, this is not typically included, so if nothing is left, then we will use the OpenAI generated sermon title.
 * **/
function getSermonTitle(rawTitle: string, rawChannelName: string) {
  const title = rawTitle.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  const channelName = rawChannelName.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')

  console.info(`Finding sermon title for: ${title} from channel: ${channelName}`)

  const titleDelimitersRegex = /[-–|•/():#]+/
  const quotedRegex = /(?:^|\s)['"”“](.+)['"”“](?:$|\s)/i
  const genericTitleRegex = /\b(church|online|worship|sermon|praise|live|livestream|bible study|service|episode|part|ep.|ep|week)\b/i
  const namePrefixRegex = /\b(bishop|rev|rev.|reverand|pastor|dr|dr.|fr|fr.|sister|brother)/i
  const churchNameRegex = new RegExp(
    '\\b(?:' + channelName + '|' + channelName.replace(/church/i, '').trim() + ')\\b',
    'i',
  )
  const dateRegex =
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec|christmas|xmas|easter|summer|\d+\s*am|\d+\s*pm)\b/i
  const bibleRegexString = Bible.buildBibleRegexString()
  const verseRegexComponent = /\s*(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?:\s*([a-zA-Z]+)\s*(\d+))?(?::(\d+))?)?/
  const verseRegex = new RegExp(bibleRegexString + verseRegexComponent.source, 'i')
  //const VERSE_REGEX = /((?:\d\s)?[A-Za-z]+(?:\s[A-Za-z]+)*)\s*(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?:\s*([a-zA-Z]+)\s*(\d+))?(?::(\d+))?)?/;
  const nameRegex = new RegExp("\\b(" + Names.join("|") + ")\\b", "i")
  const justNumbersRegex = /^\d+$/i

  let titleSplits = title.split(titleDelimitersRegex)
  if (titleSplits === undefined || titleSplits === null || titleSplits.length === 0) titleSplits = [title]
  let sermonTitle = ''

  // check for any quoted sections (usually indicating titles) and seperate them
  titleSplits = titleSplits.reduce(function (titles: Array<string>, titleSplit: string) {
    const quotedMatch = titleSplit.match(quotedRegex)

    if (quotedMatch !== undefined && quotedMatch !== null && quotedMatch.length > 1) {
      //console.log(quotedMatch)
      //console.log(quotedMatch[1].trim())
      //console.log(titleSplit.replace(quotedMatch[1], '').trim())
      titles.push(quotedMatch[1].trim())
      titles.push(titleSplit.replace(quotedMatch[0], '').trim())
    } else {
      titles.push(titleSplit.trim())
    }

    return titles
  }, [])

  const filteredTitleSplits = titleSplits.filter((titleSegment) => {

    if (titleSegment === "") return false;

    /*console.log(titleSegment)
    
    console.log(titleSegment.match(genericTitleRegex))
    console.log(titleSegment.match(dateRegex))
    console.log(titleSegment.match(churchNameRegex))
    console.log(titleSegment.match(verseRegex))
    console.log(titleSegment.match(nameRegex))*/

    let check = (
      !genericTitleRegex.test(titleSegment) &&
      !dateRegex.test(titleSegment) &&
      !churchNameRegex.test(titleSegment) &&
      !verseRegex.test(titleSegment) &&
      !justNumbersRegex.test(titleSegment) &&
      !namePrefixRegex.test(titleSegment)
    )
    if (titleSegment.split(" ").length <= 3) check = check && !nameRegex.test(titleSegment)

    return check
  })

  //console.log(filteredTitleSplits)

  sermonTitle = filteredTitleSplits.join(" ");
  sermonTitle = sermonTitle.replace(/[^a-zA-Z0-9\'\"\s,&!?+]/gi, "")

  sermonTitle = sermonTitle.trim()
  if (sermonTitle.length < 5) {
    return undefined;
  } else {
    console.info(`Found sermon title ${sermonTitle}`)
    return sermonTitle;
  }
}

/**
 * Attempts to get the sermon description from the YouTube description.
 * 
 * Tries to follow common patterns found in YouTube descriptions
 * typically the sermon description is found first and then some generic church info.
 * Once it detects anything that looks generic, it will ignore the rest of the description.
 * **/
function getSermonSummaryFromVideoDescription(rawDescription: string, rawChannelName: string) {
  const channelName = rawChannelName.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  const description = rawDescription.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')

  console.info(`Finding sermon description from: ${description.slice(0, 100)} from channel: ${channelName}`)

  const urlRegex = /(https|http|www)/i
  const genericRegex = /(church|SyncID|Musicbed|connect|podcast|location|located|service|livestream|join us|tune in|watch|like|subscribe)/i
  const hashTagRegex = /#/i
  const emailRegex = /@/i
  const emojiRegex =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/i
  const headingRegex = /(?:[A-Z]+\s)+[A-Z]+/
  const timestampRegex = /\d\d?:\d\d?(?::\d\d?)?/
  const churchNameRegex = new RegExp(
    '\\b(?:' + channelName + '|' + channelName.replace(/church/i, '').trim() + ')\\b',
    'i',
  )
  const noLettersRegex = /^\W+$/

  let descriptionSplits = description.split('\n')

  if (descriptionSplits === undefined || descriptionSplits === null || descriptionSplits.length === 0)
    descriptionSplits = [description]

  let filteredDescription = ''
  let scan = true
  let found = false

  for (const descriptionSegment of descriptionSplits) {
    if (
      scan &&
      !(
        urlRegex.test(descriptionSegment) ||
        genericRegex.test(descriptionSegment) ||
        hashTagRegex.test(descriptionSegment) ||
        emailRegex.test(descriptionSegment) ||
        emojiRegex.test(descriptionSegment) ||
        churchNameRegex.test(descriptionSegment) ||
        headingRegex.test(descriptionSegment) ||
        timestampRegex.test(descriptionSegment) ||
        noLettersRegex.test(descriptionSegment)
      )
    ) {
      filteredDescription += ' ' + descriptionSegment
      found = true
    } else {
      if (found) scan = false
    }
  }

  filteredDescription = filteredDescription.trim()

  if (filteredDescription !== "") {
    console.info(`Found sermon description ${filteredDescription}`)
    return filteredDescription;
  } else {
    return undefined;
  }
}


/**
 * Send a portion of the subtitles to OpenAI to generate a summary from the subtitles.
 * **/
async function getSermonSummaryFromSermonSubtitles(sermonSubtitles: string) {

  if (!sermonSubtitles) return undefined;

  console.log('Using OpenAI to generate sermon summary from segment of sermon subtitles')

  const targetSermonSegment = findTargetSermonSegment(sermonSubtitles)
  const description = await OpenAI.getSermonSummaryFromSubtitles(targetSermonSegment)

  return description;
}

/**
 * Attempts to find scripture references from the YouTube description.
 * **/
function getBibleVersesFromVideoDetails(rawTitle: string, rawDescription: string) {

  const bibleRegexString = Bible.buildBibleRegexString()
  const verseRegexComponent = /\s*(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?:\s*([a-zA-Z]+)\s*(\d+))?(?::(\d+))?)?/
  const verseRegex = new RegExp(bibleRegexString + verseRegexComponent.source, 'i')
  const title = rawTitle.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  const description = rawDescription.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  let bibleVerses: Array<string> = []

  bibleVerses.push(title);

  let descriptionSplits = description.split('\n')

  if (descriptionSplits === undefined || descriptionSplits === null || descriptionSplits.length === 0)
    descriptionSplits = [description]

  bibleVerses = bibleVerses.concat(descriptionSplits);

  // extract specific verses from lines that include bible verses
  bibleVerses = bibleVerses.reduce(function (verses: Array<string>, verse: string) {
    const matches = verse.match(new RegExp(verseRegex.source, 'gi'))

    if (matches !== null) {
      for (const match of matches) {
        if (match !== undefined && match !== null && match[0] !== undefined) {
          verses.push(match)
        } else {
          console.log(`${verse} looks like it contains a verse but can't be parsed`)
        }
      }
    }

    return verses
  }, [])

  bibleVerses = [...new Set(bibleVerses)] // remove duplicate bible verses

  bibleVerses = bibleVerses.filter((verse) => {
    return Bible.stringVerseIsValid(verse)
  });

  return bibleVerses;
}
/**
 * Deprecated
 * **/
async function getSermonSummary(videoId: string, rawTitle: string, rawDescription: string, rawChannelName: string) {

  const title = rawTitle.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  const description = rawDescription.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
  const channelName = rawChannelName.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')

  console.info(`Finding sermon summary for: ${title} from channel: ${channelName}`)

  const titleDelimitersRegex = /[-–|•/():#]+/
  const quotedRegex = /(?:^|\s)['"”“](.+)['"”“](?:$|\s)/i
  const genericTitleRegex = /\b(church|online|worship|sermon|praise|live|livestream|bible study|service|episode|part|ep.|ep|week)\b/i
  const namePrefixRegex = /\b(bishop|rev|rev.|reverand|pastor|dr|dr.|fr|fr.|sister|brother)/i
  const churchNameRegex = new RegExp(
    '\\b(?:' + channelName + '|' + channelName.replace(/church/i, '').trim() + ')\\b',
    'i',
  )
  const dateRegex =
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec|christmas|xmas|easter|summer|\d+\s*am|\d+\s*pm)\b/i
  const bibleRegexString = Bible.buildBibleRegexString()
  const bibleRegex = new RegExp(bibleRegexString, 'i')
  const verseRegexComponent = /\s*(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?:\s*([a-zA-Z]+)\s*(\d+))?(?::(\d+))?)?/
  const verseRegex = new RegExp(bibleRegexString + verseRegexComponent.source, 'i')
  //const VERSE_REGEX = /((?:\d\s)?[A-Za-z]+(?:\s[A-Za-z]+)*)\s*(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?:\s*([a-zA-Z]+)\s*(\d+))?(?::(\d+))?)?/;
  const nameRegex = new RegExp("\\b(" + Names.join("|") + ")\\b", "i")
  const justNumbersRegex = /^\d+$/i

  let bibleVerses: Array<string> = []
  let titleSplits = title.split(titleDelimitersRegex)
  if (titleSplits === undefined || titleSplits === null || titleSplits.length === 0) titleSplits = [title]
  let sermonTitle = ''

  // check for any quoted sections (usually indicating titles) and seperate them
  titleSplits = titleSplits.reduce(function (titles: Array<string>, titleSplit: string) {
    const quotedMatch = titleSplit.match(quotedRegex)

    if (quotedMatch !== undefined && quotedMatch !== null && quotedMatch.length > 1) {
      //console.log(quotedMatch)
      //console.log(quotedMatch[1].trim())
      //console.log(titleSplit.replace(quotedMatch[1], '').trim())
      titles.push(quotedMatch[1].trim())
      titles.push(titleSplit.replace(quotedMatch[0], '').trim())
    } else {
      titles.push(titleSplit.trim())
    }

    return titles
  }, [])

  const filteredTitleSplits = titleSplits.filter((titleSegment) => {

    if (titleSegment === "") return false;

    /*console.log(titleSegment)
    
    console.log(titleSegment.match(genericTitleRegex))
    console.log(titleSegment.match(dateRegex))
    console.log(titleSegment.match(churchNameRegex))
    console.log(titleSegment.match(verseRegex))
    console.log(titleSegment.match(nameRegex))*/


    let check = (
      !genericTitleRegex.test(titleSegment) &&
      !dateRegex.test(titleSegment) &&
      !churchNameRegex.test(titleSegment) &&
      !verseRegex.test(titleSegment) &&
      !justNumbersRegex.test(titleSegment) &&
      !namePrefixRegex.test(titleSegment)
    )
    if (titleSegment.split(" ").length <= 3) check = check && !nameRegex.test(titleSegment)

    return check
  })

  //console.log(filteredTitleSplits)

  sermonTitle = filteredTitleSplits.join(" ");
  sermonTitle = sermonTitle.replace(/[^a-zA-Z0-9\'\"\s,&!?+]/gi, "")

  for (const titleSegment of titleSplits) {
    if ((bibleRegex.test(titleSegment))) bibleVerses.push(titleSegment)
  }

  sermonTitle = sermonTitle.trim()
  if (sermonTitle.length < 5) sermonTitle = "";

  if (sermonTitle !== "") console.info(`Found sermon title ${sermonTitle}`)

  const urlRegex = /(https|http|www)/i
  const genericRegex = /(church|SyncID|Musicbed|connect|podcast|location|located|service|livestream|join us|tune in|watch|like|subscribe)/i
  const hashTagRegex = /#/i
  const emailRegex = /@/i
  //const idRegex = /(?:\b\w+(\d)+\w*\b)/g
  const emojiRegex =
    /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/i
  const headingRegex = /(?:[A-Z]+\s)+[A-Z]+/
  const timestampRegex = /\d\d?:\d\d?(?::\d\d?)?/

  let descriptionSplits = description.split('\n')

  if (descriptionSplits === undefined || descriptionSplits === null || descriptionSplits.length === 0)
    descriptionSplits = [description]

  let filteredDescription = ''
  let scan = true
  let found = false

  for (const descriptionSegment of descriptionSplits) {
    if (
      scan &&
      !(
        urlRegex.test(descriptionSegment) ||
        genericRegex.test(descriptionSegment) ||
        hashTagRegex.test(descriptionSegment) ||
        emailRegex.test(descriptionSegment) ||
        emojiRegex.test(descriptionSegment) ||
        churchNameRegex.test(descriptionSegment) ||
        headingRegex.test(descriptionSegment) ||
        timestampRegex.test(descriptionSegment)
      )
    ) {
      filteredDescription += ' ' + descriptionSegment
      found = true
    } else {
      if (found) scan = false
    }
    if (bibleRegex.test(descriptionSegment)) {
      bibleVerses.push(descriptionSegment)
    }
  }

  filteredDescription = filteredDescription.trim()

  if (filteredDescription !== "") console.info(`Found sermon description ${filteredDescription}`)

  // extract specific verses from lines that include bible verses
  bibleVerses = bibleVerses.reduce(function (verses: Array<string>, verse: string) {
    const matches = verse.match(new RegExp(verseRegex.source, 'gi'))

    if (matches !== null) {
      for (const match of matches) {
        if (match !== undefined && match !== null && match[0] !== undefined) {
          verses.push(match)
        } else {
          console.log(`${verse} looks like it contains a verse but can't be parsed`)
        }
      }
    }

    return verses
  }, [])

  bibleVerses = [...new Set(bibleVerses)] // remove duplicate bible verses

  if (sermonTitle === '') console.log(`No Sermon title for ${title}`)
  if (filteredDescription === '' || bibleVerses.length < 1) {
    const captions = await getSubtitles(videoId)
    const sermon = filterYouTubeSubtitlesToSermon(captions)

    if (filteredDescription === '' && sermon) {

      //console.info(`Finding target sermon segment to use for summary generator`)
      const targetSermonSegment = findTargetSermonSegment(sermon)
      console.log(`No Sermon description for ${title} from title or description, generating title from subtitles`)
      filteredDescription = await OpenAI.getSermonSummaryFromSubtitles(targetSermonSegment)
    }

    if (bibleVerses.length < 1) {
      console.log(`No verses for ${title} from title or description, checking subtitles`)
      bibleVerses = findVersesInSubtitles(captions)
    }
  }

  return {
    title: sermonTitle,
    summary: filteredDescription,
    verses: bibleVerses,
  }
}

/**
 * When generating a sermon summary from subtitles using Open AI/gpt3 we are limited to the number words (about 1000) we can use.
 * 
 * We tend to find most sermons provide a good summary where most of the scripture is referenced, so we use this as a heuristic to choose the best slice.
 * **/
function findTargetSermonSegment(transcript: string) {

  const split = transcript.split(' ');
  const targetTranscriptLength = 1000;

  if (split.length <= targetTranscriptLength) return transcript;

  const targetWords = [/chapter/, /verse/, /passage/, /scripture/];

  let sermonSegmentArray: Array<string> = [];
  let startIndex = 0;
  let found = false;

  // try to find target semgment first with the first target word, etc
  for (const targetWord of targetWords) {

    const targetWordIndexes: Array<number> = [];
    const targetWordDistances: Array<number> = [];


    for (const [i, word] of split.entries()) {
      if (targetWord.test(word)) {
        //console.log("found " + word)
        targetWordIndexes.push(i);
        if (targetWordIndexes.length > 1) targetWordDistances.push(targetWordIndexes.slice(-1)[0] - targetWordIndexes.slice(-2)[0])
      }
    }

    //console.log("indexes: " + targetWordIndexes + " distances: " + targetWordDistances)

    let maxStartIndex = 0;

    let maxFrequency = 0;
    let maxDistanceLength = 0;

    // only found the target word once or twice, return the segment centered around the first instance
    if (targetWordIndexes.length === 1 || targetWordIndexes.length === 2) {

      maxStartIndex = 0;
      maxFrequency = 1;
      maxDistanceLength = 0;

      // find the combination of target words in the smallest distance
    } else if (targetWordIndexes.length > 2) {

      for (let i = 0; i < targetWordDistances.length; i++) {

        let distanceLength = 0;
        let frequency = 0;

        for (const distance of targetWordDistances.slice(i)) {
          if ((distanceLength + distance) < targetTranscriptLength) {
            distanceLength += distance;
            frequency++;
          } else {
            break;
          }
        }

        if (frequency > maxFrequency) {
          maxFrequency = frequency
          maxStartIndex = i;
          maxDistanceLength = distanceLength;
        }
      }
    }

    if (targetWordIndexes.length > 0) {

      found = true;

      //console.log("found " + maxFrequency + " indexes at distance:" + maxDistanceLength)
      //console.log("start index " + maxStartIndex + " end index:" + maxEndIndex)

      const startTweak = Math.floor((targetTranscriptLength - maxDistanceLength) / 2)
      startIndex = Math.max(targetWordIndexes[maxStartIndex] - startTweak, 0)
      const endIndex = startIndex + targetTranscriptLength;

      if (endIndex > split.length) {
        const difference = endIndex - split.length;
        startIndex = startIndex - difference;
      }

      //console.log(startIndex + " " + endIndex)

      sermonSegmentArray = split.slice(startIndex, endIndex)

      if (sermonSegmentArray.length >= targetTranscriptLength) break;
    }
  }

  if (found) {
    console.log("Found ideal sermon segment starting at: " + startIndex + " at length: " + sermonSegmentArray.length)

  } else {
    console.log("Could not find any target words in sermon, returning middle segment")

    startIndex = Math.floor((split.length / 2) - (targetTranscriptLength / 2))
    startIndex = Math.max(startIndex, 0)
    const endIndex = startIndex + targetTranscriptLength;
    sermonSegmentArray = split.slice(startIndex, endIndex)
  }
  return sermonSegmentArray.join(" ");
}


/**
 * When whole services are uploaded, we need to trim the non-sermon segments.
 * 
 * This attempts to find the largest segment of speaking without the YouTube subtitle token of [Music] or [Applause].
 * **/
function filterYouTubeSubtitlesToSermon(captions: string) {

  if (!captions) return undefined;
  console.log("Finding sermon segment from YouTube subtitles")

  const minSermonSize = 5000

  const captionsSplit = captions.split(' ')

  const segmentRegex = /(\[Music\]|\[Applause\])/

  let filteredCaptions: Array<string> = []
  const captionBlocks: Array<Array<string>> = [];
  let largestCaptionsIndex = 0;

  for (const caption of captionsSplit) {
    if (segmentRegex.test(caption)) {
      captionBlocks.push(filteredCaptions)
      //console.log("detected applause or music length " + filteredCaptions.length)
      if (filteredCaptions.length >= (captionBlocks[largestCaptionsIndex]?.length) || 0) largestCaptionsIndex = captionBlocks.length - 1
      filteredCaptions = []
    } else {
      filteredCaptions.push(caption)
    }
  }

  // push the last caption block
  captionBlocks.push(filteredCaptions)
  if (filteredCaptions.length >= (captionBlocks[largestCaptionsIndex]?.length) || 0) largestCaptionsIndex = captionBlocks.length - 1

  let largestCaptions: Array<string> = [];
  //console.log(largestCaptionsIndex);
  //console.log(captionBlocks.map((array) => array.length));
  [largestCaptions] = captionBlocks.splice(largestCaptionsIndex, 1)
  largestCaptions = largestCaptions || []
  largestCaptionsIndex--;

  while (largestCaptions.length < minSermonSize && captionBlocks.length > 0) {
    let [nextCaptionBlock] = captionBlocks.splice(largestCaptionsIndex, 1)
    nextCaptionBlock = nextCaptionBlock || []
    largestCaptions.concat(nextCaptionBlock)
    largestCaptionsIndex--;
  }

  if (largestCaptions.length < minSermonSize) {
    if (captionsSplit.length <= minSermonSize) return captions
    return captionsSplit.slice(-minSermonSize).join(" ")
  }

  return largestCaptions.join(" ")
}

/**
 * Searches for bible verses in YouTube subtitles, and builds a tree to avoid duplication.
 * 
 * This supports various formats of bible verses as all can be found in subtitles.
 * **/
function findVersesInSubtitles(captions: string) {

  if (!captions || captions === "") return [];

  const bibleRegexString = Bible.buildBibleRegexString()

  const bibleBookRegex = new RegExp(bibleRegexString, 'ig')
  const verbalBibleRegex = /(book|bible|chapter|verse|passage)/i

  const bookChapterRegex = / (?:chapter )(\d+)/i
  const bookChapterVerseRegex = / (?:chapter )?(\d+) (?:verse )?(\d+)/i

  const formattedVerseRegexComponent = /\s*(\d+)(?::(\d+))(?:\s*-\s*(\d+)(?:\s*([a-zA-Z]+)\s*(\d+))?(?::(\d+))?)?/
  const formattedVerseString = bibleRegexString + formattedVerseRegexComponent.source
  const formattedVerseRegex = new RegExp(formattedVerseString, 'ig')

  let verses: any = {}

  const results: Array<string> = []

  const split = captions.split(' ')

  for (const [i, text] of split.entries()) {
    if (text.match(verbalBibleRegex) || text.match(bibleBookRegex)) {
      const min = Math.max(i - 20, 0)
      results.push(split.slice(min, i + 20).join(' '))
    }
  }

  for (const result of results) {
    //console.log(result)

    const resultVerses: Array<string> = []

    let found = false

    // search for properly formatted verses
    if (!found) {
      const matches = result.matchAll(formattedVerseRegex)
      for (const match of matches) {
        resultVerses.push(match[0])
        const book = matchBook(match[1])
        const chapter = match[2]
        const verseFrom = match[3]
        const verseTo = match[4]
        verses = addVerseToVerseTree(verses, book, chapter, verseFrom, verseTo)
        found = true
      }
    }


    // search for spoken passages with passages
    if (!found) {
      const matches = result.matchAll(new RegExp(bibleRegexString + bookChapterVerseRegex.source, 'ig'))
      for (const match of matches) {
        const verse = formatVerse(match[1], parseInt(match[2]), parseInt(match[3]))
        //console.log(verse)
        resultVerses.push(verse)
        const book = matchBook(match[1])
        const chapter = match[2]
        const verseFrom = match[3]
        verses = addVerseToVerseTree(verses, book, chapter, verseFrom)
        found = true
      }
    }

    // search for spoken passages with just chapters
    if (!found) {
      const matches = result.matchAll(new RegExp(bibleRegexString + bookChapterRegex.source, 'ig'))
      for (const match of matches) {
        const verse = formatVerse(match[1], parseInt(match[2]))
        resultVerses.push(verse)
        const book = matchBook(match[1])
        const chapter = match[2]

        verses = addVerseToVerseTree(verses, book, chapter)
        found = true
      }
    }

    //if (resultVerses.length > 0) console.log(resultVerses)
  }

  let versesArray = getVersesFromVerseTree(verses)

  versesArray = versesArray.filter((verse) => {
    return Bible.stringVerseIsValid(verse)
  });

  console.log(`Found ${versesArray.length} verses from subtitles`)

  return versesArray
}

/**
 * Download the actual subtitle file
 * **/
async function downloadYouTubeSubtitles(subtitleUrl: string) {
  const { data: transcript } = await axios.get(subtitleUrl);
  const lines: Array<any> = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter((line: string) => line && line.trim())
    .map((line: string) => {
      const startRegex = /start="([\d.]+)"/;
      const durRegex = /dur="([\d.]+)"/;

      const [, start] = startRegex.exec(line) || "";
      const [, dur] = durRegex.exec(line) || "";

      const htmlText = line
        .replace(/<text.+>/, '')
        .replace(/&amp;/gi, '&')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/\n/g, '')

      const decodedText = he.decode(htmlText);
      const text = striptags(decodedText);

      return {
        start,
        dur,
        text,
      };
    });

  return lines.reduce((joined, single) => { return joined + `${single.text} ` });
}

/**
 * Get the subtitle file url from the video metadata
 * **/
async function getSubtitles(videoId: string, timestamp: boolean = false) {

  const lang = 'en';
  const { data } = await axios.get(
    `https://youtube.com/watch?v=${videoId}`
  );

  const regex = /({"captionTracks":.*isTranslatable":(true|false)}])/;
  const [match] = regex.exec(data) || [];

  if (!match || match.length === 0) throw new Error(`Could not find captions for video: ${videoId}`);

  const { captionTracks } = JSON.parse(`${match}}`);

  const subtitle =
    find(captionTracks, {
      vssId: `.${lang}`,
    }) ||
    find(captionTracks, {
      vssId: `a.${lang}`,
    }) ||
    find(captionTracks, ({ vssId }: { vssId: any }) => vssId && vssId.match(`.${lang}`));

  // * ensure we have found the correct subtitle lang
  if (!subtitle || (subtitle && !subtitle.baseUrl))
    throw new Error(`Could not find ${lang} captions for ${videoId}`);

  const { data: transcript } = await axios.get(subtitle.baseUrl);
  const lines: Array<any> = transcript
    .replace('<?xml version="1.0" encoding="utf-8" ?><transcript>', '')
    .replace('</transcript>', '')
    .split('</text>')
    .filter((line: string) => line && line.trim())
    .map((line: string) => {
      const startRegex = /start="([\d.]+)"/;
      const durRegex = /dur="([\d.]+)"/;

      const [, start] = startRegex.exec(line) || "";
      const [, dur] = durRegex.exec(line) || "";

      const htmlText = line
        .replace(/<text.+>/, '')
        .replace(/&amp;/gi, '&')
        .replace(/<\/?[^>]+(>|$)/g, '')
        .replace(/\n/g, '')

      const decodedText = he.decode(htmlText);
      const text = striptags(decodedText);

      return {
        start,
        dur,
        text,
      };
    });
  if (timestamp) return lines.reduce((joined, single) => { return joined + `${single.start}: ${single.text} \n` });

  return lines.reduce((joined, single) => { return joined + `${single.text} ` });
}

function addVerseToVerseTree(tree: any, book: string, chapter: string, verseFrom?: string, verseTo?: string) {
  const verse = verseTo ? `${verseFrom}-${verseTo}` : verseFrom

  if (tree.hasOwnProperty(book)) {
    if (tree[book].hasOwnProperty(chapter)) {
      if (verse) tree[book][chapter].push(verse)
    } else {
      tree[book][chapter] = verse ? [verse] : []
    }
  } else {
    tree[book] = {} as any
    tree[book][chapter] = verse ? [verse] : []
  }

  return tree
}

function getVersesFromVerseTree(tree: any) {
  const verses: Array<string> = []

  for (const book of Object.keys(tree)) {
    for (const chapter of Object.keys(tree[book])) {
      let maxVerse = ''
      for (const verse of tree[book][chapter] as Array<string>) {
        if (verse.length > maxVerse.length) maxVerse = verse
      }

      const fullVerse = maxVerse ? `${book} ${chapter}:${maxVerse}` : `${book} ${chapter}`

      verses.push(fullVerse)
    }
  }

  return verses
}

function matchBook(book: string) {
  const bookLower = book.toLowerCase()

  let formattedBook = ''

  for (const key of Object.keys(Bible.Books)) {
    if (
      bookLower === Bible.Books[key].name.toLowerCase() ||
      bookLower === Bible.Books[key].abbr.toLowerCase() ||
      bookLower === Bible.Books[key].abbr2?.toLowerCase() ||
      bookLower === Bible.Books[key].altName?.toLowerCase()
    ) {
      formattedBook = Bible.Books[key].name
    }
  }

  return formattedBook
}

function formatVerse(book: string, chapter: number, verseFrom?: number, verseTo?: number) {
  const formattedBook = matchBook(book)

  if (verseFrom && verseTo) return `${formattedBook} ${chapter}:${verseFrom}-${verseTo}`
  if (verseFrom) return `${formattedBook} ${chapter}:${verseFrom}`
  return `${formattedBook} ${chapter}`
}

export default {
  validateYouTubeUrl,
  getYouTubeInfo,
  findBestFormat,
  validateVideoAndChannel,
  getSermonSummary,
  getSermonTitle,
  getSermonSummaryFromSermonSubtitles,
  getSermonSummaryFromVideoDescription,
  getBibleVersesFromVideoDetails,
  downloadYouTubeSubtitles,
  filterYouTubeSubtitlesToSermon,
  findVersesInSubtitles,
  getYouTubeDirectVideoUrl
}
