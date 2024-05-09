import db from '@shared/Database'
import UsfmRender, { bibleRules, bibleStyles } from '@components/USFMRender'

export const queryFullPassage = async () => {
  const query = `SELECT * FROM verse`
  const verses = (await db.query(query)) as any[]
  const convert = verses.map(value => ({
    ...value,
    usfmText: value.usfmText.trim(),
  }))
  const result = {}
  convert.forEach(value => {
    const check = getAllTagInVerse(value.usfmText)
    Object.keys(check).forEach(function (key) {
      result[key] = (result[key] || 0) + 1
    })
  })

  const mapping = {}
  Object.keys(result).forEach(function (key) {
    if (key.includes('*')) {
      // End tag
      const endTag = key
      const tag = endTag.slice(0, -1)
      if (result[tag]) {
        mapping[tag] = {
          endTag: key,
          countStart: result[tag],
          countEnd: result[key],
        }
      }
      delete result?.[key]
      delete result?.[tag]
    } else {
      // Start or Single tag
      if (result[`${key}*`]) {
        mapping[key] = {
          endTag: `${key}*`,
          countStart: result[key],
          countEnd: result[`${key}*`],
        }
        delete result?.[key]
        delete result?.[`${key}*`]
      } else {
        mapping[key] = {
          count: result[key],
        }
        delete result?.[key]
      }
    }
  })
  devLog(mapping)
}

export const getAllTagInVerse = (passage: string) => {
  const result: { [key: string]: number } = {}
  let tag = ''
  for (let i = 0; i < passage.length; i++) {
    const char = passage[i]
    if (tag) {
      if (char === '*') {
        tag = `${tag}*`
        result[tag] = (result[tag] || 0) + 1
        tag = ''
      } else if (char === ' ' || char === '\\' || char === '\n') {
        result[tag] = (result[tag] || 0) + 1
        tag = ''
      } else {
        tag = `${tag}${char}`
      }
    }
    if (char === '\\') {
      tag = '\\'
    }
  }
  return result
}

export const getBasicTag = () => {
  const fullObject: any = {}
  Object.keys(results).forEach(function (key) {
    const translation = results[key]
    Object.keys(translation).forEach(function (tagKey) {
      const tagObj = translation[tagKey]
      if (!fullObject[tagKey]) {
        fullObject[tagKey] = tagObj
      } else {
        if (tagObj?.endTag) {
          fullObject[tagKey].countEnd += tagObj.countEnd
          fullObject[tagKey].countStart += tagObj.countStart
          fullObject[tagKey].endTag = tagObj.endTag
        } else {
          fullObject[tagKey].count += tagObj.count
        }
      }
    })
  })
  devLog(fullObject)
}

export const formatVerses = verses => {
  let correctVerses = ''
  const openingTag: string[] = []
  // Detect Tag
  let tag = ''
  for (let i = 0; i < verses.length; i++) {
    const char = verses[i]
    correctVerses = `${correctVerses}${char}`
    if (tag) {
      if (char === '*') {
        const customTag = tag.includes('+') ? tag.replace('+', '') : tag.replace('\\', '\\+')
        const theLastTag = openingTag?.[openingTag.length - 1]
        if (theLastTag === tag || theLastTag === customTag) {
          // Found closing tag, remove last tag in the list
          devLog('Found closing tag', openingTag, tag)
          openingTag.pop()
        } else {
          const isExisting = openingTag.reduce((pre, currenVal) => {
            return pre || currenVal === tag || currenVal === customTag
          }, false)

          // Found closing tag but not the right one.
          if (isExisting) {
            devLog('Found existing tag', openingTag, tag)
            // Open Tag existing in the list, close all tag until it
            let j = openingTag.length
            correctVerses = correctVerses.substring(0, correctVerses.length - tag.length - 1)
            let addingTag = ''
            while (j > 0 && tag) {
              j -= 1
              const currentTag = openingTag.pop()
              addingTag = `${addingTag}${currentTag}*`
              devLog('addingTag', addingTag)
              if (currentTag === tag || currentTag === customTag) {
                // Found correct tag
                tag = ''
                correctVerses = `${correctVerses}${addingTag}`
              }
            }
          } else {
            devLog('Found missing tag', openingTag, tag)
            // Open Tag is not exist in the list, remove the current tag
            correctVerses = correctVerses.substring(0, correctVerses.length - tag.length - 1)
          }
        }
        // Found end tag
        tag = ''
      } else if (char === ' ' || char === '\\' || char === '\n') {
        // Found a start tag // Start tag always need spacing
        if (allTag[tag]) {
          // Tag is in the list
          const tagData = allTag[tag]
          if (tagData.endTag) {
            // Found Start tag
            // Add tag to the list to record opening Tag (Need to close)
            openingTag.push(tag)
          } else {
            // Found Single tag
            // Check if this tag is not apply to any text, then remove it
          }
        }
        tag = ''
      } else {
        tag = `${tag}${char}`
      }
    }
    if (char === '\\') {
      tag = '\\'
    }
  }

  // Remove some tag at the end of text
  const REJECT_END_TAGS = [
    '\\li1',
    '\\p',
    '\\m',
    '\\ie',
    '\\wj',
    '\\add',
    '\\+add',
    '\\bdit',
    '\\+bdit',
    '\\+nd',
    '\\+sc',
    '\\+tl',
    '\\+wj',
    '\\wj',
    '\\f',
    '\\fm',
    '\\fv',
    '\\it',
    '\\nd',
    '\\qs',
    '\\sc',
    '\\tl',
  ]
  tag = ''
  correctVerses = correctVerses.trim()
  let i = correctVerses.length

  while (i > 0) {
    i -= 1
    const char = correctVerses[i]
    tag = `${char}${tag}`

    devLog('i', i, tag)

    if (char === '\\') {
      // found tag
      if (REJECT_END_TAGS.includes(tag) || !tag.includes('*')) {
        correctVerses = correctVerses.substring(0, correctVerses.length - tag.length)
        correctVerses = correctVerses.trim()
        i = correctVerses.length
        tag = ''
      }
    }
    if (char === ' ') {
      // found space, mean there is no more end tag
      i = 0
    }
  }

  return correctVerses
}

