import auth from '@react-native-firebase/auth'
import axios from 'axios'
import { getUniqueId } from 'react-native-device-info'
import Config from './Config'

const BibleApiInstance = axios.create({
  baseURL: Config.BIBLE_API.SERVER,
  headers: {
    'api-key': Config.BIBLE_API.KEY,
  },
})

const FumsApiInstance = axios.create({
  baseURL: Config.BIBLE_API.FUMS_SERVER,
})

export type BibleBookType = {
  id: string
  bibleId: string
  abbreviation: string
  name: string
  nameLong: string
  chapters: {
    id: string
    bibleId: string
    bookId: string
    number: string
    position: number
  }[]
}

const getBibles = async (iso3: string): Promise<any> => {
  try {
    const bibles = await BibleApiInstance.get('v1/bibles', {
      headers: {
        ['include-full-details']: 'false',
      },
      params: {
        language: iso3,
      },
    })
    return bibles.data
  } catch (error) {
    devWarn('getBibles error', error)
  }
}

const getBible = async (id: string) => {
  try {
    const bible = await BibleApiInstance.get(`/v1/bibles/${id}`)
    return bible.data
  } catch (error) {
    devWarn('getBibles error', error)
  }
}

const getBooks = async (id: string) => {
  try {
    const bible = await BibleApiInstance.get(`/v1/bibles/${id}/books`, {
      params: {
        ['include-chapters']: 'true',
      },
    })
    // @ts-ignore
    return bible.data?.data as BibleBookType[]
  } catch (error) {
    devWarn('getBibles error', error)
  }
}

const getVerses = async (bibleId: string, chapterId: string) => {
  try {
    const verse = await BibleApiInstance.get(`/v1/bibles/${bibleId}/chapters/${chapterId}/verses`)
    // @ts-ignore
    return verse.data?.data as {
      id: 'string'
      orgId: 'string'
      bibleId: 'string'
      bookId: 'string'
      chapterId: 'string'
      reference: 'string'
    }[]
  } catch (error) {
    devLog('getVerses error', error)
  }
}

const getVerseDetail = async (bibleId: string, verseId: string) => {
  try {
    const verse = await BibleApiInstance.get(`/v1/bibles/${bibleId}/verses/${verseId}`, {
      params: {
        ['content-type']: 'html',
        ['include-notes']: 'false',
        ['include-titles']: 'true',
        ['include-chapter-numbers']: 'true',
        ['include-verse-numbers']: 'true',
        ['include-verse-spans']: 'true',
      },
    })
    return verse.data
  } catch (error) {
    devLog('getVerseDetail error', error)
  }
}

const getPassages = async (bibleId: string, passageId: string) => {
  try {
    const passages = await BibleApiInstance.get(`/v1/bibles/${bibleId}/passages/${passageId}`, {
      params: {
        ['content-type']: 'html',
        ['include-notes']: 'false',
        ['include-titles']: 'true',
        ['include-chapter-numbers']: 'false',
        ['include-verse-numbers']: 'true',
        ['include-verse-spans']: 'true',
        ['fums-version']: 3,
      },
    })
    // @ts-ignore
    if (passages.data?.meta?.fumsToken) {
      // @ts-ignore
      await reportUfms(passages.data?.meta?.fumsToken)
    }
    return passages.data
  } catch (error: any) {
    // toast.error(I18n.t('text.Could not find that passage'))
    devWarn('getPassages error', error?.data)
  }
  return false
}

const search = async (bibleId: string, query: string) => {
  try {
    const passages = await BibleApiInstance.get(`/v1/bibles/${bibleId}/search`, {
      params: {
        ['content-type']: 'text',
        ['include-notes']: 'false',
        ['include-titles']: 'true',
        ['include-chapter-numbers']: 'false',
        ['include-verse-numbers']: 'true',
        ['include-verse-spans']: 'false',
        query,
      },
    })
    return passages.data
  } catch (error) {
    devWarn('getPassages error', error)
  }
}

const reportUfms = async t => {
  try {
    const user = auth().currentUser
    const deviceId = await getUniqueId()
    const params = {
      t: t,
      dId: deviceId,
      sId: global.session,
      uId: user?.uid,
    }
    await FumsApiInstance.get('/f3', {
      params,
    })
  } catch (error) {
    devWarn('reportUfms error', error)
  }
}

export default {
  getBibles,
  getVerseDetail,
  getPassages,
  getBible,
  getBooks,
  getVerses,
  search,
}
