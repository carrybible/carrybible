/**
 * Login Carousel
 *
 * @format
 *
 */

import { H2, Text } from '@components/Typography'
import React from 'react'
import { Image, StyleSheet, useWindowDimensions, View } from 'react-native'

interface Props {
  text: string
  image: any
}

const LoginCarousel: React.FC<Props> = props => {
  const dim = useWindowDimensions()

  return (
    <View style={{ flex: 1, width: dim.width, alignItems: 'center', justifyContent: 'center' }}>
      <Image source={props.image} style={{ height: 280, width: dim.width, marginBottom: 30 }} resizeMode="contain" />
      <H2 align="center" bold>
        {props.text}
      </H2>
    </View>
  )
}

LoginCarousel.defaultProps = {}

const s = StyleSheet.create({})

export default LoginCarousel
