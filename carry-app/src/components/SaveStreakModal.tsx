import { H1, H3, Text } from '@components/Typography'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { useEffect, useRef } from 'react'
import { InteractionManager, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button from './Button'
import StreakCount from './StreakCount'

interface Props {
  navigation: any
  route: {
    params: {
      onStartStudyPlan: () => void
    }
  }
}

const SaveStreakModal: React.FC<Props> = props => {
  const { color } = useTheme()
  const { onStartStudyPlan } = props.route.params
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const me = useSelector<any, App.User>(s => s.me)
  const { landscape } = useScreenMode()

  useEffect(() => {
    modal.current?.open()
  }, [])

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      NavigationRoot.pop()
    })
  }

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      onClosed={onClosed}
      // eslint-disable-next-line react-native/no-inline-styles
      modalStyle={{
        ...styles.container,
        backgroundColor: color.background,
        marginLeft: landscape ? '25%' : 0,
      }}
      useNativeDriver
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: insets.bottom }} />}
      scrollViewProps={{
        showsVerticalScrollIndicator: false,
      }}>
      <View style={styles.contentWrapper}>
        <StreakCount
          currentStreak={me.currentStreak || 1}
          style={styles.imageWrapper}
          streaks={[]}
          backgroundColor={'transparent'}
          backgroundUncheck={color.gray7}
          space={45}
          isStartAnim={true}
        />
        <H1 align="center" style={styles.title}>
          {I18n.t('text.Save your streak')}
        </H1>
        <Text align="center" style={styles.contentText} color="gray3">
          {I18n.t('text.Complete today study')}
        </Text>
        <Button.Full
          style={[
            {
              backgroundColor: color.accent,
            },
            styles.btn,
          ]}
          text={I18n.t('text.Start today study')}
          textStyle={[styles.cancel, { color: color.white }]}
          onPress={() => {
            NavigationRoot.pop()
            onStartStudyPlan()
          }}
        />
        <TouchableOpacity
          style={styles.buttonText}
          onPress={() => {
            modal.current?.close()
          }}>
          <H3 color="gray3" bold>
            {I18n.t('text.Maybe later')}
          </H3>
        </TouchableOpacity>
      </View>
    </Modalize>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: Metrics.screen.width,
  },
  contentWrapper: {
    paddingTop: 55,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  imageWrapper: {
    height: 30,
    width: 30,
  },
  title: {
    marginBottom: 10,
  },
  contentText: {
    marginBottom: 35,
    width: '90%',
  },
  buttonText: {
    marginTop: 10,
    marginBottom: 80,
    height: 30,
  },
  btn: { borderRadius: 10 },
  cancel: { fontWeight: '700', flex: 1 },
})

export default SaveStreakModal
