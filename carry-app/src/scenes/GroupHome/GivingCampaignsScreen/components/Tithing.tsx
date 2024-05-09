import Button from '@components/Button'
import { H3, Text } from '@components/Typography'
import { Tithing as TithingModel } from '@dts/tithing'
import useTheme from '@hooks/useTheme'
import Styles from '@shared/Styles'
import I18n from 'i18n-js'
import React, { FC } from 'react'
import { Image, LayoutChangeEvent, StyleProp, StyleSheet, View, ViewStyle } from 'react-native'

const Tithing: FC<{
  onLayout?: ((event: LayoutChangeEvent) => void) | undefined
  style?: StyleProp<ViewStyle>
  data: TithingModel
  orgImg?: string
  onPressGiveNow?: () => void
}> = ({ onLayout, style, data, orgImg, onPressGiveNow }) => {
  const { color, typography } = useTheme()

  return (
    <>
      <View
        onLayout={onLayout}
        style={[
          styles.container,
          { backgroundColor: color.background },
          color.id === 'light' ? Styles.shadow2 : styles.darkThemeShadow,
          style,
        ]}>
        <View style={styles.row}>
          <View style={[styles.row, styles.flex1]}>
            <Image style={styles.logoContainer} source={{ uri: orgImg }} />
            <View style={styles.contentContainer}>
              <H3>{data.name}</H3>
              <Text color="gray3" style={[styles.descText, { fontSize: typography.small }]}>
                {data.description}
              </Text>
            </View>
          </View>
        </View>
        <Button.Full
          style={[
            styles.button,
            {
              backgroundColor: color.accent,
            },
          ]}
          textStyle={[styles.buttonText, { color: color.white }]}
          text={I18n.t('text.Give now')}
          onPress={onPressGiveNow}
        />
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  button: {
    borderRadius: 10,
    marginTop: 24,
  },
  buttonText: {
    fontWeight: '700',
  },
  flex1: { flex: 1 },
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 16,
  },
  logoContainer: {
    width: 85,
    height: 85,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  darkThemeShadow: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 2,
  },
  contentContainer: {
    paddingLeft: 16,
    flex: 1,
  },
  descText: {
    flexWrap: 'wrap',
    marginTop: 2,
  },
})

export default Tithing