export const testFormatVerse = async () => {
  const query = `SELECT * FROM verse`
  const verses = (await db.query(query)) as any[]

  const render = new UsfmRender(bibleRules, bibleStyles, {
    v: () => undefined,
    p: null,
  })

  const convert = verses.map(value => ({
    ...value,
    usfmText: value.usfmText.trim(),
  }))

  const [list] = render.renderVersesAutoCorrect(convert, { showQuickNav: false })
  devLog('RESULT', list.length)
  if (list.length === 0) {
    // devLog('origin fails:', value.usfmText.trim())
  }

  devLog('done')
}

const allTag = {
  '\\+add': { countEnd: 498, countStart: 498, endTag: ['\\+add*', '\\add*'] },
  '\\add': { countEnd: 13777, countStart: 13777, endTag: ['\\+add*', '\\add*'] },

  '\\+bdit': { countEnd: 4, countStart: 4, endTag: ['\\+bdit*', '\\bdit*'] },
  '\\bdit': { countEnd: 30, countStart: 30, endTag: ['\\+bdit*', '\\bdit*'] },

  '\\+nd': { countEnd: 133, countStart: 133, endTag: ['\\+nd*', '\\nd*'] },
  '\\+sc': { countEnd: 4, countStart: 4, endTag: ['\\+sc*', '\\sc*'] },
  '\\+tl': { countEnd: 251, countStart: 251, endTag: ['\\+tl*', '\\tl*'] },
  '\\+wj': { countEnd: 18, countStart: 18, endTag: ['\\+wj*', '\\wj*'] },
  '\\wj': { countEnd: 8131, countStart: 8131, endTag: ['\\wj*', '\\+wj*'] },
  '\\b': { count: 6989 },
  '\\cl': { count: 300 },
  '\\d': { count: 464 },
  '\\f': { countEnd: 15151, countStart: 15151, endTag: ['\\f*', '\\+f*'] },
  '\\fm': { countEnd: 32, countStart: 32, endTag: ['\\fm*', '\\+fm*'] },
  '\\fq': { count: 3813 },
  '\\fqa': { count: 3710 },
  '\\fr': { count: 15151 },
  '\\ft': { count: 15151 },
  '\\fv': { count: 5, countEnd: NaN, countStart: NaN, endTag: ['\\fv*', '\\+fv*'] },
  '\\iex': { count: 6 },
  '\\it': { countEnd: 48, countStart: 48, endTag: ['\\it*', '\\+it*'] },
  '\\li1': { count: 300 },
  '\\li2': { count: 752 },
  '\\li3': { count: 6 },
  '\\li4': { count: 18 },
  '\\m': { count: 120 },
  '\\mi': { count: 16 },
  '\\mr': { count: 10 },
  '\\ms1': { count: 33 },
  '\\nb': { count: 4 },
  '\\nd': { countEnd: 23618, countStart: 23618, endTag: ['\\nd*', '\\+nd*'] },
  '\\p': { count: 1657 },
  '\\pc': { count: 8 },
  '\\pi1': { count: 34 },
  '\\pi2': { count: 6 },
  '\\pm': { count: 98 },
  '\\pmc': { count: 2 },
  '\\pmo': { count: 26 },
  '\\pmr': { count: 27 },
  '\\q1': { count: 8249 },
  '\\q2': { count: 23428 },
  '\\q3': { count: 16 },
  '\\q4': { count: 244 },
  '\\qa': { count: 66 },
  '\\qc': { count: 12 },
  '\\qm1': { count: 14 },
  '\\qm2': { count: 14 },
  '\\qr': { count: 132 },
  '\\qs': { countEnd: 74, countStart: 74, endTag: ['\\qs*', '\\+qs*'] },
  '\\s1': { count: 6133 },
  '\\s2': { count: 160 },
  '\\sc': { countEnd: 34, countStart: 34, endTag: ['\\sc*', '\\+sc*'] },
  '\\sp': { count: 92 },
  '\\tc1': { count: 118 },
  '\\tcr2': { count: 246 },
  '\\tl': { countEnd: 126, countStart: 126, endTag: ['\\tl*', '\\+tl*'] },
  '\\tr': { count: 304 },
  '\\v': { count: 124394 },
}

