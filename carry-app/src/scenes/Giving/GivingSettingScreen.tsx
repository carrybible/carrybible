import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import SettingItem from '@components/SettingItem'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import I18n from 'i18n-js'
import React from 'react'
import { StyleSheet, View } from 'react-native'

const GivingSettingScreen: React.FC = () => {
  const { color } = useTheme()
  return (
    <Container safe>
      <HeaderBar
        title={`${I18n.t('text.Giving settings')} 💳`}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      <View style={styles.wrapper}>
        <SettingItem
          icon="credit-card"
          text={I18n.t('text.Saved cards')}
          onPress={() => {
            NavigationRoot.navigate(Constants.SCENES.GIVING.CARD_LIST)
          }}
        />
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 32, marginTop: 32 },
})

export default GivingSettingScreen
