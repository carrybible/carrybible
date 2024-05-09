import _ from 'lodash'
import formatOsis from './BibleReferenceFormatter/en'
import 'bible-passage-reference-parser/js/en_bcv_parser'
import Database from './Database'
import { removeMarker } from './Usfm/filter'
import I18n from 'i18n-js'

let instance: BibleFormatter

// @ts-ignore
const bcv = new bcv_parser()
bcv.set_options({ book_alone_strategy: 'full' })

const books = [
  { id: 1, title: 'Genesis', abbr: 'GEN' },
  { id: 2, title: 'Exodus', abbr: 'EXO' },
  { id: 3, title: 'Leviticus', abbr: 'LEV' },
  { id: 4, title: 'Numbers', abbr: 'NUM' },
  { id: 5, title: 'Deuteronomy', abbr: 'DEU' },
  { id: 6, title: 'Joshua', abbr: 'JOS' },
  { id: 7, title: 'Judges', abbr: 'JDG' },
  { id: 8, title: 'Ruth', abbr: 'RUT' },
  { id: 9, title: '1 Samuel', abbr: '1SA' },
  { id: 10, title: '2 Samuel', abbr: '2SA' },
  { id: 11, title: '1 Kings', abbr: '1KI' },
  { id: 12, title: '2 Kings', abbr: '2KI' },
  { id: 13, title: '1 Chronicles', abbr: '1CH' },
  { id: 14, title: '2 Chronicles', abbr: '2CH' },
  { id: 15, title: 'Ezra', abbr: 'EZR' },
  { id: 16, title: 'Nehemiah', abbr: 'NEH' },
  { id: 17, title: 'Esther', abbr: 'EST' },
  { id: 18, title: 'Job', abbr: 'JOB' },
  { id: 19, title: 'Psalms', abbr: 'PSA' },
  { id: 20, title: 'Proverbs', abbr: 'PRO' },
  { id: 21, title: 'Ecclesiastes', abbr: 'ECC' },
  { id: 22, title: 'Song of Solomon', abbr: 'SNG' },
  { id: 23, title: 'Isaiah', abbr: 'ISA' },
  { id: 24, title: 'Jeremiah', abbr: 'JER' },
  { id: 25, title: 'Lamentations', abbr: 'LAM' },
  { id: 26, title: 'Ezekiel', abbr: 'EZK' },
  { id: 27, title: 'Daniel', abbr: 'DAN' },
  { id: 28, title: 'Hosea', abbr: 'HOS' },
  { id: 29, title: 'Joel', abbr: 'JOL' },
  { id: 30, title: 'Amos', abbr: 'AMO' },
  { id: 31, title: 'Obadiah', abbr: 'OBA' },
  { id: 32, title: 'Jonah', abbr: 'JON' },
  { id: 33, title: 'Micah', abbr: 'MIC' },
  { id: 34, title: 'Nahum', abbr: 'NAM' },
  { id: 35, title: 'Habakkuk', abbr: 'HAB' },
  { id: 36, title: 'Zephaniah', abbr: 'ZEP' },
  { id: 37, title: 'Haggai', abbr: 'HAG' },
  { id: 38, title: 'Zechariah', abbr: 'ZEC' },
  { id: 39, title: 'Malachi', abbr: 'MAL' },
  { id: 40, title: 'Matthew', abbr: 'MAT' },
  { id: 41, title: 'Mark', abbr: 'MRK' },
  { id: 42, title: 'Luke', abbr: 'LUK' },
  { id: 43, title: 'John', abbr: 'JHN' },
  { id: 44, title: 'Acts', abbr: 'ACT' },
  { id: 45, title: 'Romans', abbr: 'ROM' },
  { id: 46, title: '1 Corinthians', abbr: '1CO' },
  { id: 47, title: '2 Corinthians', abbr: '2CO' },
  { id: 48, title: 'Galatians', abbr: 'GAL' },
  { id: 49, title: 'Ephesians', abbr: 'EPH' },
  { id: 50, title: 'Philippians', abbr: 'PHP' },
  { id: 51, title: 'Colossians', abbr: 'COL' },
  { id: 52, title: '1 Thessalonians', abbr: '1TH' },
  { id: 53, title: '2 Thessalonians', abbr: '2TH' },
  { id: 54, title: '1 Timothy', abbr: '1TI' },
  { id: 55, title: '2 Timothy', abbr: '2TI' },
  { id: 56, title: 'Titus', abbr: 'TIT' },
  { id: 57, title: 'Philemon', abbr: 'PHM' },
  { id: 58, title: 'Hebrews', abbr: 'HEB' },
  { id: 59, title: 'James', abbr: 'JAS' },
  { id: 60, title: '1 Peter', abbr: '1PE' },
  { id: 61, title: '2 Peter', abbr: '2PE' },
  { id: 62, title: '1 John', abbr: '1JN' },
  { id: 63, title: '2 John', abbr: '2JN' },
  { id: 64, title: '3 John', abbr: '3JN' },
  { id: 65, title: 'Jude', abbr: 'JUD' },
  { id: 66, title: 'Revelation', abbr: 'REV' },
]

const pad = (num, size) => {
  let s = String(num)
  while (s.length < (size || 2)) {
    s = '0' + s
  }
  return s
}

