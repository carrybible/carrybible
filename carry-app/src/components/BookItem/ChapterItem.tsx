import useTheme from '@hooks/useTheme'
import React, { useMemo } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text } from '../Typography'

type IProps = {
  item: any
  index: number
  startChapter: number
  endChapter: number
  onPressChapter?: (number) => void
}

const Chapter = (props: IProps) => {
  const { item, index } = props
  const { color } = useTheme()

  const render = useMemo(() => {
    const endChapter = props.endChapter === -1 ? props.startChapter : props.endChapter
    let backgroundStyle = {}
    let circleStyle = {}
    let titleStyle = {}

    if (index === props.startChapter) {
      backgroundStyle = { left: '50%' }
    }
    if (index === endChapter) {
      backgroundStyle = { ...backgroundStyle, right: '50%' }
    }
    if (index < props.startChapter || index > endChapter) {
      backgroundStyle = { ...backgroundStyle, backgroundColor: 'transparent' }
      circleStyle = { backgroundColor: 'transparent' }
      titleStyle = { color: color.text }
    } else if (index > props.startChapter && index < endChapter) {
      circleStyle = { backgroundColor: 'transparent' }
      titleStyle = { color: color.text }
    }
    return (
      <View style={s.itemContainer}>
        <View style={[s.itemBackground, { backgroundColor: color.lavender }, backgroundStyle]} />
        <TouchableOpacity
          activeOpacity={1}
          style={[s.itemCircle, { backgroundColor: color.accent2 }, circleStyle]}
          onPress={() => {
            if (props.onPressChapter) props.onPressChapter(index)
          }}>
          <Text color="white" style={titleStyle} bold>
            {item.title}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }, [item, props.startChapter, props.endChapter])

  return render
}

Chapter.defaultProps = {
  startChapter: 0,
  endChapter: 0,
  selectMode: 'range',
  numColumns: 5,
}

const s = StyleSheet.create({
  itemContainer: { height: 50, width: '20%', justifyContent: 'center', alignItems: 'center' },
  itemBackground: { height: 36, position: 'absolute', top: 7, left: 0, right: 0 },
  itemCircle: { height: 36, width: 36, justifyContent: 'center', alignItems: 'center', borderRadius: 18 },
})

export default Chapter
