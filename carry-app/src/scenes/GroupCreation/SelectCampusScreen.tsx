import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import { H2, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { Constants, Styles } from '@shared/index'
import I18n from 'i18n-js'
import React, { useCallback, useState } from 'react'
import { FlatList, StyleSheet, TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'

type ParamProps = {
  isOnboarding?: boolean
}

type Props = StackScreenProps<{ SelectCampusScreen: ParamProps }, 'SelectCampusScreen'>

const SelectCampusScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const { isOnboarding = false } = props.route.params
  const campuses = useSelector<RootState, RootState['campuses']>(state => state.campuses)
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>()

  const handleContinuePress = useCallback(() => {
    if (!selectedCampus) {
      return
    }
    NavigationRoot.navigate(Constants.SCENES.GROUP.CREATE, {
      isOnboarding,
      campus: selectedCampus,
    })
  }, [isOnboarding, selectedCampus])

  const renderItem = useCallback(
    ({ item }: { item: App.Campus }) => {
      const { name, image } = item
      return (
        <TouchableOpacity
          onPress={() => setSelectedCampus(item.id)}
          style={[
            styles.item,
            {
              borderColor: color.middle,
              backgroundColor: color.middle,
            },
            selectedCampus === item.id && {
              borderColor: color.primary,
            },
          ]}>
          <Avatar source={{ uri: image }} size={40} style={styles.avatar} />
          <Text bold>{name}</Text>
        </TouchableOpacity>
      )
    },
    [color.middle, color.primary, selectedCampus],
  )

  return (
    <Container safe>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      <H2 bold style={styles.titleText} align="center">
        ⛪️ {I18n.t('text.which campus is this group part of')}
      </H2>
      <FlatList data={campuses} renderItem={renderItem} keyExtractor={item => item.id} />
      <BottomButton rounded disabled={selectedCampus == null} title={I18n.t('text.Continue')} onPress={handleContinuePress} />
    </Container>
  )
}

const styles = StyleSheet.create({
  titleText: {
    marginBottom: 40,
    marginHorizontal: 25,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 2,
    marginBottom: 15,
    marginHorizontal: 15,
    ...Styles.shadow2,
  },
  avatar: { marginRight: 10 },
})

export default SelectCampusScreen
