import { H1 } from '@components/Typography'
import { RootState } from '@dts/state'
import { CardType } from '@dts/stripe'
import useLoading from '@hooks/useLoading'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import Metrics from '@shared/Metrics'
import Stripe from '@shared/Stripe'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { InteractionManager, StyleSheet, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSelector } from 'react-redux'
import { isValidDate } from '../shared/Utils'
import Button from './Button'
import TextInputWithLabel from './TextInputWithLabel'

interface Props {
  onClose: (requireReload?: boolean) => void
  cardSelected?: CardType
}

const EditCardModal: React.FC<Props> = ({ onClose, cardSelected }) => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const insets = useSafeAreaInsets()
  const modal = useRef<Modalize>(null)
  const [name, setName] = useState(cardSelected ? cardSelected?.billing_details?.name || '' : '')
  const [expiredDate, setExpiredDate] = useState(`${cardSelected?.card.exp_month}/${(cardSelected?.card.exp_year || 100) % 100}`)
  const { landscape } = useScreenMode()

  const requireReload = useRef(false)

  const { showLoading, hideLoading } = useLoading()

  useEffect(() => {
    modal.current?.open()
  }, [])

  const isValidName = useMemo(() => (name || '').length > 0, [name])

  const isValidExpiredDate = useMemo(() => isValidDate(expiredDate), [expiredDate])

  const onPressAdd = useCallback(async () => {
    showLoading()
    if (isValidExpiredDate && isValidName && cardSelected?.id) {
      const expired = expiredDate.split('/')
      const month = Math.round(Number(expired[0]))
      const year = Math.round(Number(expired[1]))
      const paymentMethod = await Stripe.updateCard(
        cardSelected.id,
        {
          exp_month: month,
          exp_year: year,
          name,
        },
        group.organisation?.id || '',
      )
      if (paymentMethod) {
        requireReload.current = true
        modal.current?.close()
      }
    }
    hideLoading()
  }, [showLoading, hideLoading, isValidName, isValidExpiredDate, cardSelected, expiredDate, name, group.organisation?.id])

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      onClose?.(requireReload.current)
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
        <H1 align="center">{I18n.t('text.Update card')}</H1>

        <TextInputWithLabel
          label={I18n.t('text.Name on card')}
          numberOfLines={1}
          placeholderTextColor={color.gray3}
          maxLength={80}
          onChangeText={setName}
          containerStyle={[styles.textFieldContainer]}
          value={name}
          returnKeyType="next"
          error={!isValidName}
        />

        <TextInputWithLabel
          label={I18n.t('text.MMYY')}
          numberOfLines={1}
          placeholderTextColor={color.gray3}
          maxLength={80}
          onChangeText={setExpiredDate}
          containerStyle={[styles.textField]}
          value={expiredDate}
          returnKeyType="next"
          error={!isValidExpiredDate}
        />

        <Button.Full
          style={[
            {
              backgroundColor: color.accent,
            },
            styles.btn,
          ]}
          text={I18n.t('text.Save')}
          textStyle={[styles.cancel, { color: color.white }]}
          onPress={onPressAdd}
          disabled={!isValidExpiredDate || !isValidName}
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
  textFieldContainer: {
    marginBottom: 15,
    borderRadius: 7,
    marginTop: 45,
  },
  textField: {
    marginBottom: 15,
    borderRadius: 7,
  },
})

export default EditCardModal
