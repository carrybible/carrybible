/* eslint-disable react-native/no-inline-styles */
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import React, { useEffect, useState } from 'react'
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native'

const BORDER_WIDTH = 0
const PROGRESS_HEIGHT = 8

interface IProps {
  style?: StyleProp<ViewStyle>
  width: ViewStyle['width']
  value: number
  color?: string
  shining?: boolean
  backgroundColor?: string
  disableAnimation?: boolean
}
const ProgressBar: React.FC<IProps> = ({
  style = {},
  value = 0,
  color = '#7199fe',
  backgroundColor = '',
  width,
  shining,
  disableAnimation,
}) => {
  const [progress, setProgress] = useState<number>(0)
  const { linear } = useLayoutAnimation()

  useEffect(() => {
    if (value != progress) {
      if (!disableAnimation) linear()
      setProgress(value)
    }
  }, [value])

  return (
    <View style={[styles.container, { width }, style]}>
      <View style={[styles.progress, { backgroundColor: backgroundColor || `${color}55`, width: `100%`, height: '100%' }]}>
        <View style={[styles.progress, { backgroundColor: color, width: `${value > 100 ? 100 : value}%`, height: '100%' }]} />
        <View style={styles.full}>{shining && <View style={styles.shining} />}</View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    borderWidth: BORDER_WIDTH,
    height: PROGRESS_HEIGHT,
    borderRadius: 30,
  },
  progress: {
    height: PROGRESS_HEIGHT - BORDER_WIDTH * 2,
    borderRadius: 30,
    overflow: 'hidden',
  },
  shining: {
    backgroundColor: '#FFFFFF33',
    height: 3,
    marginTop: 4,
    marginHorizontal: 7,
    zIndex: 3,
    borderRadius: 3,
  },
  full: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 },
})

export default ProgressBar
