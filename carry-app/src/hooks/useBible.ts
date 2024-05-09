import { RootState } from '@dts/state'
import BibleApis from '@shared/BibleApis'
import Database from '@shared/Database'
import { isLegacyBible } from '@shared/Utils'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'

type Book = { id: any; abbr: string; name: string; chapters: number }

export const useBibleBooks = (): [Book[], boolean] => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const translations = useSelector<RootState, RootState['translations']>(state => state.translations)

  const [data, setData] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        if (isLegacyBible(me, translations)) {
          const books = (await Database.query(
            `SELECT b.*, b.name, (SELECT MAX(v.chapter) FROM verse v WHERE v.book=b.id) AS chapters FROM book b ORDER BY b.id`,
          )) as Book[]
          setData(books)
        } else if (me.translationId) {
          const bibleBooks = await BibleApis.getBooks(me.translationId)
          const bibleData =
            bibleBooks?.map(book => {
              return {
                abbr: book.id,
                chapters: book.chapters?.length || 0,
                id: book.id,
                name: book.name,
              }
            }) ?? []
          setData(bibleData)
        }
      } catch (error) {
        devWarn('Failed to get bible data', error)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  return [data, loading]
}

type Verse = { id: any; book: string; chapter: number }
export const useBibleVerses = ({ bookId, chapterNumber }: { bookId: any; chapterNumber: number }): [Verse[], boolean] => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const translations = useSelector<RootState, RootState['translations']>(state => state.translations)

  const [data, setData] = useState<Verse[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        if (isLegacyBible(me, translations)) {
          const verses = (await Database.query(
            `SELECT * FROM verse WHERE chapter = ${chapterNumber} AND book = ${bookId} ORDER BY verse`,
          )) as Verse[]
          setData(verses)
        } else if (me.translationId) {
          const bibleBooks = await BibleApis.getBooks(me.translationId)
          const chapter = bibleBooks?.find(book => book.id === bookId)?.chapters[chapterNumber]
          if (!chapter) {
            throw new Error('Failed to get chapter from Bible API')
          }
          const verses = await BibleApis.getVerses(me.translationId, chapter.id)
          setData(
            verses?.map(verse => ({
              id: verse.id,
              book: verse.bookId,
              chapter: chapterNumber,
            })) ?? [],
          )
        }
      } catch (error) {
        devWarn('Failed to get bible data', error)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  return [data, loading]
}
