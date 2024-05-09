/**
 * Image Picker Screen
 *
 * @format
 *
 */

import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'

import Container from '@components/Container'
import { Text } from '@components/Typography'
import { Metrics } from '@shared/index'
import CloseButton from '@components/CloseButton'
import Icon from '@components/Icon'
import useTheme from '@hooks/useTheme'
import UnsplashPage from './components/UnsplashPage'
import CameraPage from './components/CameraPage'
import { useNavigation } from '@react-navigation/native'
import { UnsplashImage } from '@shared/Unsplash'
import I18n from 'i18n-js'
import { StackNavigationProp } from '@react-navigation/stack'

const Tab = createMaterialTopTabNavigator()

interface Props {
  route: any
}

const Header = props => {
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  return (
    <View style={s.header}>
      <Text bold style={s.title}>
        {I18n.t('text.Select a photo')}
      </Text>
      <CloseButton
        onPress={() => {
          navigation.goBack()
          setTimeout(() => {
            if (props.route?.params.onClose) props.route.params.onClose()
          }, 250)
        }}
      />
    </View>
  )
}

const marginHorizontal = 60

const ImagePicker: React.FC<Props> = props => {
  const { color } = useTheme()
  const navigation = useNavigation<StackNavigationProp<any, any>>()

  function handleImageSelect(i: UnsplashImage) {
    if (props.route.params.onSelect) props.route.params.onSelect(i)
    navigation.goBack()
  }

  const Unsplash = React.useCallback(() => {
    return <UnsplashPage onImageSelect={handleImageSelect} />
  }, [])

  const Camera = React.useCallback(() => {
    return <CameraPage onImageSelect={handleImageSelect} />
  }, [])

  const left = useRef(new Animated.Value(0)).current
  const CustomTabBar = React.useCallback(({ state, descriptors, navigation }) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      Animated.spring(left, {
        toValue: (state.index * (Metrics.screen.width - marginHorizontal * 2)) / 2,
        bounciness: 0,
        useNativeDriver: false,
      }).start()
    }, [state.index])

    return (
      <View style={{ borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: `${color.gray5}99` }}>
        <View style={s.content}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const isFocused = state.index === index

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              })

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name)
              }
            }

            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={1}
                disabled={isFocused}
                onPress={onPress}
                // eslint-disable-next-line react-native/no-inline-styles
                style={[s.iconContainer, { opacity: isFocused ? 1 : 0.2 }]}
              >
                {options.tabBarIcon({ color: color.text })}
              </TouchableOpacity>
            )
          })}
          <View style={s.bottomTabLine}>
            <Animated.View style={[s.tabLine, { left: left, backgroundColor: color.accent }]} />
          </View>
        </View>
      </View>
    )
  }, [])

  return (
    <Container safe>
      <View style={s.flex}>
        <Header />
        <Tab.Navigator sceneContainerStyle={{ backgroundColor: color.background }} tabBar={props => <CustomTabBar {...props} />}>
          <Tab.Screen
            name="Splash"
            options={{
              tabBarIcon: ({ color }) => <Icon source="grid" color={color} />,
            }}
            component={Unsplash}
          />
          <Tab.Screen
            name="Camera"
            options={{
              tabBarIcon: ({ color }) => <Icon source="camera" color={color} />,
            }}
            component={Camera}
          />
        </Tab.Navigator>
      </View>
    </Container>
  )
}

ImagePicker.defaultProps = {}

const s = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: { flexDirection: 'row', marginHorizontal: marginHorizontal },
  iconContainer: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  bottomTabLine: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    height: 3,
  },
  tabLine: {
    height: 3,
    width: '50%',
    position: 'absolute',
    bottom: 0,
    borderRadius: 2,
  },
  header: { height: Metrics.header.height, flexDirection: 'row', alignItems: 'center' },
  title: { textAlign: 'center', flex: 1 },
})

export default ImagePicker
