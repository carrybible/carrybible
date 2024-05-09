import BottomButton from '@components/BottomButton'
import Icon from '@components/Icon'
import Loading from '@components/Loading'
import ModalHeader from '@components/ModalHeader'
import { Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import { useBibleVerses } from '@hooks/useBible'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native'

const NUM_COLUMNS = 5
const VERSE_WIDTH = Metrics.screen.width / NUM_COLUMNS
const ChooseVerses = ({
  onCreate,
  passage,
  setVerses,
}: {
  onCreate: (act: StudyPlan.PassageAct) => void
  passage: StudyPlan.PassageAct
  setVerses: (verses: StudyPlan.PassageItem[], verseRange: string) => void
}) => {
  const { color } = useTheme()
  const [verses] = useBibleVerses({
    bookId: passage.chapter!.bookId,
    chapterNumber: passage.chapter!.chapterNumber,
  })

  const [selectedVerses, setSelectedVerses] = useState<StudyPlan.PassageItem[]>(passage.verses ?? [])
  const [selectingVerse, setSelectingVerse] = useState<Partial<StudyPlan.PassageItem>>({})

  useEffect(
    () => {
      const verseRange = selectedVerses
        .map(verse => {
          return verse.from === verse.to ? `${verse.from}` : `${verse.from}-${verse.to}`
        })
        .join(', ')
      setVerses(selectedVerses, verseRange)
    },
    // Sync selected verse
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedVerses],
  )

  const renderItem = useCallback(
    ({ index: rawIndex }) => {
      const index = rawIndex + 1
      const isSelecting = index === selectingVerse.from
      const isStart = selectedVerses.some(verse => verse.from === index) || isSelecting
      const isEnd = selectedVerses.some(verse => verse.to === index)
      const isInRange = selectedVerses.some(verse => verse.from < index && index < verse.to)
      return (
        <Verse
          onPress={() => {
            let removedOverlapVerses = selectedVerses.filter(verse => verse.from > index || index > verse.to)
            if (!selectingVerse.from) {
              setSelectedVerses(removedOverlapVerses)
              setSelectingVerse({
                from: index,
              })
              return
            }

            let from = selectingVerse.from
            let to = index
            if (to < from) {
              from = index
              to = selectingVerse.from
            }
            removedOverlapVerses = removedOverlapVerses.filter(
              verse => !(from <= verse.from && verse.from <= to) && !(from <= verse.to && verse.to <= to),
            )
            const sortedVerses = [
              ...removedOverlapVerses,
              {
                from,
                to,
              },
            ].sort((a, b) => a.to - b.to)
            const mergedVerses: StudyPlan.PassageItem[] = []
            sortedVerses.forEach(verse => {
              if (mergedVerses.length === 0) {
                mergedVerses.push(verse)
                return
              }
              if (mergedVerses[mergedVerses.length - 1].to === verse.from - 1) {
                mergedVerses[mergedVerses.length - 1].to = verse.to
              } else {
                mergedVerses.push(verse)
              }
            })
            setSelectedVerses(mergedVerses)
            setSelectingVerse({})
          }}
          onLongPress={() => {
            if (selectingVerse.from) {
              return
            }
            const removedOverlapVerses = selectedVerses.filter(verse => !verse.to || !verse.from || verse.from > index || verse.to < index)
            setSelectedVerses(removedOverlapVerses)
          }}
          name={`${index}`}
          isEnd={isEnd}
          isStart={isStart}
          isSelecting={isSelecting}
          isInRange={isInRange}
          isLastLineItem={index % NUM_COLUMNS === 0}
          isFirstLineItem={index % NUM_COLUMNS === 1}
        />
      )
    },
    [selectedVerses, selectingVerse.from],
  )

  return (
    <View style={styles.flex}>
      <ModalHeader handlePosition="inside" title={I18n.t('text.Choose verses')} style={styles.modalHeader} />
      <View style={styles.chooseVerseTitle}>
        <Icon source={'chevron-down'} size={15} color={color.text} style={styles.icon} />
        <Text bold style={styles.titleText}>{`${passage.chapter?.bookName} ${passage.chapter?.chapterNumber}: `}</Text>
        {passage.verseRange ? (
          <Text bold style={[styles.titleText, styles.verseRange]} numberOfLines={1}>
            {passage.verseRange}
          </Text>
        ) : (
          <Text color="gray3">{I18n.t('text.enter verse range')}</Text>
        )}
      </View>
      <View style={styles.flex}>
        <FlatList
          data={verses ?? []}
          renderItem={renderItem}
          keyExtractor={item => `${item.id}`}
          ListEmptyComponent={<Loading />}
          numColumns={NUM_COLUMNS}
          alwaysBounceVertical={false}
        />
      </View>
      <BottomButton
        title={I18n.t('text.Done')}
        rounded
        onPress={() => {
          onCreate(passage)
        }}
        disabled={!passage.verseRange || passage.verses?.length === 0}
      />
    </View>
  )
}

const Verse = ({
  onPress,
  onLongPress,
  name,
  isInRange,
  isStart,
  isEnd,
  isFirstLineItem,
  isLastLineItem,
  isSelecting,
}: {
  onPress: () => void
  onLongPress?: () => void
  name: string
  isInRange: boolean
  isStart: boolean
  isEnd: boolean
  isFirstLineItem: boolean
  isLastLineItem: boolean
  isSelecting: boolean
}) => {
  const { color } = useTheme()
  const verseBackgroundStyle = {
    ...styles.verseBackground,
    backgroundColor: color.lavender,
  }

  return (
    <TouchableOpacity style={styles.verseWrapper} onPress={onPress} onLongPress={onLongPress}>
      <View
        style={[
          isInRange ? verseBackgroundStyle : null,
          isInRange && isFirstLineItem ? styles.firstLineItem : null,
          isInRange && isLastLineItem ? styles.lastLineItem : null,
          isStart && !isSelecting && !isEnd && !isLastLineItem
            ? {
                ...verseBackgroundStyle,
                width: VERSE_WIDTH / 2,
                transform: [{ translateX: VERSE_WIDTH / 4 }],
              }
            : null,
          isEnd && !isStart && !isFirstLineItem
            ? {
                ...verseBackgroundStyle,
                width: VERSE_WIDTH / 2,
                transform: [{ translateX: -VERSE_WIDTH / 4 }],
              }
            : null,
        ]}
      />
      <View
        // hitSlop={{ top: 15, right: 25, bottom: 15, left: 25 }}
        style={[
          isStart || isEnd
            ? {
                ...styles.verseButton,
                backgroundColor: color.accent2,
              }
            : null,
          isSelecting
            ? {
                backgroundColor: color.red,
              }
            : null,
        ]}>
        <Text bold align="center" color={isStart || isEnd ? 'background' : 'text'}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  modalHeader: {
    borderBottomWidth: 0,
  },
  chooseVerseTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 40,
    marginRight: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  titleText: {
    opacity: 0.8,
  },
  verseWrapper: {
    width: VERSE_WIDTH,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseButton: {
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  verseBackground: {
    height: 36,
    width: VERSE_WIDTH,
    position: 'absolute',
  },
  firstLineItem: {
    borderBottomLeftRadius: 18,
    borderTopLeftRadius: 18,
    transform: [{ translateX: VERSE_WIDTH / 4 }],
  },
  lastLineItem: {
    borderBottomRightRadius: 18,
    borderTopRightRadius: 18,
    transform: [{ translateX: -VERSE_WIDTH / 4 }],
  },
  icon: {
    marginRight: 3,
    opacity: 0.8,
  },
  verseRange: {
    flex: 1,
  },
})

export default ChooseVerses
