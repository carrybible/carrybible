import React from 'react'

import { GroupActionsType } from '@dts/GroupActions'
import { Activity, PassageAct } from '@dts/Plans'
import {
  differenceInMonths,
  format,
  formatDistanceToNowStrict,
  isToday,
  isYesterday,
  parseISO,
} from 'date-fns'
import { serverTimestamp, Timestamp } from 'firebase/firestore'
import Resizer from 'react-image-file-resizer'
import { message, Button } from 'antd'
import { Text } from '@components/Typography'
import Firebase from '@shared/Firebase/index'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import moment from 'moment'
import { useTranslation } from 'next-i18next'
import { Campaign } from '@dts/Campaign'

export const wait = async (timeout: number) => {
  await new Promise((resolve) => setTimeout(resolve, timeout))
}

export const formatNumberThousand = (num: number, digits: number): string => {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ]
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value
    })
  return item
    ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
    : '0'
}

export const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    )
}

export const fileToBase64 = (file: File) =>
  new Promise((resolve: any, reject: any) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })

export const resizeImage = (file: File, maxWidth: number, maxHeight: number) =>
  new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      maxWidth,
      maxHeight,
      'JPEG',
      100,
      0,
      (uri) => {
        resolve(uri)
      },
      'base64'
    )
  })

export const formatDateStringFromNow = (date: string): string => {
  let s = format(parseISO(date), 'dd MMM yyyy')
  const monthsDifference = differenceInMonths(parseISO(date), new Date())
  if (isToday(parseISO(date))) {
    s = 'Today'
  } else if (isYesterday(parseISO(date))) {
    s = 'Yesterday'
  } else if (Math.abs(monthsDifference) < 7) {
    s = formatDistanceToNowStrict(parseISO(date), {
      addSuffix: true,
    }).replace('about', '')
  }
  return s
}

// export const formatDateStringFromNow_Format_2 = (date: string): string => {
//   let s = format(parseISO(date), 'dd MMM yyyy')
//   const monthsDifference = differenceInMonths(parseISO(date), new Date())
//   if (isToday(parseISO(date))) {
//     s = 'Today'
//   } else if (isYesterday(parseISO(date))) {
//     s = 'Yesterday'
//   } else if (Math.abs(monthsDifference) < 3) {
//     s = parseISO(date)?.toLocaleDateString('en-US', { dateStyle: 'long' })
//   }
//   return s
// }

export const getActTypeIcon = (
  actType: Activity['type'],
  subActType?: GroupActionsType
): string => {
  const ActTypeIconMapping: Record<
    Exclude<Activity['type'], 'action'>,
    string
  > = {
    passage: '📖',
    question: '💬',
    text: '📝',
    video: '🎥',
  }

  if (actType === 'action') {
    return subActType === 'prayer' ? '🙏' : '🎉'
  }
  return ActTypeIconMapping[actType]
}

export const getActTypeText = (
  actType: Activity['type'],
  subActType?: GroupActionsType
): string => {
  const ActTypeIconMapping: Record<
    Exclude<Activity['type'], 'action'>,
    string
  > = {
    passage: 'plans.act-title.passage',
    question: 'plans.act-title.question',
    text: 'plans.act-title.text',
    video: 'plans.act-title.video',
  }

  if (actType === 'action') {
    return subActType === 'prayer'
      ? 'plans.act-title.action-prayer'
      : 'plans.act-title.action-gratitude'
  }
  return ActTypeIconMapping[actType]
}

export const toPassageString = (act: PassageAct) => {
  return `${act.chapter.bookName} ${act.chapter.chapterNumber}:${act.verseRange}`
}

export const getActTypeDescription = (act: Activity): string => {
  switch (act.type) {
    case 'passage': {
      return toPassageString(act)
    }
    case 'question': {
      return `${act.question}`
    }
    case 'action': {
      return `${act.text}`
    }
    case 'text': {
      return `${act.title}`
    }
    case 'video': {
      return `${act.title}`
    }
    default: {
      return ''
    }
  }
}

export const getYoutubeVideoId = (url: string): string | null => {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  const match = url.match(regExp)
  return match && match[7].length === 11 ? match[7] : null
}

export const getServerTimestamp = () => {
  return serverTimestamp() as Timestamp
}

