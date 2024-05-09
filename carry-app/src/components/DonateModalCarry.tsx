/* eslint-disable max-lines */
/* eslint-disable react-hooks/exhaustive-deps */
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
import Metrics from '@shared/Metrics'
import Stripe from '@shared/Stripe'
import Styles from '@shared/Styles'
import Utils, { isValidEmail } from '@shared/Utils'
import {
  confirmApplePayPayment,
  presentApplePay,
  presentGooglePay,
  useApplePay,
  useGooglePay,
  useStripe,
} from '@stripe/stripe-react-native'
import I18n from 'i18n-js'
import LottieView from 'lottie-react-native'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Image, InteractionManager, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useDispatch, useSelector } from 'react-redux'
import useLayoutAnimation from '../hooks/useLayoutAnimations'
import { RecordDonationProps } from '../shared/Stripe'
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
  const { custom } = useLayoutAnimation()
  const { isGooglePaySupported, initGooglePay } = useGooglePay()
  const { isApplePaySupported } = useApplePay()
  const { initPaymentSheet, presentPaymentSheet } = useStripe()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { currencies } = useSelector<RootState, RootState['settings']>(state => state.settings)
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const { landscape } = useScreenMode()
  const { showLoading, hideLoading } = useLoading()
  const [giveAmount, setGiveAmount] = useState(0)
  const [step, setStep] = useState<'pickAmount' | 'customAmount' | 'pickMethod' | 'completed'>('pickAmount')
  const [customAmount, setCustomAmount] = useState('')
  const [amounts, setAmounts] = useState(defaultAmount)
  const [currency, setCurrency] = useState(defaultCurrency)
  const [email, setEmail] = useState(me.email)
  const [isSupportGooglePay, setSupportGooglePay] = useState(false)
  const intent = useRef<{
    setupIntent: string
    ephemeralKey: string
    customer: string
  }>()
  const successId = useRef<any>()

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

  useEffect(() => {
    const checkGooglePay = async () => {
      if (!(await isGooglePaySupported({ testEnv: Config.ENV === 'dev' }))) {
        return devLog('Google Pay is not supported.')
      }

      const { error } = await initGooglePay({
        testEnv: Config.ENV === 'dev',
        merchantName: Config.BUNDLE_ID.ANDROID,
        countryCode: 'AU',
        billingAddressConfig: {
          format: 'FULL',
          isPhoneNumberRequired: true,
          isRequired: false,
        },
        existingPaymentMethodRequired: false,
        isEmailRequired: true,
      })

      if (error) {
        toast.error(error.message)
      } else {
        setSupportGooglePay(true)
      }
    }

    if (Platform.OS === 'android') {
      checkGooglePay()
    }
  }, [])

  const saveSuccessPayment = async () => {
    const donateObj: RecordDonationProps = {
      campusId: group.organisation?.campusId,
      campaignId: campaign?.id,
      fundId: fund?.id,
      groupId: group.id,
      amount: giveAmount,
      currency: currency,
      transactionDetails: {
        paymentIntent: intent.current?.setupIntent,
        customerStripeId: intent.current?.customer,
      },
      organisationId: group.organisation?.id || '',
    }
    if (campaign) {
      donateObj.campaignId = campaign.id
      donateObj.currency = campaign.currency
    }
    if (fund) {
      donateObj.fundId = fund.id
      donateObj.currency = fund.currency
    }
    const success = await Stripe.recordDonation(donateObj)
    if (success) {
      successId.current = success
      custom()
      setStep('completed')
      if (campaign) reloadData()
    }

    hideLoading()
  }

  const initializePaymentSheet = async ({ isGooglePay, isApplePay }: { isGooglePay?: boolean; isApplePay?: boolean }) => {
    showLoading()
    const result = await Stripe.requestIntent((customAmount ? Number(customAmount) : giveAmount) * 100, currency, {
      type: campaign ? 'campaign' : 'tithe',
      eventName: (campaign ? campaign.name : fund?.name) || '',
      eventId: (campaign ? campaign.id : fund?.id) || '',
      groupId: group.id,
      groupName: group.name,
      campusId: group.organisation?.campusId || '',
      organisationId: group.organisation?.id || '',
    })
    if (result) {
      intent.current = result
      const { setupIntent, ephemeralKey, customer } = result
      if (isGooglePay) {
        const { error } = await presentGooglePay({
          clientSecret: setupIntent,
          forSetupIntent: false,
        })

        if (error) {
          toast.error(error.message)
          hideLoading()
          return
        }
        await saveSuccessPayment()
        toast.success('The payment was confirmed successfully.')
        setStep('completed')
        if (campaign) reloadData()
        return
      }

      if (isApplePay) {
        const resultApplePay = await presentApplePay({
          cartItems: [
            {
              label: `${campaign?.name || fund?.name}`,
              amount: `${customAmount ? Number(customAmount) : giveAmount}`,
              paymentType: 'Immediate',
            },
          ],
          country: 'AU',
          currency: currency.toUpperCase(),
          shippingMethods: [
            {
              amount: `${customAmount ? Number(customAmount) : giveAmount}`,
              identifier: 'DPS',
              label: `${campaign?.name || fund?.name}`,
              detail: `Giving ${campaign?.name ? 'Campaign' : 'Tithing'}`,
            },
          ],
          requiredShippingAddressFields: ['emailAddress', 'phoneNumber'],
          requiredBillingContactFields: ['phoneNumber', 'name'],
        })
        const { error } = resultApplePay
        if (error) {
          // handle error
          hideLoading()
          return toast.error(`${error}`)
        }

        const confirmResult = await confirmApplePayPayment(setupIntent)
        const { error: confirmError } = confirmResult
        if (confirmError) {
          toast.error(confirmError.message)
          hideLoading()
          return
        }
        await saveSuccessPayment()
        toast.success('The payment was confirmed successfully.')
        setStep('completed')
        if (campaign) reloadData()
        return
      }

      const resultInit = await initPaymentSheet({
        merchantDisplayName: 'Carry Inc.',
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: setupIntent,
        defaultBillingDetails: {
          name: me.name,
        },
      })

      devLog(resultInit)
      if (!resultInit.error) {
        const { error } = await presentPaymentSheet()
        if (error) {
          toast.error(error.message)
          devLog(`Error code: ${error.code}`, error.message)
          hideLoading()
        } else {
          await saveSuccessPayment()
          toast.success('The payment was confirmed successfully.')
          setStep('completed')
          if (campaign) reloadData()
        }
      }
    } else {
      hideLoading()
    }
  }

  const handleClose = useCallback(() => {
    if (step === 'completed') {
      onClose(true)
    } else {
      onClose(false)
    }
    NavigationRoot.pop()
  }, [step])

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
  }, [email, hideLoading, handleClose, showLoading])

  const onClosed = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      handleClose()
    })
  }, [handleClose])

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
              borderColor: color.gray4,
              backgroundColor: color.background,
            },
            // eslint-disable-next-line react-native/no-inline-styles
            { borderWidth: 1 },
          ]}
          onPress={() => {
            setStep('customAmount')
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
          onPress={() => setStep('pickMethod')}
          disabled={!giveAmount}
        />
      </View>
    )
  }, [amounts, color.accent, color.background, color.gray4, color.primary, color.white, currency, giveAmount])

  const PickPaymentMethodView = useMemo(() => {
    return (
      <View style={styles.contentWrapper}>
        <H1 align="center" style={styles.iconTop}>
          {`💳`}
        </H1>
        <H1 align="center" style={styles.title}>
          {I18n.t('text.Choose your payment option')}
        </H1>

        <TouchableOpacity
          style={[
            styles.payButton,
            {
              borderColor: color.gray4,
              backgroundColor: color.background,
            },
          ]}
          onPress={() => {
            initializePaymentSheet({})
          }}>
          <Text style={styles.button}>{`Use Card`}</Text>
        </TouchableOpacity>

        {isSupportGooglePay && (
          <TouchableOpacity
            style={[
              styles.payButton,
              {
                borderColor: color.gray4,
                backgroundColor: color.background,
              },
            ]}
            onPress={() => {
              initializePaymentSheet({ isGooglePay: true })
            }}>
            <Image style={styles.googleIcon} source={require('@assets/images/google-pay.png')} />
            <Image style={[styles.googlePayText, { tintColor: color.text }]} source={require('@assets/images/google-pay-text.png')} />
          </TouchableOpacity>
        )}

        {isApplePaySupported && (
          <TouchableOpacity
            style={[
              styles.payButton,
              {
                borderColor: color.gray4,
                backgroundColor: color.background,
              },
            ]}
            onPress={() => {
              initializePaymentSheet({ isApplePay: true })
            }}>
            <Image style={[styles.appleText, { tintColor: color.text }]} source={require('@assets/images/apple-pay.png')} />
          </TouchableOpacity>
        )}
      </View>
    )
  }, [amounts, color.accent, color.background, color.gray4, color.primary, color.white, currency, giveAmount, initializePaymentSheet])

  const CustomAmountView = useMemo(() => {
    return (
      <View style={styles.contentWrapper}>
        <H1 align="center" style={styles.title}>
          {I18n.t('text.Gift amount')}
        </H1>
        <H3 align="center" style={styles.description2}>
          {I18n.t('text.Enter amount')}
        </H3>
        <TextField
          id="name"
          value={customAmount}
          keyboardType="numeric"
          label={currencies[currency]?.symbol || currency.toUpperCase()}
          numberOfLines={1}
          placeholderTextColor={color.gray3}
          maxLength={80}
          onChangeText={(_id, text) => {
            setCustomAmount(text)
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
          text={I18n.t('text.Continue')}
          textStyle={[styles.cancel, { color: color.white }]}
          onPress={() => initializePaymentSheet({})}
          disabled={!Utils.isNumeric(customAmount)}
        />
      </View>
    )
  }, [color.accent, color.gray, color.gray3, color.white, currency, customAmount, email, updateEmail])

  const renderStep = () => {
    switch (step) {
      case 'pickAmount':
        return PickAmountView
      case 'customAmount':
        return CustomAmountView
      case 'pickMethod':
        return PickPaymentMethodView
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
  googleIcon: { height: 30, width: 18, resizeMode: 'contain' },
  googlePayText: {
    height: 30,
    width: 40,
    resizeMode: 'contain',
  },
  appleText: { height: 23, width: 56, resizeMode: 'contain' },
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
  button: {
    fontWeight: '500',
    fontSize: 18,
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
  description2: {
    fontWeight: '400',
    marginBottom: 25,
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
  payButton: {
    width: '100%',
    height: 50,
    ...Styles.shadow2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    paddingHorizontal: Metrics.insets.horizontal,
    borderWidth: 1,
    borderRadius: 25,
    flexDirection: 'row',
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
