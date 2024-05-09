/* eslint-disable max-lines */
import { H1, Text } from '@components/Typography'
import { Campaign } from '@dts/campaign'
import { RootState } from '@dts/state'
import { Tithing } from '@dts/tithing'
import useLoading from '@hooks/useLoading'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import Config from '@shared/Config'
import Firestore from '@shared/Firestore'
import Metrics from '@shared/Metrics'
import Stripe from '@shared/Stripe'
import Styles from '@shared/Styles'
import { isValidEmail } from '@shared/Utils'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AppState, InteractionManager, Linking, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import Button from './Button'
import { delayLottie } from './GroupInviteLink'
import TextField from './TextField'
import Toast from './Toast'
import H3 from './Typography/H3'

interface Props {
  navigation: any
  route: {
    params: { campaign?: Campaign; fund?: Tithing; onClose: (isSuccess?: boolean) => void }
  }
}

const defaultAmount = [5, 10, 15]
const defaultCurrency = 'USD'

const DonateModal: React.FC<Props> = props => {
  const dispatch = useDispatch()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const reloadData = useCallback(
    () => dispatch({ type: TYPES.ORGANISATION.GET_CAMPAIGNS, payload: { organisation: group.organisation, groupId: group.id } }),
    [],
  )
  const { campaign, fund, onClose } = props.route.params
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { currencies } = useSelector<RootState, RootState['settings']>(state => state.settings)
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const { landscape } = useScreenMode()
  const { showLoading, hideLoading } = useLoading()
  const [giveAmount, setGiveAmount] = useState<number | undefined>(0)
  const [step, setStep] = useState<'pickAmount' | 'completed'>('pickAmount')
  const [amounts, setAmounts] = useState(defaultAmount)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [email, setEmail] = useState(me.email)
  const successId = useRef<any>()
  const checkout = useRef<{ id: string; code: string; url: string } | undefined>()

  const appState = useRef(AppState.currentState)

  useEffect(() => {
    modal.current?.open()
  }, [])

  useEffect(() => {
    if (campaign) {
      setAmounts(campaign.suggestionAmounts || defaultAmount)
      setCurrency(campaign.currency || defaultCurrency)
    }
    if (fund) {
      setAmounts(fund.suggestionAmounts || defaultAmount)
      setCurrency(fund.currency || defaultCurrency)
    }
  }, [campaign, fund])

  const handleClose = useCallback(() => {
    if (step === 'completed') {
      onClose(true)
    } else {
      onClose(false)
    }
    NavigationRoot.pop()
  }, [onClose, step])

  const updateEmail = useCallback(async () => {
    showLoading()
    const success = await Stripe.updateEmailDonation({
      donationId: successId.current,
      email: email || '',
      organisationId: group.organisation?.id || '',
    })
    if (success) {
      Toast.success(I18n.t('text.Receipt sent'))
      handleClose()
    }
    hideLoading()
  }, [showLoading, email, group.organisation?.id, hideLoading, handleClose])

  const onClosed = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      handleClose()
    })
  }, [handleClose])

  useEffect(() => {
    const requestConfirmCheckout = async () => {
      if (checkout.current) {
        showLoading()
        let isSuccess = false
        const confirmedId = await Firestore.Organisations.isCheckoutConfirmed(checkout.current?.code)
        successId.current = confirmedId
        if (!confirmedId) {
          const result = await Firestore.Organisations.confirmPayment(checkout.current?.code)
          if (result) {
            successId.current = result
            isSuccess = true
          }
        } else {
          isSuccess = true
        }
        if (isSuccess) {
          toast.success(I18n.t('text.payment_confirmed'))
          setStep('completed')
          if (campaign) reloadData()
        }
        hideLoading()
      }
    }

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        requestConfirmCheckout()
      }
      appState.current = nextAppState
    })
    return () => {
      subscription.remove()
    }
  }, [])

  const requestCheckoutLink = useCallback(async () => {
    showLoading()
    const result = await Stripe.requestCheckoutLink(
      giveAmount ? giveAmount * 100 : undefined,
      currency,
      {
        type: campaign ? 'campaign' : 'tithe',
        eventName: (campaign ? campaign.name : fund?.name) || '',
        eventId: (campaign ? campaign.id : fund?.id) || '',
        groupId: group.id,
        groupName: group.name,
        campusId: group.organisation?.campusId || '',
        organisationId: group.organisation?.id || '',
        productName: 'Give to Carry',
      },
      Config.BRANCH.DOMAIN[0],
    )
    if (result) {
      Linking.openURL(result.url)
      checkout.current = result
    }
    hideLoading()
  }, [
    campaign,
    currency,
    fund?.id,
    fund?.name,
    giveAmount,
    group.id,
    group.name,
    group.organisation?.campusId,
    group.organisation?.id,
    hideLoading,
    showLoading,
  ])

  const CompletedView = useMemo(() => {
    return (
      <View style={styles.contentWrapper}>
        <LottieView
          source={require('../assets/animations/paymentCompleted.json')}
          style={styles.completedIcon}
          ref={r => delayLottie(r, 1000)}
          loop={false}
        />
        <H1 align="center" style={styles.title}>
          {I18n.t('text.Payment complete')}
        </H1>
        <H3 align="center" style={styles.description}>
          {I18n.t('text.Payment complete msg')}
        </H3>
        <TextField
          id="name"
          value={email}
          label={I18n.t('text.Email address')}
          numberOfLines={1}
          placeholderTextColor={color.gray3}
          maxLength={80}
          onChangeText={(_id, text) => {
            setEmail(text)
          }}
          containerStyle={[styles.textField__container]}
          style={[
            styles.textField,
            !email && {
              borderColor: color.gray,
            },
          ]}
          returnKeyType="next"
        />
        <Button.Full
          style={[
            {
              backgroundColor: color.accent,
            },
            styles.btn,
          ]}
          text={I18n.t('text.Finish')}
          textStyle={[styles.cancel, { color: color.white }]}
          onPress={updateEmail}
          disabled={!email || !isValidEmail(email)}
        />
      </View>
    )
  }, [color.gray3, color.gray, color.accent, color.white, email, updateEmail])

  const PickAmountView = useMemo(() => {
    return (
      <View style={styles.contentWrapper}>
        <H1 align="center" style={styles.iconTop}>
          {`🤝`}
        </H1>
        <H1 align="center" style={styles.title}>
          {I18n.t('text.How much give')}
        </H1>

        {amounts.map((value, index) => {
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.itemContainer,
                {
                  borderColor: giveAmount === value ? color.primary : color.gray4,
                  backgroundColor: color.background,
                },
                // eslint-disable-next-line react-native/no-inline-styles
                { borderWidth: giveAmount === value ? 2 : 1 },
              ]}
              onPress={() => {
                setGiveAmount(value)
              }}>
              <Text style={styles.item}>{`${currencies[currency]?.symbol}${value} ${
                currencies[currency]?.symbol ? '' : currency.toUpperCase()
              }`}</Text>
            </TouchableOpacity>
          )
        })}

        <TouchableOpacity
          style={[
            styles.itemContainer,
            {
              borderColor: giveAmount === undefined ? color.primary : color.gray4,
              backgroundColor: color.background,
            },
            // eslint-disable-next-line react-native/no-inline-styles
            { borderWidth: 1 },
          ]}
          onPress={() => {
            setGiveAmount(undefined)
          }}>
          <Text style={styles.item}>{I18n.t('text.Give different amount')}</Text>
        </TouchableOpacity>

        <Button.Full
          style={[
            {
              backgroundColor: color.accent,
            },
            styles.btn,
          ]}
          text={I18n.t('text.Continue')}
          textStyle={[styles.cancel, { color: color.white }]}
          onPress={() => {
            requestCheckoutLink()
          }}
          disabled={giveAmount === 0}
        />
      </View>
    )
  }, [amounts, color, currencies, currency, giveAmount, requestCheckoutLink])

  const renderStep = () => {
    switch (step) {
      case 'pickAmount':
        return PickAmountView
      case 'completed':
        return CompletedView
      default:
        return null
    }
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
      {renderStep()}
    </Modalize>
  )
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: Metrics.screen.width,
  },
  iconTop: {
    fontSize: 35,
    lineHeight: 40,
    marginVertical: 10,
  },
  contentWrapper: {
    paddingTop: 40,
    marginHorizontal: 20,
    marginBottom: 36,
  },
  btn: { borderRadius: 10, height: 50 },
  cancel: { fontWeight: '700', flex: 1 },
  item: {
    fontWeight: '700',
    fontSize: 14,
  },
  title: {
    marginBottom: 30,
  },
  description: {
    fontWeight: '400',
    marginBottom: 45,
    marginHorizontal: 30,
    opacity: 0.5,
  },
  itemContainer: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    borderRadius: 10,
    ...Styles.shadow2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingHorizontal: Metrics.insets.horizontal,
    borderWidth: StyleSheet.hairlineWidth,
  },
  completedIcon: { height: 104, width: 104, alignSelf: 'center', marginBottom: 10 },
  textField__container: {
    marginBottom: 15,
    borderRadius: 7,
  },
  textField: {
    maxHeight: 120,
    fontWeight: '300',
    borderWidth: 2,
  },
})

export default DonateModal