const results = {
  ESV: {
    '\\+bdit': {
      countEnd: 4,
      countStart: 4,
      endTag: '\\+bdit*',
    },
    '\\+nd': {
      countEnd: 1,
      countStart: 1,
      endTag: '\\+nd*',
    },
    '\\+tl': {
      countEnd: 157,
      countStart: 157,
      endTag: '\\+tl*',
    },
    '\\add': {
      countEnd: 2,
      countStart: 2,
      endTag: '\\add*',
    },
    '\\b': {
      count: 1964,
    },
    '\\bdit': {
      countEnd: 30,
      countStart: 30,
      endTag: '\\bdit*',
    },
    '\\d': {
      count: 116,
    },
    '\\f': {
      countEnd: 3391,
      countStart: 3391,
      endTag: '\\f*',
    },
    '\\fq': {
      count: 3021,
    },
    '\\fr': {
      count: 3391,
    },
    '\\ft': {
      count: 3391,
    },
    '\\fv': {
      count: 5,
    },
    '\\m': {
      count: 32,
    },
    '\\ms1': {
      count: 5,
    },
    '\\nd': {
      countEnd: 5980,
      countStart: 5980,
      endTag: '\\nd*',
    },
    '\\p': {
      count: 121,
    },
    '\\pmr': {
      count: 3,
    },
    '\\q1': {
      count: 2553,
    },
    '\\q2': {
      count: 7558,
    },
    '\\q3': {
      count: 2,
    },
    '\\qa': {
      count: 22,
    },
    '\\qr': {
      count: 80,
    },
    '\\qs': {
      countEnd: 74,
      countStart: 74,
      endTag: '\\qs*',
    },
    '\\s1': {
      count: 2391,
    },
    '\\sc': {
      countEnd: 18,
      countStart: 18,
      endTag: '\\sc*',
    },
    '\\sp': {
      count: 26,
    },
    '\\tl': {
      countEnd: 18,
      countStart: 18,
      endTag: '\\tl*',
    },
    '\\v': {
      count: 31086,
    },
    '\\wj': {
      countEnd: 2042,
      countStart: 2042,
      endTag: '\\wj*',
    },
  },
  KJV: {
    '\\+add': { countEnd: 498, countStart: 498, endTag: '\\+add*' },
    '\\+nd': { countEnd: 66, countStart: 66, endTag: '\\+nd*' },
    '\\add': { countEnd: 13775, countStart: 13775, endTag: '\\add*' },
    '\\b': { count: 209 },
    '\\d': { count: 116 },
    '\\f': { countEnd: 5844, countStart: 5844, endTag: '\\f*' },
    '\\fr': { count: 5844 },
    '\\ft': { count: 5844 },
    '\\nd': { countEnd: 5818, countStart: 5818, endTag: '\\nd*' },
    '\\s1': { count: 36 },
    '\\tl': { countEnd: 22, countStart: 22, endTag: '\\tl*' },
    '\\v': { count: 31102 },
    '\\wj': { countEnd: 2027, countStart: 2027, endTag: '\\wj*' },
  },
  NIV: {
    '\\+nd': { countEnd: 33, countStart: 33, endTag: '\\+nd*' },
    '\\+sc': { countEnd: 2, countStart: 2, endTag: '\\+sc*' },
    '\\+tl': { countEnd: 47, countStart: 47, endTag: '\\+tl*' },
    '\\+wj': { countEnd: 9, countStart: 9, endTag: '\\+wj*' },
    '\\b': { count: 2408 },
    '\\cl': { count: 150 },
    '\\d': { count: 116 },
    '\\f': { countEnd: 2958, countStart: 2958, endTag: '\\f*' },
    '\\fm': { countEnd: 16, countStart: 16, endTag: '\\fm*' },
    '\\fq': { count: 396 },
    '\\fqa': { count: 1855 },
    '\\fr': { count: 2958 },
    '\\ft': { count: 2958 },
    '\\fv': { countEnd: 7, countStart: 44, endTag: '\\fv*' },
    '\\iex': { count: 3 },
    '\\it': { countEnd: 24, countStart: 24, endTag: '\\it*' },
    '\\li1': { count: 150 },
    '\\li2': { count: 376 },
    '\\li3': { count: 3 },
    '\\li4': { count: 9 },
    '\\m': { count: 44 },
    '\\mi': { count: 8 },
    '\\mr': { count: 5 },
    '\\ms1': { count: 14 },
    '\\nb': { count: 2 },
    '\\nd': { countEnd: 5910, countStart: 5910, endTag: '\\nd*' },
    '\\p': { count: 768 },
    '\\pc': { count: 4 },
    '\\pi1': { count: 17 },
    '\\pi2': { count: 3 },
    '\\pm': { count: 49 },
    '\\pmc': { count: 1 },
    '\\pmo': { count: 13 },
    '\\pmr': { count: 12 },
    '\\q1': { count: 2848 },
    '\\q2': { count: 7935 },
    '\\q3': { count: 7 },
    '\\q4': { count: 122 },
    '\\qa': { count: 22 },
    '\\qc': { count: 6 },
    '\\qm1': { count: 7 },
    '\\qm2': { count: 7 },
    '\\qr': { count: 26 },
    '\\s1': { count: 1853 },
    '\\s2': { count: 80 },
    '\\sc': { countEnd: 8, countStart: 8, endTag: '\\sc*' },
    '\\sp': { count: 33 },
    '\\tc1': { count: 59 },
    '\\tcr2': { count: 123 },
    '\\tl': { countEnd: 43, countStart: 43, endTag: '\\tl*' },
    '\\tr': { count: 152 },
    '\\v': { count: 31103 },
    '\\wj': { countEnd: 2031, countStart: 2031, endTag: '\\wj*' },
  },
  RV1909: {
    '\\+nd': { countEnd: 33, countStart: 33, endTag: '\\+nd*' },
    '\\+sc': { countEnd: 2, countStart: 2, endTag: '\\+sc*' },
    '\\+tl': { countEnd: 47, countStart: 47, endTag: '\\+tl*' },
    '\\+wj': { countEnd: 9, countStart: 9, endTag: '\\+wj*' },
    '\\b': { count: 2408 },
    '\\cl': { count: 150 },
    '\\d': { count: 116 },
    '\\f': { countEnd: 2958, countStart: 2958, endTag: '\\f*' },
    '\\fm': { countEnd: 16, countStart: 16, endTag: '\\fm*' },
    '\\fq': { count: 396 },
    '\\fqa': { count: 1855 },
    '\\fr': { count: 2958 },
    '\\ft': { count: 2958 },
    '\\fv': { countEnd: 7, countStart: 44, endTag: '\\fv*' },
    '\\iex': { count: 3 },
    '\\it': { countEnd: 24, countStart: 24, endTag: '\\it*' },
    '\\li1': { count: 150 },
    '\\li2': { count: 376 },
    '\\li3': { count: 3 },
    '\\li4': { count: 9 },
    '\\m': { count: 44 },
    '\\mi': { count: 8 },
    '\\mr': { count: 5 },
    '\\ms1': { count: 14 },
    '\\nb': { count: 2 },
    '\\nd': { countEnd: 5910, countStart: 5910, endTag: '\\nd*' },
    '\\p': { count: 768 },
    '\\pc': { count: 4 },
    '\\pi1': { count: 17 },
    '\\pi2': { count: 3 },
    '\\pm': { count: 49 },
    '\\pmc': { count: 1 },
    '\\pmo': { count: 13 },
    '\\pmr': { count: 12 },
    '\\q1': { count: 2848 },
    '\\q2': { count: 7935 },
    '\\q3': { count: 7 },
    '\\q4': { count: 122 },
    '\\qa': { count: 22 },
    '\\qc': { count: 6 },
    '\\qm1': { count: 7 },
    '\\qm2': { count: 7 },
    '\\qr': { count: 26 },
    '\\s1': { count: 1853 },
    '\\s2': { count: 80 },
    '\\sc': { countEnd: 8, countStart: 8, endTag: '\\sc*' },
    '\\sp': { count: 33 },
    '\\tc1': { count: 59 },
    '\\tcr2': { count: 123 },
    '\\tl': { countEnd: 43, countStart: 43, endTag: '\\tl*' },
    '\\tr': { count: 152 },
    '\\v': { count: 31103 },
    '\\wj': { countEnd: 2031, countStart: 2031, endTag: '\\wj*' },
  },
}