export const asyncConfirmMessage = (title: string) => {
  return new Promise((resolve) => {
    message.warning({
      key: 'asyncConfirmMessage',
      duration: 300,
      onClose: () => resolve(false),
      content: (
        <div>
          <div className="my-4">
            <Text strong>{title}</Text>
          </div>
          <div className="row mt-4 flex justify-between">
            <Button
              onClick={() => {
                message.destroy('asyncConfirmMessage')
                resolve(true)
              }}
              className="mx-2"
            >
              Confirm
            </Button>
            <Button
              className="mx-2"
              onClick={() => {
                message.destroy('asyncConfirmMessage')
                resolve(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ),
    })
  })
}

export const formatInviteCode = (code: string) => {
  const pureCode = code || ''
  if (pureCode.length === 6)
    return pureCode.substring(0, 3) + '-' + pureCode.substring(3)
  return pureCode
}

function getExtension(filename: string) {
  const parts = filename.split('.')
  return parts[parts.length - 1]
}

function isVideo(filename: string) {
  var ext = getExtension(filename)
  switch (ext.toLowerCase()) {
    case 'm4v':
    case 'avi':
    case 'mpg':
    case 'mp4':
    case 'mov':
      return true
  }
  return false
}

export const validVideo = async (file: any) => {
  if (file && isVideo(file.name)) {
    return true
  }
  return false
}

export const uploadVideo = async (file: any) => {
  if (file && (await validVideo(file))) {
    const storageRef = ref(
      Firebase.storage,
      `/videos/v${new Date().getTime()}_${file.name}`
    )
    const uploadTask = uploadBytesResumable(storageRef, file)
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        )
        console.log('Percent: ', percent)
      },
      (err) => console.log(err)
    )

    const fileUploaded = await uploadTask
    const downloadUrl = await getDownloadURL(fileUploaded.ref)

    return downloadUrl
  }
}

export const usePlanDateStatus = () => {
  const { t } = useTranslation()

  const getDateStatus = (
    startDate: Date,
    duration: number,
    status: 'ended' | 'normal' | 'future',
    updated?: Date
  ) => {
    const start = moment(startDate).startOf('day')
    const end = moment(startDate).startOf('day').add(duration, 'days')
    const today = moment().startOf('day')

    const diffStart = today.diff(start, 'day')
    const diffEnd = today.diff(end, 'day')

    const compareStart = new Date().getTime() - startDate.getTime()
    const compareEnd =
      new Date().getTime() -
      (duration * 24 * 60 * 60 * 1000 + startDate.getTime())

    const isAfterStart = compareStart >= 0
    const isAfterEnd = compareEnd >= 0

    if (status === 'ended' && updated) {
      const update = moment(updated).startOf('day')
      const diffUpdate = today.diff(update, 'day')

      if (diffUpdate === 0) {
        return t('plan.ended-today')
      }
      if (diffUpdate === -1) {
        return t('plan.ended-yesterday')
      }
      return t('plan.ended-days-ago', { day: Math.abs(diffUpdate) })
    }

    if (isAfterEnd) {
      if (diffEnd === 0) {
        return t('plan.ended-today')
      }
      if (diffEnd === -1) {
        return t('plan.ended-yesterday')
      }
      return t('plan.ended-days-ago', { day: Math.abs(diffEnd) })
    }

    if (!isAfterStart) {
      if (diffStart === 0) {
        return t('plan.starting-today')
      }
      if (diffStart === -1) {
        return t('plan.starting in tomorrow')
      }
      return t('plan.starting-in', { day: Math.abs(diffStart) })
    }

    if (diffEnd === 0) {
      return t('plan.ending-today')
    }
    if (diffEnd === -1) {
      return t('plan.ending-tomorrow')
    }
    return t('plan.ending-in', { day: Math.abs(diffEnd) })
  }

  return getDateStatus
}

export const getDateDiff: (
  date?: Date,
  custom?: { hours: number; minutes: number; seconds: number; ms: number }
) => {
  time: string
  amount: number
} = (date, custom) => {
  if (!date) return { time: '', amount: 0 }
  let time = 'days'
  const handleDate = date
  if (custom) {
    handleDate.setHours(custom.hours, custom.minutes, custom.seconds, custom.ms)
  }
  let amount = moment(handleDate).diff(moment.now(), 'days')
  if (amount === 0) {
    time = 'hours'
    amount = moment(handleDate).diff(moment.now(), 'hours')
  }
  if (amount === 0) {
    time = 'minutes'
    amount = moment(handleDate).diff(moment.now(), 'minutes')
  }
  if (amount === 0) {
    time = 'seconds'
    amount = moment(handleDate).diff(moment.now(), 'seconds')
  }
  return {
    time,
    amount,
  }
}

export const getCampaignDateStatus = (item: Campaign, t: any) => {
  if (item.startDate) {
    const start = getDateDiff(
      typeof item.startDate === 'string'
        ? new Date(item.startDate)
        : item.startDate,
      { hours: 0, minutes: 0, seconds: 0, ms: 0 }
    )
    const end = getDateDiff(
      typeof item.endDate === 'string' ? new Date(item.endDate) : item.endDate,
      { hours: 23, minutes: 59, seconds: 59, ms: 0 }
    )

    if (start.amount > 0) {
      if (start.amount === 1) {
        return t('giving.campaign-starts-tomorrow')
      }
      return t('giving.campaign-starts-in', start)
    }
    if (end.amount > 0) {
      if (end.amount === 1) {
        return t('giving.campaign-end-tomorrow')
      }
      return t('giving.campaign-end-in', end)
    }
    if (end.amount === 0) {
      return t('giving.campaign-end-in', end)
    }
    if (end.amount < 0) {
      if ((item.totalFunds || 0) >= (item.goalAmount || 0)) return ''
      return t('giving.campaign-ended')
    }
  } else {
    return t('giving.campaign-draft')
  }
}

export const toCurrency = function (value: number, fixed: number = 0) {
  return value.toFixed(fixed).replace(/(\d)(?=(\d{3})+\b)/g, '$1,')
}
