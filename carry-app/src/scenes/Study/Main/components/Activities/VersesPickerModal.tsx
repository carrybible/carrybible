import Button from '@components/Button'
import Loading from '@components/Loading'
import { H1, Text } from '@components/Typography'
import UsfmRender, { bibleRules, bibleStyles } from '@components/USFMRender'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import BibleApis from '@shared/BibleApis'
import BibleFormatter from '@shared/BibleFormatter'
import books from '@shared/BibleReferenceFormatter/books.json'
import Database from '@shared/Database'
import Metrics from '@shared/Metrics'
import { isLegacyBible } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Keyboard, Platform, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSelector } from 'react-redux'
import { ActivityContext } from '../../StudyActivityScreen'
import AnimatedProgressButton from '../AnimatedProgressButton'
import BibleApiView from '../BibleApiView/BibleApiView'

interface Props {
  onReadDone?: () => void
  passage?: StudyPlan.PassageAct
  customPassages?: StudyPlan.CustomPassage[]
  onClosed: () => void
  onPressSend: (a: any, b: 'legacy' | 'new') => void
}

const ActivityReading = ({ onReadDone, passage, customPassages, onClosed, onPressSend }: Props, ref) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const translations = useSelector<RootState, RootState['translations']>(state => state.translations)
  const legacyBible = isLegacyBible(me, translations)
  const { activities, step } = useContext(ActivityContext)
  const [content, setContent] = useState('')
  const { custom } = useLayoutAnimation()
  const { color } = useTheme()
  const [paragraphs, setParagraphs] = useState({ data: [], updated: new Date().valueOf() })
  const progressButton = useRef<AnimatedProgressButton | null>(null)
  const contentSize = useRef<number>(0)
  const bibleRender = useRef<UsfmRender | null>(null)
  const bibleComponentRefs = useRef<any>({})
  const selectedVerves = useRef<Set<string>>(new Set([]))
  const selectedText = useRef<Set<string>>(new Set([]))
  const [stateVerse, setStateVerse] = useState<{
    verses: string
    selected: Set<string>
    rawVerse?: Array<string>
    texts?: Array<string>
  }>({
    verses: '',
    selected: new Set([]),
  })
  const timeoutAndroid = useRef<any>()
  const modalRef = useRef<Modalize>()
  const [loading, setLoading] = useState(true)
  const [choosenVerse, setChooseVerse] = useState<any>()

  useImperativeHandle(ref, () => ({
    clearSelected: rootIdArray => {
      rootIdArray.forEach(r => {
        handleVersePress(r)
      })
    },
  }))

  const queryString = useMemo(() => {
    if (!passage && !customPassages) return ''
    if (customPassages) {
      if (!legacyBible) {
        const q = Array<string>()

        customPassages.forEach(p => {
          let bookId = p?.bookAbbr || p?.bookId
          if (typeof bookId === 'number') {
            const book = books.find(i => i.id === bookId)
            bookId = book?.abbr
          }
          if (p?.fromVerse && p?.toVerse) {
            q.push(
              `${bookId}.${p?.chapterNumber || p?.chapterId}.${p?.fromVerse}-${bookId}.${p?.chapterNumber || p?.chapterId}.${p?.toVerse}`,
            )
          } else q.push(`${bookId}.${p?.chapterNumber || p?.chapterId}-${bookId}.${p?.toChapterNumber || p?.toChapterId}`)
        })
        return q
        // const chapter = customPassages?.chapter
        // return `${chapter?.bookAbbr}.${chapter?.chapterNumber}-${chapter?.bookAbbr}.${chapter?.toChapterNumber}`
      } else {
        return `SELECT * FROM verse WHERE ${customPassages
          ?.map(value => {
            let bookId = value.bookId
            if (typeof bookId === 'string') {
              // cast bookId from bible api to bible local
              const book = books.find(b => b.abbr.toUpperCase() === bookId?.toString().toUpperCase())
              bookId = Number(book?.id)
            }
            return `( book = ${bookId}  AND (chapter >= ${value.chapterNumber || value.chapterId} AND chapter <= ${
              value.chapterNumber || value.toChapterId || value.chapterId
            }) ${value.fromVerse ? `AND (verse >= ${value.fromVerse} AND verse <= ${value.toVerse})` : ''})`
          })
          .join(' OR ')}  ORDER BY book, chapter, verse`
      }
    }
    if (!legacyBible) {
      const chapter = passage?.chapter
      const verses = passage?.verses
      if (chapter?.chapterNumber && verses?.length) {
        // Case leader select verse range
        return `${chapter?.bookAbbr}.${chapter?.chapterNumber}.${verses?.[0]?.from}-${chapter?.bookAbbr}.${chapter?.chapterNumber}.${verses?.[0]?.to}`
      }
      return `${chapter?.bookAbbr || chapter?.bookId}.${chapter?.chapterNumber || chapter?.chapterId}-${
        chapter?.bookAbbr || chapter?.bookId
      }.${chapter?.toChapterNumber || chapter?.toChapterId}`
    } else {
      let bookId = passage?.chapter?.bookId
      if (typeof bookId === 'string') {
        // cast bookId from bible api to bible local
        const book = books.find(b => b.abbr.toUpperCase() === bookId?.toString().toUpperCase())
        bookId = book?.id
      }
      return passage?.chapter?.toChapterId
        ? `SELECT * FROM verse WHERE ( book = ${bookId}  AND (chapter >= ${passage.chapter?.chapterNumber} AND chapter <= ${passage.chapter?.toChapterNumber}))  ORDER BY book, chapter, verse`
        : `SELECT * FROM verse WHERE ( book = ${bookId}  AND chapter = ${passage?.chapter?.chapterNumber} AND (verse >= ${passage?.verses?.[0].from} AND verse <= ${passage?.verses?.[0].to}))  ORDER BY book, chapter, verse`
    }
  }, [passage, customPassages])
  devLog('passage', passage)
  devLog('customPassages', customPassages)
  devLog('queryString', queryString)

  const getData = useCallback(async () => {
    await Promise.all(
      queryString.map(async q => {
        const {
          data: { content },
        } = await BibleApis.getPassages(me.translationId ?? '', q)
        setContent(s => s + content)
      }),
    )
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!legacyBible && queryString) {
      getData()
    }
  }, [queryString, legacyBible])

  useEffect(() => {
    setChooseVerse(stateVerse)
  }, [stateVerse])

  useEffect(() => {
    Keyboard.dismiss()
    renderBible()
  }, [])

  const handleVersePress = useCallback((rootID, newBibleHightlight, text) => {
    if (!legacyBible) {
      if (newBibleHightlight) {
        selectedVerves.current.add(rootID)
        selectedText.current.add(text)
      } else {
        selectedVerves.current.delete(rootID)
        selectedText.current.add(text)
      }
      if (selectedVerves.current.size > 0) {
        const verses = BibleFormatter.toNewBibleOsis(Array.from(selectedVerves.current).sort())

        setStateVerse({
          verses,
          rawVerse: Array.from(selectedVerves.current),
          selected: selectedVerves.current,
          texts: Array.from(selectedText.current).sort((a, b) => parseInt(a[0]) - parseInt(b[0])),
        })
      } else {
        setStateVerse({
          verses: '',
          rawVerse: [],
          selected: new Set([]),
        })
      }
    } else {
      // Highlight verse
      const [highlighted] = bibleComponentRefs.current[rootID].toogle()
      if (highlighted) {
        selectedVerves.current.add(rootID)
      } else {
        selectedVerves.current.delete(rootID)
      }
      if (selectedVerves.current.size > 0) {
        setStateVerse({
          verses: BibleFormatter.toOsis(Array.from(selectedVerves.current).sort()),
          selected: selectedVerves.current,
        })
      } else {
        setStateVerse({
          verses: '',
          selected: new Set([]),
        })
      }
    }
  }, [])

  useEffect(() => {
    if (activities?.[step]?.type === 'passage' && Platform.OS === 'android') {
      if (paragraphs.data.length > 0) {
        if (timeoutAndroid.current) clearTimeout(timeoutAndroid.current)
        timeoutAndroid.current = setTimeout(() => {
          if (contentSize.current < Metrics.screen.height) {
            progressButton.current?.progress?.(1)
          }
        }, 1000) // Wait time for render and read a little bit
      }
    }
    return () => {
      if (timeoutAndroid.current) clearTimeout(timeoutAndroid.current)
    }
  }, [paragraphs, step])

  const renderBible = useCallback(async () => {
    if (!bibleRender.current) {
      bibleRender.current = new UsfmRender(
        {
          ...bibleRules,
          f: () => null,
        },
        bibleStyles,
        {
          v: handleVersePress,
          p: null,
        },
      )
    }

    try {
      const verses = (await Database.query(queryString)) as any[]
      if (verses.length > 0) {
        const convert = verses.map(value => ({
          ...value,
          usfmText: value.usfmText.trim(),
        }))
        const [list, refs] = bibleRender.current.renderVersesAutoCorrect(convert, { showQuickNav: false })
        bibleComponentRefs.current = refs
        const newParagraphs = { data: list || [], updated: new Date().valueOf() }
        // paragraphCache[step] = newParagraphs
        setParagraphs(newParagraphs)
      }
    } catch (e) {
      devWarn('query data fail', e)
    }
  }, [queryString, handleVersePress])

  const renderVerse = ({ item }) => item

  const onPressSendVerses = () => {
    onPressSend(choosenVerse, legacyBible ? 'legacy' : 'new')
    modalRef.current?.close()
  }

  const onOpened = useCallback(() => {
    setTimeout(() => {
      custom()
      setLoading(false)
    }, 500)
    // Expend more time after animation done
  }, [])

  return (
    <Modalize
      ref={(ref: Modalize) => {
        modalRef.current = ref
        ref?.open?.()
      }}
      onOpened={onOpened}
      onClosed={onClosed}
      adjustToContentHeight
      disableScrollIfPossible={Platform.OS !== 'android'}
      modalTopOffset={100}
      panGestureEnabled={Platform.OS !== 'android' && !legacyBible}
      modalStyle={[
        s.modal,
        {
          backgroundColor: color.background,
        },
      ]}
      FooterComponent={
        <View style={[{ backgroundColor: color.background, borderTopColor: color.gray6 }, s.footer]}>
          {choosenVerse?.verses ? (
            <Text color="accent" numberOfLines={2} bold style={s.verses}>
              {choosenVerse?.verses}
            </Text>
          ) : (
            <Text color="gray5" style={s.placeholder}>
              {I18n.t('text.Tap verses to add to your message')}
            </Text>
          )}
          <View style={s.iconSend}>
            <Button.Icon
              icon={require('@assets/icons/ic-send.png')}
              size={28}
              onPress={onPressSendVerses}
              color={color.accent}
              disabled={!choosenVerse?.verses}
            />
          </View>
        </View>
      }
      flatListProps={
        loading
          ? undefined
          : {
              style: { zIndex: 1, backgroundColor: 'transparent' },
              data: loading
                ? []
                : !legacyBible
                ? [
                    <BibleApiView
                      backgroundColor={color.background}
                      source={content}
                      style={[s.bibleView, { backgroundColor: color.background }]}
                      onVersePress={handleVersePress}
                    />,
                  ]
                : paragraphs.data,
              ListEmptyComponent:
                activities?.[step]?.type === 'question' ? (
                  <View style={s.center}>
                    <H1 style={s.handIcon}>{'👋'}</H1>
                    <Text>{I18n.t('text.No passages before')}</Text>
                  </View>
                ) : (
                  <Loading />
                ),
              bounces: true,
              removeClippedSubviews: true,
              contentContainerStyle: [s.flatListContent],
              keyExtractor: (__, index) => index.toString(),
              renderItem: renderVerse,
              scrollEventThrottle: 16,
              viewabilityConfig: { itemVisiblePercentThreshold: 30 },
            }
      }>
      {loading ? (
        <View style={s.loadingContainer}>
          <Loading style={s.loading} />
        </View>
      ) : null}
    </Modalize>
  )
}

const s = StyleSheet.create({
  flatListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: Metrics.header.height + 6,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingBottom: 15,
  },
  modal: { borderTopRightRadius: 20, borderTopLeftRadius: 20 },
  footer: {
    height: 70,
    width: '100%',
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 60,
  },
  verses: { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1, height: '100%' },
  handIcon: { fontSize: 30, height: 40 },
  iconSend: { position: 'absolute', right: Metrics.insets.horizontal },
  loadingContainer: { height: 300, backgroundColor: 'transparent' },
  loading: { backgroundColor: 'transparent' },
  bibleView: {
    height: 400,
  },
})

export default forwardRef(ActivityReading)
