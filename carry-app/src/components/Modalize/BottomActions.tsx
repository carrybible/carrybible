/**
 * Bottom Actions Modal
 *
 * @format
 *
 */

import Icon from '@components/Icon'
import ModalHeader from '@components/ModalHeader'
import { Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import React, { useImperativeHandle, useRef } from 'react'
import { InteractionManager, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Props {
  data?: any
  headerStyle?: any
  HeaderComponent?: any
  actions?: any
  onActionPress?: (action: string, data?: any) => void
}

type Ref = {
  open: (data: any) => void
}

const Button = ({ title, color, icon, size, onPress }) => {
  return (
    <TouchableOpacity style={s.buttonContainer} onPress={onPress}>
      <Icon source={icon} size={size || 18} color={color} />
      <Text color={color} style={[s.buttonText, Platform.OS === 'android' ? { fontWeight: '700' } : {}]}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

const BottomActions: React.ForwardRefRenderFunction<Ref, Props> = (props, ref) => {
  const { actions, headerStyle } = props
  const insets = useSafeAreaInsets()
  const { color } = useTheme()
  const modal = useRef<Modalize>(null)
  const action = useRef<string>()
  const data = useRef()

  useImperativeHandle(ref, () => ({
    open: openModal,
  }))

  const openModal = d => {
    if (modal.current) {
      data.current = d
      modal.current.open()
    }
  }

  const renderItem = React.useCallback(
    ({ item }) => {
      const chooseAction = (a: string) => {
        action.current = a
        if (modal.current) {
          modal.current.close()
          InteractionManager.runAfterInteractions(() => {
            if (props.onActionPress) props.onActionPress(a, data.current)
          })
        }
      }

      return (
        <Button
          title={item.title}
          color={item.color || 'text'}
          icon={item.icon}
          size={item.size}
          onPress={() => chooseAction(item.action)}
        />
      )
    },
    [props],
  )

  const getItemLayout = React.useCallback((_data, index) => ({ length: 40, offset: 40 * index, index }), [])

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      modalStyle={{
        ...s.container,
        backgroundColor: color.background,
      }}
      closeOnOverlayTap
      useNativeDriver
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      HeaderComponent={
        <ModalHeader
          handlePosition="inside"
          TitleComponent={() => !!props.HeaderComponent && props.HeaderComponent(data.current)}
          style={headerStyle}
        />
      }
      FooterComponent={<View style={{ height: insets.bottom }} />}
      flatListProps={{
        data: typeof actions === 'function' ? actions() : actions,
        renderItem,
        contentContainerStyle: { paddingTop: 5 },
        keyExtractor: (_item, idx) => idx.toString(),
        getItemLayout,
      }}
    />
  )
}

const s = StyleSheet.create({
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    paddingHorizontal: Metrics.insets.horizontal,
  },
  buttonText: {
    fontWeight: '700',
    paddingHorizontal: Metrics.insets.horizontal,
  },
})

export default React.forwardRef(BottomActions)
