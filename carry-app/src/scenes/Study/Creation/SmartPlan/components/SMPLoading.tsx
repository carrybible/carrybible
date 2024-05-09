import { H1, Text } from '@components/Typography'
import useZoomIn from '@hooks/animations/useZoomIn'
import useZoomInOut from '@hooks/animations/useZoomInOut'
import I18n from '@shared/I18n'
import LottieView from 'lottie-react-native'
import * as React from 'react'
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

const SMPLoading: React.FC<{
  style?: StyleProp<ViewStyle>
  isOrg?: boolean
  onComplete: () => void
}> = ({ style, onComplete, isOrg }) => {
  const [isZoomComplete, setZoomComplete] = React.useState(false)
  const lottie = React.useRef<LottieView>()

  React.useEffect(() => {
    setTimeout(() => {
      lottie.current?.play()
    }, 200)
  }, [])

  const _onAnimationComplete = () => {
    setZoomComplete(true)
    setTimeout(onComplete, 3000)
  }

  const [zoomScale, zoomOpacity] = useZoomInOut(3000, 'out', _onAnimationComplete)
  const { scale, opacity } = useZoomIn(3600)

  return (
    <View style={[s.container, style]}>
      <LottieView ref={lottie} source={require('@assets/animations/stars.json')} style={s.lottie} loop speed={0.7} />
      <H1 style={s.title}>{I18n.t('text.Do not worry we have got you')}</H1>
      <View style={s.bottom}>
        {!isZoomComplete ? (
          <Animated.View style={{ opacity: zoomOpacity }}>
            <Text style={s.descText}>{I18n.t('text.Leading a group can be overwhelming')}</Text>
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: opacity }}>
            <Text style={s.descText}>
              {isOrg ? I18n.t('text.Pulling up your plan') : I18n.t('text.Answer a few questions and you will be set up in no time')}
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    marginHorizontal: '25%',
    textAlign: 'center',
  },
  descText: {
    marginHorizontal: 55,
    textAlign: 'center',
  },
  bottom: {
    position: 'absolute',
    top: '70%',
  },
})

export default SMPLoading
