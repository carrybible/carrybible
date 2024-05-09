import { H3, Subheading } from '@components/Typography'
import Color from '@dts/color'
import useTheme from '@hooks/useTheme'
import Styles from '@shared/Styles'
import React from 'react'
import { View, StyleSheet, Image, ViewStyle, StyleProp, Platform, Pressable } from 'react-native'

const PreBuildBtn: React.FC<{
  icon: Element
  title: string
  description: string
  onPress: () => void
  colorIcon?: keyof Color
  customBottom?: any
  iconContainer?: any
  titleIcon?: any
  subTitle?: string
  style?: StyleProp<ViewStyle>
}> = ({ icon, title, description, onPress, colorIcon = 'black', customBottom, iconContainer, titleIcon, subTitle, style }) => {
  const { color } = useTheme()
  return (
    <>
      <Pressable
        style={({ pressed }) => [
          style,
          {
            marginHorizontal: 20,
            marginVertical: 10,
          },
          pressed && Platform.OS === 'ios'
            ? {
                opacity: 0.7,
              }
            : null,
        ]}
        onPress={onPress}
        android_ripple={{
          color: color.gray7,
        }}
      >
        <View style={s.container}>
          <View
            style={[s.icon, { backgroundColor: color.background }, color.id === 'light' ? Styles.shadow : Styles.shadowDark, iconContainer]}
          >
            {icon}
          </View>
          <View style={s.titleContainer}>
            <H3 bold style={s.title}>
              {title}
            </H3>
            {titleIcon ? <Image source={titleIcon} style={s.titleIcon} /> : null}
          </View>
          {subTitle ? (
            <Subheading color="gray4" style={s.subTitle}>
              {subTitle}
            </Subheading>
          ) : null}
          <Subheading color="gray">{description}</Subheading>
        </View>
      </Pressable>
      {customBottom}
    </>
  )
}

const s = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDEEF3',
    paddingHorizontal: 24,
    paddingVertical: 40,
    ...(Platform.OS === 'ios' ? Styles.shadow : {}),
  },
  title: {},
  icon: {
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: 19,
    marginBottom: 9,
  },
  titleIcon: {
    width: 25,
    height: 23,
    marginLeft: 8,
  },
  subTitle: {
    marginBottom: 5,
  },
})

export default PreBuildBtn
