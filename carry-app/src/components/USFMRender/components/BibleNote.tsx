// @flow
import Button from '@components/Button'
import useZoomInOut from '@hooks/animations/useZoomInOut'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/native'
import { useAnalytic } from '@shared/Analytics'
import React, { forwardRef, useImperativeHandle, useState } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { Constants, Styles } from '../../../shared'

type IProps = {
  onAnimationCompleted: any
  note?: any
}

function BibleNote(props: IProps, ref: any) {
  const Analytics = useAnalytic()
  const animateDelay = Math.floor(Math.random() * (700 - 200 + 1) + 200)
  const [animateDirection, setAnimateDirection] = useState<'in' | 'out'>('in')
  const { color: theme } = useTheme()
  const [note, setNote] = useState(props.note)
  const navigation = useNavigation()

  const _handleAnimationCompleted = dir => {
    if (props.onAnimationCompleted) {
      props.onAnimationCompleted(dir, props.note.id)
    }
  }

  const [zoomScale, zoomOpacity] = useZoomInOut(animateDelay, animateDirection, _handleAnimationCompleted)

  const _handleTap = () => {
    Analytics.event(Constants.EVENTS.BIBLE_NOTE_TAPPED)
    navigation.navigate(Constants.SCREENS.MODAL.NOTE_REVIEW, { item: note })
  }

  const _zoomOut = () => {
    setAnimateDirection('out')
  }

  useImperativeHandle(ref, () => ({
    props: { ...props },
    remove: () => _zoomOut(),
    update: note => setNote(note),
  }))

  return (
    <Animated.View
      style={{
        opacity: zoomOpacity,
        transform: [{ scaleX: zoomScale }, { scaleY: zoomScale }],
      }}
    >
      <View style={{ ...s.container }}>
        <Button.Icon
          icon={require('@assets/icons/ic-note.png')}
          size={17}
          color={theme.accent}
          style={{
            backgroundColor: theme.middle,
            width: 34,
            height: 34,
            borderRadius: 17,
            borderWidth: 1.5,
            borderColor: theme.middle,
            ...Styles.shadow2,
          }}
          onPress={_handleTap}
        />
      </View>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  container: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: -2,
  },
})

export default React.memo<IProps>(forwardRef(BibleNote))
