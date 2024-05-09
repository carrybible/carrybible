import BottomButton from '@components/BottomButton'
import Button from '@components/Button'
import Container from '@components/Container'
import Icon from '@components/Icon'
import Toast from '@components/Toast'
import { H2, Subheading } from '@components/Typography'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { useAnalytic } from '@shared/Analytics'
import DailyReminder from '@shared/DailyReminder'
import { Constants } from '@shared/index'
import format from 'date-fns/format'
import I18n from 'i18n-js'
import React, { useMemo, useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import ChangeReminderTime from './components/ChangeReminderTime'

interface Props {
  route: RouteProp<Params, 'screen'>
}

type Params = {
  screen: {
    initTab?: string
  }
}

const timeFormat = 'hh:mm a'

const Reminder: React.FC<Props> = props => {
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const { color } = useTheme()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const Analytics = useAnalytic()
  const { landscape } = useScreenMode()
  const [reminder, setTime] = useState<{
    time: Date
    timeString: string
  }>({ time: new Date(DailyReminder.local.time), timeString: DailyReminder.local.timeString })

  const onPressReminder = () => {
    setOpen(true)
  }

  const handleTimeChanged = value => {
    setTime({
      time: value,
      timeString: format(value, timeFormat, { locale: global.locale }),
    })
  }

  const BottomButtons = useMemo(() => {
    const popScreen = () => {
      navigation.pop()
      if (props.route.params !== undefined && props.route.params.initTab !== undefined) {
        navigation.navigate(Constants.SCENES.STUDY_PLAN.PREVIEW, {
          initTab: props.route.params.initTab,
        })
      }
    }

    const onPressRemove = async () => {
      setLoading(true)
      await DailyReminder.updateLocalReminder(reminder.time, false)
      setLoading(false)
      Analytics.event(Constants.EVENTS.REMINDER.TAPPED_CANCEL)
      popScreen()
    }

    const onPressSetReminder = async () => {
      setLoading(true)
      await DailyReminder.updateLocalReminder(reminder.time, true)
      setLoading(false)
      Toast.success(I18n.t('text.Reminder time changed'))
      Analytics.event(Constants.EVENTS.REMINDER.TAPPED_SET_REMINDER)
      popScreen()
    }

    return (
      <View style={s.action}>
        <BottomButton
          title={DailyReminder.local?.enabled ? I18n.t('text.Change reminder') : I18n.t('text.Set reminder')}
          rounded
          onPress={onPressSetReminder}
          style={s.setReminder}
          loading={loading}
          disabled={reminder?.timeString === DailyReminder.local?.timeString && DailyReminder.local?.enabled === true}
        />
        <BottomButton
          title={!DailyReminder.local?.enabled ? I18n.t('text.Not now') : I18n.t('text.Turn reminder off')}
          titleStyle={[s.notNow, { color: color.gray }]}
          onPress={onPressRemove}
          backgroundColor="background"
          style={s.bottomButton}
          loading={loading}
        />
      </View>
    )
  }, [color, loading, reminder?.timeString, Analytics, reminder.time, navigation, props.route.params])

  const Header = useMemo(
    () => (
      <View style={s.alignCenter}>
        <H2 style={s.title}>{I18n.t('text.Reminder title')}</H2>
        <View style={[s.imageContainer, { backgroundColor: `${color.accent2}40` }]}>
          <Image source={require('@assets/images/clock.png')} style={s.mainImage} resizeMode="contain" />
        </View>
      </View>
    ),
    [color.accent],
  )

  const Content = useMemo(
    () => (
      <View style={s.alignCenter}>
        <Subheading style={s.subtext}>{I18n.t('text.Reminder Subtitle')}</Subheading>
        <TouchableOpacity onPress={onPressReminder} style={[s.timeWrapper, { borderColor: color.accent2 }]}>
          <Icon source={require('@assets/icons/ic-clock.png')} color={color.text} size={26} />
          <H2 style={[s.timeText, { color: color.text }]} bold>
            {(reminder?.timeString || '').toLowerCase()}
          </H2>
        </TouchableOpacity>
      </View>
    ),
    [color.accent, color.text, reminder?.timeString],
  )

  return (
    <Container safe>
      <Button.Icon
        style={s.closeBtn}
        icon="x"
        size={35}
        color={color.text}
        onPress={() => {
          navigation.pop()
        }}
      />
      {landscape ? (
        <ScreenView>
          <View style={s.center}>{Header}</View>
          <View style={s.center}>
            {Content}
            <View style={s.spacing} />
            {BottomButtons}
          </View>
        </ScreenView>
      ) : (
        <>
          <View style={s.container}>
            {Header}
            {Content}
          </View>
          {BottomButtons}
        </>
      )}

      <ChangeReminderTime open={open} setOpen={setOpen} onChange={handleTimeChanged} time={new Date(DailyReminder.local?.time || '')} />
    </Container>
  )
}

const s = StyleSheet.create({
  closeBtn: {
    marginRight: 16,
    alignSelf: 'flex-end',
  },
  spacing: { height: 25 },
  alignCenter: { alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  setReminder: { marginBottom: 0 },
  bottomButton: { marginBottom: 0, marginTop: 0, borderTopWidth: 0 },
  mainImage: {
    height: 43,
    width: 42,
    aspectRatio: 1,
    alignSelf: 'center',
  },
  imageContainer: {
    width: 135,
    height: 135,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 67.5,
    marginTop: 25,
    marginBottom: 10,
  },
  title: {
    textAlign: 'center',
    marginHorizontal: '10%',
  },
  subtext: {
    paddingHorizontal: 20,
    opacity: 0.5,
    textAlign: 'center',
  },
  timeWrapper: {
    marginTop: 30,
    display: 'flex',
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 100,
    borderWidth: 2,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 10,
  },
  action: {
    width: '100%',
    marginBottom: 20,
  },
  notNow: { fontWeight: '500' },
})

export default Reminder
