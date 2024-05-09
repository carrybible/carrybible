import React from 'react'
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native'
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg'

type IProps = {
  style: StyleProp<ViewStyle>
  colors: string[]
}

const ArrowHint = (props: IProps) => {
  return (
    <View style={[s.container, props.style]}>
      <Svg viewBox="0 0 24 13">
        <Defs>
          <LinearGradient id="Gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">
            {props.colors.map((value, index) => {
              return <Stop key={`${index}`} offset={1} stopColor={value} stopOpacity="1" />
            })}
          </LinearGradient>
        </Defs>
        <Path d="M0.5 -2.5 L23.5 -2.5 L12 13 z" fill="url(#Gradient)" />
        {/* <Path d="M2 -5 L22 -5 L12 9 z" fill={'rgba(0,0,0,1)'} /> */}
      </Svg>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    height: 25,
    width: 28,
  },
})

export default ArrowHint
