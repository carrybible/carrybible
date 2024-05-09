import { H2, Text } from '@components/Typography'
import React, { useRef, useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import LottieView from 'lottie-react-native'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import BottomButton from '@components/BottomButton'
import useTheme from '@hooks/useTheme'

type Props = {
  onPressDone: () => void
}

const FollowUpCompleteAnimation: React.FC<Props> = ({ onPressDone }) => {
  const { color } = useTheme()
  const lottieTick = useRef(null)
  useEffect(() => {
    setTimeout(() => {
      // @ts-ignore
      lottieTick.current?.play()
    }, 500)
  }, [])

  return (
    <>
      <View style={[s.container, { backgroundColor: color.id === 'light' ? color.white : color.black }]}>
        <View style={s.top}>
          <View>
            <LottieView source={require('@assets/animations/stars.json')} style={s.stars} loop autoPlay />
            <LottieView
              ref={lottieTick}
              source={require('@assets/animations/award_advanced.json')}
              style={s.medal}
              loop={false}
              speed={1}
            />
          </View>
          <H2>{I18n.t('text.Keep doing what you re doing')}</H2>
          <Text style={s.descText} color="gray3">
            {I18n.t('text.Keep follow up up')}
          </Text>
        </View>
      </View>
      <BottomButton
        title={I18n.t('text.Finish')}
        onPress={onPressDone}
        style={[
          s.shareBtn,

          {
            backgroundColor: color.accent,
          },
        ]}
        avoidKeyboard={false}
      />
    </>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: 'center',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    justifyContent: 'space-between',
  },
  stars: { width: Metrics.screen.width, height: 160 },
  top: { justifyContent: 'center', alignItems: 'center', marginTop: '50%' },
  medal: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 162,
    height: 126,
  },
  descText: {
    textAlign: 'center',
    marginTop: 20,
  },
  shareBtn: {
    borderRadius: 10,
    height: 50,
    marginTop: 20,
    marginHorizontal: 20,
  },
})

export default FollowUpCompleteAnimation
