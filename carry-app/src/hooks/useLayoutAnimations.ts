import React from 'react'
import { Platform, UIManager, LayoutAnimation } from 'react-native'

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true)
  }
}

const CustomLayoutLinear = {
  duration: 250,
  create: {
    type: LayoutAnimation.Types.linear,
    property: LayoutAnimation.Properties.opacity,
  },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
  },
}

const SlowLayoutSpring = {
  ...LayoutAnimation.Presets.spring,
  duration: 700,
}

const useLayoutAnimation = () => {
  const custom = React.useCallback(() => LayoutAnimation.configureNext(CustomLayoutLinear), [])
  const spring = React.useCallback(() => LayoutAnimation.configureNext(LayoutAnimation.Presets.spring), [])
  const linear = React.useCallback(() => LayoutAnimation.configureNext(LayoutAnimation.Presets.linear), [])
  const slowSpring = React.useCallback(() => LayoutAnimation.configureNext(SlowLayoutSpring), [])
  const easeInEaseOut = React.useCallback(() => LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut), [])
  return { spring, linear, custom, slowSpring, easeInEaseOut }
}

export default useLayoutAnimation
