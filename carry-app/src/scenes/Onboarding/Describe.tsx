/**
 * Onboarding Describe Yourself
 *
 * @format
 *
 */

import { H1, Subheading, Text } from '@components/Typography'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useTheme from '@hooks/useTheme'
import { useAnalytic } from '@shared/Analytics'
import { Constants, Firestore, Metrics, Styles } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'

interface Props {
  onPressContinue: (string) => void
  initValue?: string | undefined
}
/**
 * Pastor Bible study leader Church leaderChurch member
 */
const options = [
  { title: I18n.t('text.Pastor'), value: 'Pastor' },
  { title: I18n.t('text.Bible study leader'), value: 'Bible study leader' },
  { title: I18n.t('text.Church leader'), value: 'Church leader' },
  { title: I18n.t('text.Church member'), value: 'Church member' },
]

const Describe: React.FC<Props> = props => {
  const { color } = useTheme()
  const [choosenItem, chooseItem] = useState<string | undefined>()
  const { linear } = useLayoutAnimation()
  const Analytics = useAnalytic()

  useEffect(() => {
    if (props.initValue && !choosenItem) {
      chooseItem(props.initValue)
    }
  }, [props.initValue])

  const onPressContinue = async (value: string) => {
    const { success, message } = await Firestore.Auth.updateUser({ describe: value })
    if (!success) {
      toast.error(message || I18n.t('text.Unable to save your selection'))
    } else {
      Analytics.event(Constants.EVENTS.ON_BOARDING.PICKS_DESCRIPTION)
      props.onPressContinue(value)
    }
  }

  const onPressItem = value => {
    linear()
    chooseItem(value)
    onPressContinue(value)
  }

  const ButtonOption = ({ title, value }) => {
    let textStyle = {}
    let containerStyle = { backgroundColor: color.middle, borderColor: color.gray4 }
    if (choosenItem === value) {
      containerStyle = { backgroundColor: color.accent, borderColor: color.gray4 }
      textStyle = { color: color.white }
    }

    return (
      <TouchableOpacity
        style={[s.itemContainer, containerStyle]}
        onPress={() => {
          onPressItem(value)
        }}
      >
        <Text style={[s.text, textStyle]}>{title}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.container}>
      <View>
        <H1 style={s.question}>{I18n.t('text.Which best describes you')}</H1>
        {/* <Text color="gray" style={{ marginBottom: 15 }}>
          {I18n.t('text.I want to build a reading habit to')}
        </Text> */}
        {options.map(value => (
          <ButtonOption key={value.title} {...value} />
        ))}
      </View>
      <View style={s.hintCotainer}>
        <Text style={s.textIcon}>🙌</Text>
        <View style={s.msgContainer}>
          <Image style={[s.msgBg, { tintColor: `${color.gray5}AA` }]} resizeMode="cover" source={require('@assets/images/chat.png')} />
          <Subheading>{I18n.t('text.This helps us find people just like you')}</Subheading>
        </View>
      </View>
    </View>
  )
}

Describe.defaultProps = {}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Metrics.insets.horizontal,
  },
  question: { marginVertical: 15 },
  text: { flex: 1, fontWeight: '700' },
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
})

export default Describe
