/**
 * Onboarding Pick a Goal
 *
 * @format
 *
 */

import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { Footnote, H1, H2, Subheading, Text } from '@components/Typography'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, Metrics, Styles } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useMemo, useState } from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'

interface Props {
  route?: any
  navigation?: any
  onPressContinue: (number) => void
  initValue?: number | undefined
}

const options = [
  { title: I18n.t('text.Casual'), chapter: I18n.t('params.Chapter per day', { countValue: 1 }), value: 1 },
  { title: I18n.t('text.Regular'), chapter: I18n.t('params.Chapter per day', { countValue: 2 }), value: 2 },
  { title: I18n.t('text.Serious'), chapter: I18n.t('params.Chapter per day', { countValue: 3 }), value: 3 },
  { title: I18n.t('text.Insane'), chapter: I18n.t('params.Chapter per day', { countValue: 4 }), value: 4 },
]

const PickGoal: React.FC<Props> = props => {
  const isChangeSetting = props?.route?.params?.isChangeSetting
  const currentValue = props?.route?.params?.currentValue
  const { color } = useTheme()
  const [choosenItem, chooseItem] = useState<number | undefined>()
  const { linear } = useLayoutAnimation()
  const [loading, setLoading] = useState<boolean>(false)
  const Analytics = useAnalytic()

  useEffect(() => {
    if (props.initValue != undefined && !choosenItem) {
      chooseItem(props.initValue)
    }
  }, [props.initValue])

  const onPressContinue = async () => {
    setLoading(true)
    const { success, message } = await Firestore.Auth.updateUser({ habit: choosenItem })
    setLoading(false)
    if (!success) {
      toast.error(message || I18n.t('text.Unable to save your selection'))
    } else {
      if (isChangeSetting) {
        Analytics.event(Constants.EVENTS.GROUP_PREVIEW.CHANGED_GOAL)
        props.navigation.pop()
      } else {
        Analytics.event(Constants.EVENTS.ON_BOARDING.PICKS_GOAL)
        props.onPressContinue(choosenItem)
      }
    }
  }

  const onPressItem = value => {
    linear()
    chooseItem(value)
  }

  const ButtonOption = ({ title, chapter, value }) => {
    let textStyle = {}
    let containerStyle = { backgroundColor: color.middle, borderColor: color.gray5 }
    if (choosenItem === value) {
      containerStyle = { backgroundColor: color.accent, borderColor: color.gray5 }
      textStyle = { color: color.white }
    }
    if (currentValue === value) {
      containerStyle = { backgroundColor: color.id === 'light' ? color.gray7 : color.gray4, borderColor: color.gray5 }
      textStyle = { color: color.gray }
    }
    return (
      <TouchableOpacity
        style={[s.itemContainer, containerStyle]}
        onPress={() => {
          onPressItem(value)
        }}>
        <H2 style={[s.flexTitle, textStyle]}>{title}</H2>
        <Footnote color="gray" style={[s.textCenter, textStyle]}>
          {I18n.t('text.Read and discuss')}
        </Footnote>
        <Text style={[s.chapterText, textStyle]}>{chapter}</Text>
      </TouchableOpacity>
    )
  }

  const renderContent = useMemo(() => {
    return (
      <>
        <View style={s.content}>
          {options.map(value => (
            <ButtonOption key={value.title} {...value} />
          ))}
          <View style={s.hintCotainer}>
            {isChangeSetting ? (
              <Image style={s.imageIcon} source={require('@assets/images/img-carry-logo.png')} resizeMode="contain" />
            ) : (
              <Text style={s.textIcon}>🙌</Text>
            )}
            <View style={s.msgContainer}>
              <Image
                style={[s.msgBg, { tintColor: `${color.gray5}AA` }]}
                resizeMode="contain"
                source={require('@assets/images/chat.png')}
              />
              <Subheading>{I18n.t('text.You can always change goals later')}</Subheading>
            </View>
          </View>
        </View>
        <BottomButton
          title={isChangeSetting ? I18n.t('text.Change goal') : I18n.t('text.Continue')}
          rounded
          disabled={!choosenItem}
          onPress={onPressContinue}
          avoidKeyboard={false}
          loading={loading}
        />
      </>
    )
  }, [choosenItem])

  if (isChangeSetting) {
    return (
      <Container safe>
        <HeaderBar onPressLeft={() => props?.navigation.goBack()} iconLeft="chevron-left" colorLeft={color.text} />
        <H2 style={s.header}>{I18n.t('text.Change your goal')}</H2>
        {renderContent}
      </Container>
    )
  } else {
    return (
      <View style={s.container}>
        <H1 style={s.headerH1}>{I18n.t('text.Pick a goal')}</H1>
        {renderContent}
      </View>
    )
  }
}

PickGoal.defaultProps = {}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexTitle: { flex: 0.7 },
  textCenter: { flex: 1, textAlign: 'center' },
  content: { flex: 1, paddingHorizontal: Metrics.insets.horizontal },
  header: { width: '100%', textAlign: 'center', marginBottom: 15, marginTop: -10 },
  headerH1: { marginVertical: 15, marginHorizontal: Metrics.insets.horizontal },
  itemContainer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    borderRadius: 10,
    ...Styles.shadow,
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: Metrics.insets.horizontal,
    borderWidth: StyleSheet.hairlineWidth,
  },
  hintCotainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textIcon: { width: 75, fontSize: 50, marginTop: 40 },
  imageIcon: { height: 75, width: 75, marginTop: 40, marginRight: 15 },
  msgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 190,
    height: 70,
  },
  msgBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 190,
    height: 70,
  },
  chapterText: { flex: 1, fontWeight: '700', textAlign: 'right' },
})

export default PickGoal
