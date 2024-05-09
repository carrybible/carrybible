import { Footnote, Subheading, Text } from '@components/Typography'
import * as React from 'react'
import { ImageBackground, StyleSheet, View, Animated } from 'react-native'
import useFadeInUp from '@hooks/animations/useFadeInUp'

const NicelyDone: React.FC<{
  content: string
  style?: any
}> = ({ content, style }) => {
  const [fadeInOpacity] = useFadeInUp()
  return (
    <Animated.View style={[s.container, style, { opacity: fadeInOpacity }]}>
      <Text style={s.hand}>🙌</Text>
      <ImageBackground
        resizeMethod="scale"
        resizeMode="stretch"
        style={s.imgBackground}
        source={require('@assets/images/img-chat-frame.png')}
      >
        <View style={s.contentContainer}>
          <Footnote>{content}</Footnote>
        </View>
      </ImageBackground>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  hand: {
    fontSize: 50,
  },
  imgBackground: {
    width: 190,
    paddingLeft: 16,
    position: 'absolute',
    left: 70,
    bottom: 13,
  },
  contentContainer: {
    padding: 16,
    paddingHorizontal: 8,
  },
})

export default NicelyDone
