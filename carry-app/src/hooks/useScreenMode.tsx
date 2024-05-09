import React, { FC } from 'react'
import { useMemo } from 'react'
import { useWindowDimensions, StyleSheet, View, ScrollView } from 'react-native'

export const ScreenView: FC<{
  children?: any
  separateHorizontal?: boolean
  separateVertical?: boolean
  scrollable?: {
    left?: boolean
    right?: boolean
    view?: boolean
  }
  containerProps?: any
  leftProps?: any
  rightProps?: any
  onExpandListLayout?: (e: any) => void
}> = ({ children, separateHorizontal, separateVertical, scrollable, containerProps, leftProps, rightProps, onExpandListLayout }) => {
  const { landscape } = useScreenMode()
  const [first, ...restChildren] = React.Children.toArray(children)
  const LeftView = scrollable?.left ? ScrollView : View
  const RightView = scrollable?.right ? ScrollView : View
  const FlexView = scrollable?.view ? ScrollView : View

  if (landscape) {
    return (
      <View style={s.row}>
        <LeftView {...leftProps} style={[s.flex, leftProps?.style]}>
          {first}
        </LeftView>
        <RightView {...rightProps} style={[s.flex, separateHorizontal ? s.horizontalSeparate : {}, rightProps?.style]}>
          {restChildren}
        </RightView>
      </View>
    )
  }

  return (
    <FlexView {...containerProps} style={[s.flex, containerProps?.style]}>
      <View style={[s.expand, separateVertical ? s.verticalSeparate : {}]}>{first}</View>
      <View style={s.expandList} onLayout={onExpandListLayout}>
        {restChildren}
      </View>
    </FlexView>
  )
}

const useScreenMode = () => {
  const { width, height } = useWindowDimensions()

  const landscape = useMemo(() => {
    return width > height
  }, [height, width])

  return { landscape, ScreenView }
}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  horizontalSeparate: {
    borderLeftWidth: StyleSheet.hairlineWidth,
  },
  verticalSeparate: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  expand: {
    width: '100%',
  },
  expandList: {
    width: '100%',
    flex: 1,
  },
})

export default useScreenMode
