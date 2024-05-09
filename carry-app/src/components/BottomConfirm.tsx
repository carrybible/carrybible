/**
 * Bottom Actions Modal
 *
 * @format
 *
 */

import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, InteractionManager } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { Metrics } from '@shared/index'
import { useNavigation } from '@react-navigation/native'
import useTheme from '@hooks/useTheme'
import { StackNavigationProp } from '@react-navigation/stack'
import { Text, H2 } from '@components/Typography'
import Button from '@components/Button'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  navigation: any
  route: any
}

const BottomConfirm = (props: Props) => {
  const { titleIcon, titleIconText, title, description, customContent, confirmTitle, cancelTitle, onConfirm, onCancel, confirmColor } =
    props.route.params
  const insets = useSafeAreaInsets()
  const { color } = useTheme()
  const confirmed = React.useRef(false)
  const modal = useRef<Modalize>(null)
  const navigation = useNavigation<StackNavigationProp<any, any>>()

  useEffect(() => {
    openModal()
  }, [])

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      navigation.pop()
      if (confirmed.current && onConfirm) onConfirm()
      else if (onCancel) onCancel()
    })
  }

  const chooseAction = () => {
    if (modal.current) {
      confirmed.current = true
      modal.current.close()
    }
  }

  const openModal = () => {
    if (modal.current) {
      modal.current.open()
    }
  }

  return (
    <Modalize
      ref={modal}
      onClosed={onClosed}
      disableScrollIfPossible
      adjustToContentHeight
      modalStyle={{
        ...s.container,
        backgroundColor: color.background,
      }}
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      FooterComponent={<View style={{ height: insets.bottom }} />}
    >
      <View style={s.content}>
        {titleIconText ? <Text style={s.titleIcon}>{titleIconText}</Text> : null}
        {titleIcon}
        <H2 bold style={s.title}>
          {title}
        </H2>
        <Text color="gray" style={s.desc}>
          {description}
          {customContent}
        </Text>

        <Button.Full
          style={[
            {
              backgroundColor: confirmColor || color.accent,
            },
            s.btnFull,
          ]}
          text={confirmTitle}
          textStyle={[s.textFull, { color: color.white }]}
          onPress={chooseAction}
        />
        <Button.Full
          style={s.cancelBtn}
          text={cancelTitle}
          textStyle={[s.textCancel, { color: color.gray }]}
          onPress={() => {
            if (modal.current) {
              modal.current.close()
            }
          }}
        />
      </View>
    </Modalize>
  )
}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: { marginVertical: Metrics.insets.vertical, alignItems: 'center' },
  title: { marginVertical: 20, textAlign: 'center' },
  desc: { marginHorizontal: Metrics.insets.horizontal, textAlign: 'center', marginBottom: 15 },
  btnFull: { borderRadius: 10, marginHorizontal: Metrics.insets.horizontal, marginVertical: Metrics.insets.vertical },
  textFull: { fontWeight: '700', flex: 1 },
  cancelBtn: {
    borderRadius: 10,
    marginHorizontal: Metrics.insets.horizontal,
  },
  textCancel: { fontWeight: '500', flex: 1 },
  titleIcon: { fontSize: 49, marginTop: 30, marginBottom: -10 },
})

export default BottomConfirm
