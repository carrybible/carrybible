import BOOKS from './books'

const ERROR_MESSAGES = {
  ERROR_BOOK_NOT_FOUND:
    "We can't recognise the book you've entered, please try entering the full name of the desired book.",
  ERROR_CHAPTER_NOT_FOUND:
    "We can't find the chapter entered, please try again.",
  ERROR_VERSE_NOT_FOUND: "We can't find the verse entered, please try again.",
}

type Verse = {
  bookId: number
  bookName: string
  bookAbbr: string
  chapterNumber: number
  verseFrom: number
  verseTo: number
}

const VERSE_REGEX =
  /((?:\d\s)?[A-Za-z]+(?:\s[A-Za-z]+)*)\s*(\d+)(?::(\d+))?(?:\s*-\s*(\d+)(?:\s*([a-zA-Z]+)\s*(\d+))?(?::(\d+))?)?/

// returns found verse object or Error if not found
function validatePassage(verse: string): Verse {
  let match = verse.match(VERSE_REGEX)

  if (match !== null) {
    let book: string | undefined = match[1]
    let chapter: number = parseInt(match[2])
    let verseFrom: number = parseInt(match[3])
    let verseTo: number = parseInt(match[4])

    let result: Verse

    if (book !== undefined) {
      // convert bookname to title case
      book = book
        .split(' ')
        .map((c) => {
          if (c !== 'of') {
            return c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()
          } else {
            return c
          }
        })
        .join(' ')

      let bookRef: any = BOOKS[book as keyof typeof BOOKS]

      if (bookRef !== undefined) {
        if (!isNaN(chapter)) {
          let maxVerses = parseInt(bookRef.verses[chapter])

          if (!isNaN(maxVerses)) {
            result = {
              bookId: bookRef.number,
              bookAbbr: bookRef.abbr,
              bookName: book,
              chapterNumber: chapter,
              verseFrom: 1,
              verseTo: maxVerses,
            }

            if (!isNaN(verseFrom)) {
              if (verseFrom <= maxVerses) {
                result.verseFrom = verseFrom
                if (!isNaN(verseTo)) {
                  if (verseTo <= maxVerses && verseTo >= verseFrom) {
                    // valid subrange
                    result.verseTo = verseTo
                    return result
                  } else {
                    // verse outside valid range
                    throw new Error(ERROR_MESSAGES['ERROR_VERSE_NOT_FOUND'])
                  }
                } else {
                  // single verse
                  result.verseTo = verseFrom
                  return result
                }
              } else {
                // verse outside valid range
                throw new Error(ERROR_MESSAGES['ERROR_VERSE_NOT_FOUND'])
              }
            } else {
              // whole chapter
              return result
            }
          } else {
            // chapter not found in book
            throw new Error(ERROR_MESSAGES['ERROR_CHAPTER_NOT_FOUND'])
          }
        } else {
          // chapter not given
          throw new Error(ERROR_MESSAGES['ERROR_CHAPTER_NOT_FOUND'])
        }
      } else {
        // book not found
        throw new Error(ERROR_MESSAGES['ERROR_BOOK_NOT_FOUND'])
      }
    } else {
      // verse malformed
      throw new Error(ERROR_MESSAGES['ERROR_BOOK_NOT_FOUND'])
    }
  } else {
    throw new Error(ERROR_MESSAGES['ERROR_BOOK_NOT_FOUND'])
  }
}

export default validatePassage
