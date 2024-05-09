/**
 * Single Select Book Item
 *
 * @format
 *
 */

import React, { useState, useMemo } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
import Chapter from './Chapter'
import BookTitle from './BookTitle'
import { Utils } from '@shared/index'
import useTheme from '@hooks/useTheme'

interface Props {
  name: string
  bookId: string
  currentChapter?: number
  currentBook?: string
  chapters: number
  selected?: boolean
  expanded?: boolean
  onPress?: (arg0: any) => void
  onChapterPress?: (arg: any) => void
}

const SingleBookItem: React.FC<Props> = props => {
  const { color } = useTheme()
  const [currentChapter, setCurrentChapter] = useState((props?.currentChapter || 0) - 1)
  const chapters = useMemo(() => {
    return Array.from({ length: props.chapters }, (_, i) => ({
      // @ts-ignore
      id: Utils.getRootID(props.bookId, i + 1, 0) || i + 1,
      number: i + 1,
      title: `${i + 1}`,
    }))
  }, [props.bookId, props.chapters])

  const onPressChapter = index => {
    setCurrentChapter(index)
    if (props.onChapterPress) props.onChapterPress(chapters[index])
  }

  return (
    <View style={{ backgroundColor: color.background }}>
      <TouchableOpacity onPress={props.onPress} style={s.titleBtn}>
        <BookTitle name={props.name} highlighted={props.selected} expanded={props.expanded} />
      </TouchableOpacity>
      {props.expanded ? (
        <Chapter
          chapters={chapters}
          onPressChapter={onPressChapter}
          startChapter={props.bookId === props.currentBook ? currentChapter : -1}
          endChapter={-1}
        />
      ) : null}
    </View>
  )
}

SingleBookItem.defaultProps = {}

const s = StyleSheet.create({
  titleBtn: { flex: 1, height: 50 },
})

export default SingleBookItem
