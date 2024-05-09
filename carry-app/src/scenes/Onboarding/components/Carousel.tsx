/**
 * Carousel
 *
 * @format
 *
 */

import useTheme from '@hooks/useTheme'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

interface Props {}

const Bullets = ({ current, total }) => {
  const { color } = useTheme()
  return (
    <View style={s.bullets}>
      {Array(total)
        .fill(0)
        .map((i, idx) => (
          <View key={idx.toString()} style={[s.dot, { backgroundColor: idx === current ? color.text : color.gray5 }]} />
        ))}
    </View>
  )
}

const Carousel: React.FC<Props> = props => {
  const pageCount = props.children?.length || 0
  const [scrollIndex, setScrollIndex] = React.useState(0)

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={event => {
          setScrollIndex(Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width))
        }}
        scrollEventThrottle={32}
      >
        {props.children}
      </ScrollView>
      <Bullets total={pageCount} current={scrollIndex} />
    </View>
  )
}

Carousel.defaultProps = {}

const s = StyleSheet.create({
  bullets: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    marginHorizontal: 5,
    backgroundColor: '#00000040',
  },
  dot__current: {
    backgroundColor: '#000000',
  },
})

export default Carousel
