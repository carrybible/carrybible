import React from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import ChapterItem from './ChapterItem'

export type ChapterItemProps = {
  id: string | number
  number?: number
  title: string
}

type IProps = {
  chapters: Array<ChapterItemProps>
  numColumns?: number
  selectMode: 'single' | 'range'
  startChapter: number
  endChapter: number
  onPressChapter?: (number) => void
}

const Chapter = (props: IProps) => {
  const renderItem = ({ item, index }) => {
    return (
      <ChapterItem
        item={item}
        index={index}
        onPressChapter={props.onPressChapter}
        startChapter={props.startChapter}
        endChapter={props.endChapter}
      />
    )
  }

  return (
    <View style={s.container}>
      <FlatList
        data={props.chapters}
        renderItem={renderItem}
        horizontal={false}
        numColumns={props.numColumns}
        keyExtractor={item => `${item.id}`}
        style={s.wrapper}
      />
    </View>
  )
}

Chapter.defaultProps = {
  startChapter: 0,
  endChapter: 0,
  selectMode: 'range',
  numColumns: 5,
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    flex: 1,
  },
  wrapper: { flex: 1, width: '100%' },
})

export default Chapter