const rootIdToOsis = (rootId: string | number, format: 'short' | 'full') => {
  const root = rootId.toString()
  const strLen = root.length
  const verse = parseInt(root.slice(-3))
  const chapter = parseInt(root.slice(strLen - 6, strLen - 3))
  const bookId = parseInt(root.slice(0, strLen - 6))
  const book = books.find(b => b.id === bookId)
  return `${format === 'short' ? book?.abbr : book?.title} ${chapter}${verse > 0 ? ':' + verse : ''}`
}

class BibleFormatter {
  static get shared() {
    if (instance) return instance

    return new BibleFormatter()
  }

  constructor() {
    if (!instance) {
      instance = this
    }
    return instance
  }

  public getRootID(bookId: number, chapterId: number, verseId: number) {
    return parseInt(pad(bookId, 3) + pad(chapterId, 3) + pad(verseId, 3))
  }

  public toObject(rootId: string) {
    const root = rootId.toString()
    const strLen = root.length
    const verse = parseInt(root.slice(-3))
    const chapter = parseInt(root.slice(strLen - 6, strLen - 3))
    const bookId = parseInt(root.slice(0, strLen - 6))
    return { book: bookId, chapter, verse }
  }

  public toOsis(rootId: string | number | Array<string | number>, format: 'short' | 'full' = 'short') {
    if (!rootId) return ''

    if (Array.isArray(rootId)) {
      const osisArray = rootId.map(r => {
        return rootIdToOsis(r, format)
      })
      if (format === 'short') return _.toUpper(formatOsis('short', bcv.parse(osisArray.join(',')).osis()))
      return formatOsis('long', bcv.parse(osisArray.join(',')).osis())
    }

    return rootIdToOsis(rootId.toString(), format)
  }

  public toNewBibleOsis(osisArray: Array<string> | string, format: 'short' | 'full' = 'short') {
    if (!osisArray) return ''

    if (Array.isArray(osisArray)) {
      if (format === 'short') return _.toUpper(formatOsis('short', bcv.parse(osisArray.join(',')).osis()))
      return formatOsis('long', bcv.parse(osisArray.join(',')).osis())
    }

    return rootIdToOsis(osisArray.toString(), format)
  }

  public rootIdToBookName = (start: string | number, end: string | number, autoTranslation = false, onlyTitle?: boolean) => {
    if (!start || !end) return ''

    const root = start.toString()
    const bookId = parseInt(root.slice(0, root.length - 6))
    const book = books.find(b => b.id === bookId)

    const rootEnd = end.toString()
    const chapterStart = parseInt(root.slice(root.length - 6, root.length - 3))
    const endStart = parseInt(rootEnd.slice(rootEnd.length - 6, rootEnd.length - 3))
    const booktTitle = autoTranslation ? I18n.t(`bible.${book?.title}`) : book?.title
    if (onlyTitle) {
      return `${booktTitle}`
    } else return `${booktTitle} ${chapterStart}-${endStart}`
  }

  public getBookName = (bookId: number, autoTranslation = false) => {
    const book = books.find(b => b.id === bookId)
    const booktTitle = autoTranslation ? I18n.t(`bible.${book?.title}`) : book?.title
    return booktTitle
  }

  public getPreviewItemTitle = (bookId: string | number, start: string | number, goal: App.Goal) => {
    const chapters = goal.pace.chapter
    const endChapter = goal.to.chapterId
    const book = books.find(b => b.id === bookId)
    if (chapters > 1) {
      const startChapters = start ? 1 + +chapters * +start : 1
      const endChapters = Math.min(startChapters + +chapters - 1, endChapter)
      return `${book?.title} ${startChapters}-${endChapters}`
    }
    return `${book?.title} ${+start + 1}`
  }

  public rootIdStrToBibleText = async (rootIdStr: string, hideOsis?: boolean, format?: boolean): Promise<[string, string]> => {
    const rootIds = rootIdStr.split(',')
    const usfmVerses: any = await Database.query(`SELECT * FROM verse WHERE id IN (${rootIdStr})`)

    // Group verse ids into continuous groups
    const verseGroups: any[] = []
    let group: number[] = []
    let lastVerse = 0
    rootIds.forEach(r => {
      const v = +r
      if (group.length === 0) {
        group = [v]
      } else {
        if (v === lastVerse + 1) {
          group.push(v)
        } else {
          verseGroups.push(group)
          group = [v]
        }
      }
      lastVerse = v
    })
    verseGroups.push(group)

    let text = ''
    const passages: any[] = []
    verseGroups.forEach((vg, idx) => {
      const osis = this.toOsis(vg)
      if (!hideOsis) text += osis + '\n'

      let vgText = ''
      vg.forEach(v => {
        const found = _.find(usfmVerses, { id: v })
        if (found) {
          const t = found.usfmText
          text += removeMarker(t).trim() + ' '
          vgText += removeMarker(t).trim() + ' '
        }
      })

      if (format) {
        text = text.replace(/\s\s+/g, ' ')
        text = text.replace(/,\s*$/, '.')
        text = text[0].toUpperCase() + text.slice(1)
      }

      if (idx !== verseGroups.length - 1) text += '\n\n'
      passages.push({ osis, text: vgText })
    })

    return [text, passages]
  }
}

export default BibleFormatter.shared
