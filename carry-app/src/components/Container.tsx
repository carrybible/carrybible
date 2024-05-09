import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import * as React from 'react'
import { LayoutChangeEvent, Platform, StatusBar, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'

type ForceInset = {
  top: boolean
  bottom: boolean
}

type IProps = {
  backgroundColor?: string
  padding?: boolean
  style?: StyleProp<ViewStyle>
  safe?: boolean
  forceInset?: ForceInset
  children?: any
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto'
  barStyle?: 'default' | 'light-content' | 'dark-content'
  onLayout?: (event: LayoutChangeEvent) => void
}

const Container: React.FC<IProps> = props => {
  const { color } = useTheme()

  if (props.safe) {
    return (
      <SafeAreaView
        pointerEvents={props.pointerEvents}
        style={[
          s.container,
          Platform.OS === 'android' ? { paddingTop: StatusBar.currentHeight } : {},
          props.padding ? s.padding : null,
          { backgroundColor: props.backgroundColor || color.background },
          props.style,
        ]}
        forceInset={{
          top: props.forceInset?.top ? 'always' : 'never',
          bottom: props.forceInset?.bottom ? 'always' : 'never',
        }}
      >
        <StatusBar barStyle={props.barStyle || color.barStyle} />
        <View style={s.childrenWrapper} onLayout={props.onLayout}>
          {props.children}
        </View>
      </SafeAreaView>
    )
  }

  return (
    <View
      style={[s.container, props.padding ? s.padding : null, { backgroundColor: props.backgroundColor || color.background }, props.style]}
      onLayout={props.onLayout}
    >
      <StatusBar barStyle={props.barStyle || color.barStyle} />
      {props.children}
    </View>
  )
}

Container.defaultProps = {
  safe: true,
  padding: false,
  forceInset: { top: true, bottom: true },
  pointerEvents: 'auto',
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
  },
  padding: {
    paddingHorizontal: Metrics.insets.horizontal,
    paddingVertical: Metrics.insets.vertical,
  },
  childrenWrapper: { flex: 1, backgroundColor: 'transparent' },
})

export default Container
