import Loading from '@components/Loading'
import UsfmRender, { bibleRules, bibleStyles } from '@components/USFMRender'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import BibleApis from '@shared/BibleApis'
import BibleFormatter from '@shared/BibleFormatter'
import books from '@shared/BibleReferenceFormatter/books.json'
import db from '@shared/Database'
import Metrics from '@shared/Metrics'
import { isLegacyBible } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { FlatList, Platform, StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { ActivityContext } from '../../StudyActivityScreen'
import AnimatedProgressButton from '../AnimatedProgressButton'
import BibleApiView from '../BibleApiView/BibleApiView'

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList)

interface Props {
  onChooseVerse?: (a: any) => void
  onReadDone?: () => void
  passage?: StudyPlan.PassageAct
  customPassages?: StudyPlan.CustomPassage[]
}

const ActivityReading = ({ onChooseVerse, onReadDone, passage, customPassages }: Props, ref) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const [loading, setLoading] = useState(true)
  const translations = useSelector<RootState, RootState['translations']>(state => state.translations)
  const legacyBible = isLegacyBible(me, translations)
  const { activities, step } = useContext(ActivityContext)
  const [paragraphs, setParagraphs] = useState({ data: [], updated: new Date().valueOf() })
  const [content, setContent] = useState('')
  const progressButton = useRef<AnimatedProgressButton | null>(null)
  const contentSize = useRef<number>(0)
  const listSize = useRef<number>(0)
  const bibleRender = useRef<UsfmRender | null>(null)
  const bibleComponentRefs = useRef<any>({})
  const selectedVerves = useRef<Set<string>>(new Set([]))
  const [stateVerse, setStateVerse] = useState<{ verses: string; selected: Set<string> }>({ verses: '', selected: new Set([]) })
  const timeoutAndroid = useRef<any>()
  const { color } = useTheme()

  useImperativeHandle(ref, () => ({
    clearSelected: rootIdArray => {
      rootIdArray.forEach(r => {
        handleVersePress(r)
      })
    },
    isRead: () => {
      return progressButton.current?.state.enabled
    },
  }))

  const queryStringLegacy = useMemo(() => {
    if (!passage && !customPassages) return ''
    if (customPassages) {
      return `SELECT * FROM verse WHERE ${customPassages
        ?.map(value => {
          return `( book = ${value.bookId}  AND (chapter >= ${value.chapterId} AND chapter <= ${value.toChapterId || value.chapterId}) ${
            value.fromVerse ? `AND (verse >= ${value.fromVerse} AND verse <= ${value.toVerse})` : ''
          })`
        })
        .join(' OR ')}  ORDER BY book, chapter, verse`
    }
    let bookId = passage?.chapter?.bookId
    if (typeof bookId === 'string') {
      // cast bookId from bible api to bible local
      const book = books.find(b => b.abbr.toUpperCase() === bookId?.toString().toUpperCase())
      bookId = book?.id
    }
    return passage?.chapter?.toChapterId
      ? `SELECT * FROM verse WHERE ( book = ${bookId}  AND (chapter >= ${passage.chapter?.chapterNumber} AND chapter <= ${passage.chapter?.toChapterNumber}))  ORDER BY book, chapter, verse`
      : `SELECT * FROM verse WHERE ( book = ${bookId}  AND chapter = ${passage?.chapter?.chapterNumber} AND (verse >= ${passage?.verses?.[0].from} AND verse <= ${passage?.verses?.[0].to}))  ORDER BY book, chapter, verse`
  }, [passage, customPassages])

  const queryStringAPI = useMemo(() => {
    if (!passage && !customPassages) return ''
    if (customPassages) {
      return `SELECT * FROM verse WHERE ${customPassages
        ?.map(value => {
          return `( book = ${value.bookId}  AND (chapter >= ${value.chapterId} AND chapter <= ${value.toChapterId || value.chapterId}) ${
            value.fromVerse ? `AND (verse >= ${value.fromVerse} AND verse <= ${value.toVerse})` : ''
          })`
        })
        .join(' OR ')}  ORDER BY book, chapter, verse`
    }
    const chapter = passage?.chapter
    const verses = passage?.verses
    if (chapter?.chapterNumber && verses?.length) {
      // Incase leader select verse range
      return `${chapter?.bookAbbr}.${chapter?.chapterNumber}.${verses?.[0]?.from}-${chapter?.bookAbbr}.${chapter?.chapterNumber}.${verses?.[0]?.to}`
    }
    return `${chapter?.bookAbbr}.${chapter?.chapterNumber}-${chapter?.bookAbbr}.${chapter?.toChapterNumber}`
  }, [passage, customPassages])

  useEffect(() => {
    const requestData = async () => {
      setLoading(true)
      await renderBible()
      if (!legacyBible && queryStringAPI) {
        await getData()
      } else {
        setLoading(false)
      }
    }
    requestData()
  }, [queryStringAPI, legacyBible])

  const getData = useCallback(async () => {
    const response: any = await BibleApis.getPassages(me.translationId ?? '', queryStringAPI)
    if (response) {
      const {
        data: { content },
      } = response
      setContent(content)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (onChooseVerse) onChooseVerse(stateVerse)
  }, [stateVerse, onChooseVerse])

  const handleVersePress = useCallback(rootID => {
    // Only handle when onChooseVerse exist
    if (!onChooseVerse) return
    // // Highlight verse
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
  }, [paragraphs, step, activities])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (contentSize.current - listSize.current < 10 && legacyBible) {
        progressButton.current?.progress(1)
      }
    }, 250)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  const renderBible = useCallback(async () => {
    if (!bibleRender.current) {
      bibleRender.current = new UsfmRender(bibleRules, bibleStyles, {
        v: handleVersePress,
        p: null,
      })
    }

    try {
      const verses = (await db.query(queryStringLegacy)) as any[]
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
  }, [queryStringLegacy, handleVersePress])

  const renderVerse = ({ item }) => item

  if (loading) return <Loading />

  return (
    <>
      <View
        style={[
          s.container,
          {
            backgroundColor: color.id === 'light' ? color.white : color.black,
          },
        ]}>
        {legacyBible || (!loading && !content) ? (
          <AnimatedFlatList
            onLayout={e => {
              listSize.current = e.nativeEvent.layout.height
            }}
            style={s.list}
            data={paragraphs.data}
            bounces
            removeClippedSubviews
            contentContainerStyle={[s.flatListContent]}
            keyExtractor={(__, index) => index.toString()}
            renderItem={renderVerse}
            scrollEventThrottle={16}
            viewabilityConfig={{ itemVisiblePercentThreshold: 30 }}
            onScroll={({ nativeEvent }) => {
              progressButton.current?.progress(
                (nativeEvent.contentOffset.y + nativeEvent.layoutMeasurement.height) / nativeEvent.contentSize.height,
              )
            }}
            onContentSizeChange={(width, height) => {
              contentSize.current = height
            }}
          />
        ) : (
          <View style={s.paddingApi}>
            <BibleApiView
              style={[s.bibleApiView, { backgroundColor: color.id === 'light' ? color.white : color.black }]}
              source={content}
              onScroll={({ layoutHeight, maxScrollHeight, offsetY }) => {
                progressButton.current?.progress((layoutHeight + offsetY) / maxScrollHeight)
              }}
            />
          </View>
        )}
      </View>
      <AnimatedProgressButton
        ref={progressButton}
        text={I18n.t('text.Mark as read')}
        onPress={onReadDone}
        initialEnabled={false}
        hidden={!onReadDone}
        style={{ marginBottom: Metrics.insets.bottom }}
        color={color}
      />
    </>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: Metrics.insets.horizontal,
    marginBottom: Metrics.insets.horizontal,
    borderRadius: 20,
  },
  flatListContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: Metrics.header.height + 6,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingBottom: 15,
  },
  list: { flex: 1, zIndex: 1 },
  bibleApiView: { borderRadius: 8 },
  paddingApi: { paddingHorizontal: 20, flex: 1 },
})

export default forwardRef(ActivityReading)
