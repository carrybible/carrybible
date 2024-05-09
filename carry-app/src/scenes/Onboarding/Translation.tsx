import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import Icon from '@components/Icon'
import Loading from '@components/Loading'
import { Footnote, H1, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useLayoutAnimation from '@hooks/useLayoutAnimations'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import BibleApis from '@shared/BibleApis'
import { LANGUAGES, SUPPORT_LANGUAGES } from '@shared/Constants'
import { Config, Constants, Firestore, Metrics, Styles } from '@shared/index'
import { getCountryISO639, isLegacyBible, wait } from '@shared/Utils'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useDispatch, useSelector } from 'react-redux'
import { uniqBy } from 'lodash'
import db from '@shared/Database'

interface Props {
  route?: any
  navigation?: any
  onPressContinue?: (string) => void
  initValue?: string | undefined
}

const Translation: React.FC<Props> = props => {
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const translations = useSelector<RootState, RootState['translations']>(state => state.translations)
  const [language, setLanguage] = useState('')
  const [choosenItem, chooseItem] = useState<string | undefined>(me.translation ?? undefined)
  const [bibleTranslation, setBibleTranslation] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const { linear } = useLayoutAnimation()
  const dispatch = useDispatch()
  const isStandalonePage = !!props.navigation
  const Analytics = useAnalytic()
  const { landscape } = useScreenMode()

  useEffect(() => {
    if (!me.language) {
      setLanguage('en')
      return
    }
    setLanguage(me.language)
  }, [me.language])

  useEffect(() => {
    const getData = async () => {
      setLoading(true)
      setBibleTranslation([])
      const translations = await Firestore.Translation.getAll()
      let newTranslations = []
      const languageCode = getCountryISO639(language)
      if (languageCode) {
        const bibles = await BibleApis.getBibles(languageCode)
        newTranslations = bibles?.data?.map(it => ({
          lang: language,
          abbr: it.abbreviationLocal,
          carryPath: '',
          bucket: '',
          publisher: it.copyright,
          updated: it.updated,
          name: it.nameLocal,
          id: it.id,
        }))
      }
      let transList = translations.concat(newTranslations).filter(trans => {
        if (Config.FEATURES_GATE.BIBLE_WHITELIST[language].includes(trans.abbr.toUpperCase())) {
          return Config.FEATURES_GATE.BIBLE_API_ENABLED || (trans.carryId && trans.carryPath)
        }
      })
      transList = uniqBy(transList, t => t.abbr.toLowerCase())
      setBibleTranslation(transList)
      setLoading(false)
    }

    language && getData()
  }, [language])

  useEffect(() => {
    if (props.initValue && !choosenItem) {
      chooseItem(props.initValue)
    }
  }, [props.initValue, choosenItem])

  const onPressContinue = async (value: string, id?: string) => {
    const { success, message } = await Firestore.Auth.updateUser({ translation: value, translationId: id || '' })
    if (!success) {
      toast.error(message || I18n.t('text.Unable to save your selection'))
    } else {
      Analytics.event(Constants.EVENTS.ON_BOARDING.PICK_TRANSLATION)
      if (choosenItem?.toLocaleLowerCase() !== value && isLegacyBible({ ...me, translation: value }, translations)) {
        toast.success(I18n.t('text.Please restart your app'))
      }
      if (isStandalonePage) {
        if (choosenItem?.toLocaleLowerCase() !== value && isLegacyBible({ ...me, translation: value }, translations)) {
          // toast.success(I18n.t('text.Please restart your app'))
          db.file = ''
          db.close()
        }
        await wait(1000)
        props.navigation.pop()
      } else {
        props.onPressContinue?.(value)
      }
    }
  }

  const renderItem = ({ item }) => {
    const { name, abbr, id } = item
    let textStyle = {}
    let containerStyle = { backgroundColor: color.middle, borderColor: color.gray4 }

    if (choosenItem?.toLocaleLowerCase() === abbr.toLocaleLowerCase()) {
      containerStyle = { backgroundColor: color.accent, borderColor: color.gray4 }
      textStyle = { color: color.white }
    }

    return (
      <TouchableOpacity
        style={[s.itemContainer, containerStyle]}
        onPress={() => {
          linear()
          chooseItem(abbr)
          onPressContinue(abbr, id)
          dispatch({ type: TYPES.ONBOARDING.CLEAR })
        }}>
        <Text style={[s.title, textStyle]}>{(abbr || '').toUpperCase()}</Text>
        <Footnote color="gray" style={[s.des, textStyle]}>
          {name}
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
        <ScreenView>
          <View style={landscape ? s.container : {}}>
            <H1 style={[s.header, landscape ? s.textCenter : {}]}>{I18n.t('text.Choose a Bible translation')}</H1>
          </View>

          <TouchableOpacity
            style={s.langContainer}
            onPress={() => {
              NavigationRoot.push(Constants.SCENES.MODAL.BOTTOM_ACTIONS, {
                item: null,
                handleActions: (action: string) => {
                  if (action) {
                    setLanguage(action)
                  }
                },
                headerStyle: { height: 75 },
                headerComponent: () => <Text style={s.headerComponent}>{I18n.t('text.Choose language')}</Text>,
                actions: SUPPORT_LANGUAGES.map(value => ({
                  title: value.name,
                  action: value.value,
                  icon: require('@assets/images/translate-icon.png'),
                })),
              })
            }}>
            <Icon source={require('@assets/images/translate-icon.png')} color={color.text} size={22} />
            <Text style={s.title2}>{I18n.t('text.Language')}</Text>
            <Footnote color="gray" style={s.des}>
              {LANGUAGES[language]?.name}
            </Footnote>
          </TouchableOpacity>

          <FlatList
            data={bibleTranslation.filter(value => value.lang === language)}
            renderItem={renderItem}
            ListEmptyComponent={loading ? <Loading /> : undefined}
            keyExtractor={item => `${item.id}-${item.name}`}
          />
        </ScreenView>
      </View>
    </Container>
  )
}

Translation.defaultProps = {}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: '25%' },
  textCenter: { textAlign: 'center' },
  title: {
    flex: 1,
    fontWeight: '700',

    flexWrap: 'wrap',
  },
  title2: {
    flex: 1,
    fontWeight: '700',
    marginLeft: 10,
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
  langContainer: {
    width: '100%',
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: Metrics.insets.horizontal / 2,
    marginBottom: 20,
  },
  header: { marginTop: 30, marginBottom: 10 },
  des: { textAlign: 'right', marginLeft: 16, width: '60%' },
  headerComponent: { fontWeight: '700', maxHeight: 50 },
})

export default Translation
