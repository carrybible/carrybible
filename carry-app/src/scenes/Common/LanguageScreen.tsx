import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { Footnote, H1, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import { SUPPORT_LANGUAGES } from '@shared/Constants'
import { forceChangeLanguage } from '@shared/I18n'
import { Constants, Firestore, Metrics, StreamIO, Styles } from '@shared/index'
import I18n from 'i18n-js'
import React, { useEffect, useRef } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'

interface Props {
  navigation?: any
  onPressContinue?: (string) => void
  initValue?: string | undefined
}

const LanguageScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const isStandalonePage = !!props.navigation
  const processing = useRef(false)

  useEffect(() => {
    return () => {
      processing.current = false
    }
  }, [])

  const onPressContinue = async (value: string) => {
    processing.current = true
    const { success, message } = await Firestore.Auth.updateUser({ language: value })
    if (!success) {
      toast.error(message || I18n.t('text.Unable to save your selection'))
      processing.current = false
    } else {
      forceChangeLanguage(value)
      await StreamIO.streamI18n.setLanguage(value)
      NavigationRoot.replace(Constants.SCENES.COMMON.TRANSLATION)
      processing.current = false
    }
  }

  const renderItem = ({ item }) => {
    const { name, details, value } = item
    let textStyle = {}
    let containerStyle = { backgroundColor: color.middle, borderColor: color.gray4 }
    if (me?.language === value) {
      containerStyle = { backgroundColor: color.blue, borderColor: color.gray4 }
      textStyle = { color: color.white }
    }

    return (
      <TouchableOpacity
        style={[s.itemContainer, containerStyle]}
        onPress={() => {
          if (processing.current) return
          onPressContinue(value)
        }}>
        <Text style={[s.title, textStyle]}>{name}</Text>
        <Footnote color="gray" style={[s.des, textStyle]}>
          {details}
        </Footnote>
      </TouchableOpacity>
    )
  }

  return (
    <Container safe>
      {isStandalonePage && (
        <HeaderBar
          iconLeft={'chevron-thin-left'}
          iconLeftFont={'entypo'}
          colorLeft={color.text}
          iconLeftSize={22}
          onPressLeft={() => {
            NavigationRoot.pop()
          }}
        />
      )}
      <View style={s.answersContainer}>
        <H1 style={s.header}>{I18n.t('text.Choose your language')}</H1>
        <FlatList data={SUPPORT_LANGUAGES} renderItem={renderItem} keyExtractor={item => item.value} />
      </View>
    </Container>
  )
}

const s = StyleSheet.create({
  title: {
    flex: 1,
    fontWeight: '700',
  },
  answersContainer: {
    flex: 1,
    paddingHorizontal: Metrics.insets.horizontal,
  },
  itemContainer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    borderRadius: 10,
    ...Styles.shadow,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 15,
    paddingHorizontal: Metrics.insets.horizontal,
    borderWidth: StyleSheet.hairlineWidth,
  },
  header: { marginTop: 30, marginBottom: 50 },
  des: { textAlign: 'right' },
})

export default LanguageScreen
