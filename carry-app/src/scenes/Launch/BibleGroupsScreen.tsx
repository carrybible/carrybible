import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import EmptyData from '@components/EmptyData'
import HeaderBar from '@components/HeaderBar'
import { LoadingErrorIndicator, LoadingIndicator } from '@components/StreamIO'
import ChannelPreview from '@components/StreamIO/ChannelPreview'
import { RootState } from '@dts/state'
import useOrg from '@hooks/useOrg'
import useTheme from '@hooks/useTheme'
import { useNavigation } from '@react-navigation/core'
import { StackNavigationProp } from '@react-navigation/stack'
import { useNavigateToCreateGroupScreen } from '@scenes/GroupCreation/CreateGroupScreen'
import { RolesCanCreateGroup } from '@shared/Constants'
import { Constants, StreamIO } from '@shared/index'
import I18n from 'i18n-js'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import { ChannelList, Chat } from 'stream-chat-react-native'
import { NavigationRoot } from '../root'

const BibleGroups = () => {
  const navigation = useNavigation<StackNavigationProp<any, any>>()
  const isFirstScreen = navigation.getState().index === 0
  const { color } = useTheme()
  const { org } = useOrg()

  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const { ids } = useSelector<RootState, RootState['groups']>(state => state.groups)

  const navigateToCreateGroup = useNavigateToCreateGroupScreen()

  const filters = useMemo<React.ComponentProps<typeof ChannelList>['filters']>(() => {
    const condition: React.ComponentProps<typeof ChannelList>['filters'] = {
      type: 'messaging',
      members: { $in: [me.uid] },
    }
    if (ids?.length > 0) {
      condition.id = { $in: ids }
    }
    return condition
  }, [ids, me.uid])

  const handleCreatingGroup = () => {
    requestAnimationFrame(() => {
      navigateToCreateGroup()
    })
  }

  const handleEnterGroupLink = () => {
    requestAnimationFrame(() => {
      NavigationRoot.navigate(Constants.SCENES.ONBOARDING.JOIN_A_GROUP)
    })
  }

  return (
    <Container safe forceInset={{ top: true, bottom: false }}>
      <HeaderBar
        title={I18n.t('text.Groups')}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={
          !isFirstScreen
            ? () => {
                NavigationRoot.pop()
              }
            : () => {
                NavigationRoot.navigate(Constants.SCENES.ACCOUNT_SETTINGS)
              }
        }
      />
      <View style={styles.flex1}>
        {/*@ts-ignore*/}
        <Chat client={StreamIO.client} style={color.chat} i18nInstance={StreamIO.streamI18n}>
          <ChannelList
            filters={filters}
            options={{
              limit: 30,
              state: true,
              watch: true,
              presence: true,
            }}
            // @ts-ignore
            Preview={ChannelPreview}
            HeaderNetworkDownIndicator={() => null}
            EmptyStateIndicator={() => (
              <EmptyData
                type="textIcon"
                text={I18n.t('text.No groups')}
                subText={I18n.t('text.Not a member of any group')}
                image={'🚪'}
                style={styles.emptyData}
                iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
              />
            )}
            LoadingErrorIndicator={LoadingErrorIndicator}
            LoadingIndicator={LoadingIndicator}
            additionalFlatListProps={{
              ListHeaderComponent: () => <View style={styles.headerList} />,
              showsVerticalScrollIndicator: false,
            }}
          />
        </Chat>
      </View>
      <View style={styles.buttonContainer}>
        <BottomButton title={I18n.t('text.Join a group')} rounded onPress={handleEnterGroupLink} />
        {(RolesCanCreateGroup.includes(me.organisation?.role || '') || org?.newGroupPermission === 'member') && (
          <BottomButton
            textColor="accent"
            title={I18n.t('text.Create a group')}
            rounded
            onPress={handleCreatingGroup}
            style={[styles.bottomBtn, { backgroundColor: color.background, borderColor: `${color.accent}70` }]}
          />
        )}
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  headerList: {
    height: 10,
  },
  bottomBtn: {
    borderWidth: 2,
    borderTopWidth: 2,
    marginTop: 5,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  emptyData: { flexGrow: 0, marginTop: '35%' },
})

export default BibleGroups
