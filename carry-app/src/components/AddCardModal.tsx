import { H1 } from '@components/Typography'
import { RootState } from '@dts/state'
import { CardType } from '@dts/stripe'
import useLoading from '@hooks/useLoading'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import Metrics from '@shared/Metrics'
import Stripe from '@shared/Stripe'
import { CardField, CardFieldInput } from '@stripe/stripe-react-native'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InteractionManager, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import Button from './Button'
import TextInputWithLabel from './TextInputWithLabel'

interface Props {
  onClose: (paymentMethod?: CardType) => void
}

const AddCardModal: React.FC<Props> = ({ onClose }) => {
  const { color } = useTheme()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const [name, setName] = useState(me.name || '')
  const [card, setCard] = useState<CardFieldInput.Details>()
  const { landscape } = useScreenMode()
  const paymentRef = useRef<CardType>()
  const { showLoading, hideLoading } = useLoading()

  useEffect(() => {
    modal.current?.open()
  }, [])

  const isValidInfo = useMemo(
    () => card && card?.complete && card.validCVC && card.cvc && card.validNumber && card.number && name,
    [card, name],
  )

  const onPressAdd = useCallback(async () => {
    showLoading()
    if (card && card?.complete && card.validCVC && card.cvc && card.validNumber && card.number && name) {
      const paymentMethod = await Stripe.addCard(
        {
          name: name,
          number: card.number,
          exp_month: card.expiryMonth,
          exp_year: card.expiryYear,
          cvc: card.cvc,
        },
        group.organisation?.id || '',
      )
      if (paymentMethod) {
        paymentRef.current = paymentMethod
        modal.current?.close()
      }
    }
    hideLoading()
  }, [card, showLoading, hideLoading, name, group.organisation?.id])

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      onClose?.(paymentRef.current)
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
        <H1 align="center" style={styles.iconTop}>
          {`💳`}
        </H1>
        <H1 align="center">{I18n.t('text.Add a card')}</H1>

        <TextInputWithLabel
          label={I18n.t('text.Name on card')}
          numberOfLines={1}
          placeholderTextColor={color.gray3}
          maxLength={80}
          onChangeText={setName}
          containerStyle={[styles.textField__container]}
          value={name}
          returnKeyType="next"
        />

        <CardField
          postalCodeEnabled={false}
          dangerouslyGetFullCardDetails={true}
          placeholders={{
            number: '4242 4242 4242 4242',
            postalCode: '12345',
            expiration: 'MM|YY',
          }}
          onCardChange={setCard}
          cardStyle={inputStyles}
          style={styles.cardField}
        />
        <Button.Full
          style={[
            {
              backgroundColor: color.accent,
            },
            styles.btn,
          ]}
          text={I18n.t('text.Done')}
          textStyle={[styles.cancel, { color: color.white }]}
          onPress={onPressAdd}
          disabled={!isValidInfo}
        />
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
  iconTop: {
    fontSize: 35,
    marginVertical: 10,
  },
  contentWrapper: {
    paddingTop: 40,
    marginHorizontal: 20,
    marginBottom: 36,
  },
  btn: { borderRadius: 10 },
  cancel: { fontWeight: '700', flex: 1 },
  cardField: {
    width: '100%',
    height: 50,
    marginBottom: 30,
  },
  textField__container: {
    marginBottom: 15,
    borderRadius: 7,
    marginTop: 45,
  },
})

const inputStyles: CardFieldInput.Styles = {
  borderWidth: 2,
  backgroundColor: '#FFFFFF',
  borderColor: '#B2B3B9',
  borderRadius: 8,
  fontSize: 17,
  fontFamily: 'Poppins-Regular',
  placeholderColor: '#A020F0',
  textColor: '#0000ff',
}

export default AddCardModal
