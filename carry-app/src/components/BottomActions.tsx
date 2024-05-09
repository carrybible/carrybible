/**
 * Bottom Actions Modal
 *
 * @format
 *
 */

import ModalHeader from '@components/ModalHeader'
import { Text } from '@components/Typography'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import { Metrics } from '@shared/index'
import React, { useEffect, useRef } from 'react'
import { InteractionManager, Platform, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Modalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Icon from './Icon'

interface Props {
  navigation: any
  route: any
}

const Button = ({ title, color, icon, size, onPress }) => {
  return (
    <TouchableOpacity style={s.buttonContainer} onPress={onPress}>
      <Icon source={icon} size={size || 18} color={color} />
      <Text color={color} style={[s.buttonText, Platform.OS === 'android' ? s.fontSize : {}]}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

const BottomActions = (props: Props) => {
  const { item, actions, handleActions, headerStyle, headerComponent } = props.route.params
  const insets = useSafeAreaInsets()
  const { color } = useTheme()
  const modal = useRef<Modalize>(null)
  const action = useRef<string>()
  const choosenAction = useRef<any>()
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const { landscape } = useScreenMode()

  useEffect(() => {
    openModal()
  }, [])

  const onClosed = () => {
    InteractionManager.runAfterInteractions(() => {
      navigation.pop()
      if (action && handleActions) {
        handleActions(action.current, item, choosenAction.current)
      }
    })
  }

  const chooseAction = (a: string, value: any) => {
    action.current = a
    choosenAction.current = value
    if (modal.current) {
      modal.current.close()
    }
  }

  const openModal = () => {
    if (modal.current) {
      modal.current.open()
    }
  }

  const renderItem = ({ item }) => {
    return (
      <Button
        title={item.title}
        color={item.color || 'text'}
        icon={item.icon}
        size={item.size}
        onPress={() => chooseAction(item.action, item)}
      />
    )
  }

  const getItemLayout = (_data, index) => ({ length: 40, offset: 40 * index, index })

  return (
    <Modalize
      ref={modal}
      adjustToContentHeight
      onClosed={onClosed}
      modalStyle={[
        {
          ...s.container,
          backgroundColor: color.background,
        },
        landscape ? s.half : s.full,
      ]}
      useNativeDriver
      handlePosition="inside"
      handleStyle={{ backgroundColor: color.gray4 }}
      HeaderComponent={<ModalHeader handlePosition="inside" TitleComponent={headerComponent} style={headerStyle} />}
      FooterComponent={<View style={{ height: insets.bottom }} />}
      flatListProps={{
        data: actions,
        renderItem,
        contentContainerStyle: { paddingTop: 5 },
        keyExtractor: (item, idx) => idx.toString(),
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
  full: {
    width: '100%',
  },
  half: {
    width: '50%',
    marginLeft: '25%',
  },
  fontSize: { fontWeight: '700' },
})

export default BottomActions
