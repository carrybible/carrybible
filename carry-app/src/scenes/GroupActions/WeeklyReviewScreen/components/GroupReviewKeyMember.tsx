import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'
import I18n from 'i18n-js'

import { RootState } from '@dts/state'
import { H1, H3 } from '@components/Typography'
import Avatar from '@components/Avatar'
import useTheme from '@hooks/useTheme'
import { Metrics } from '@shared/index'
import useScreenMode, { ScreenView } from '@hooks/useScreenMode'

type Props = {
  keyMemberIds: string[]
}

const GroupReviewKeyMember: React.FC<Props> = ({ keyMemberIds }) => {
  const { color } = useTheme()
  const { landscape } = useScreenMode()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  return (
    <View style={styles.wrapper}>
      <ScreenView scrollable={{ right: true, view: true }}>
        <View style={landscape ? styles.flex : styles.centerItems}>
          <H1 align="center" style={styles.headerTitle}>
            {I18n.t('text.This weeks most active members were')}
          </H1>
        </View>
        <View style={[styles.members, landscape ? styles.removeMergin : {}]}>
          {keyMemberIds
            .map(uid => group.channel?.state.members[uid]?.user)
            .filter(userInfo => !!userInfo)
            .map(userInfo => {
              // @ts-ignore
              const { image, name } = userInfo || {}
              if (!image || !name) {
                return null
              }
              return (
                <View style={styles.memberWrapper}>
                  <Avatar size={65} url={image} borderWidth={3} borderColor={color.whiteSmoke} touchable={false} />
                  <H1 style={styles.memberName}>{name}</H1>
                </View>
              )
            })}
          <H3 bold={false} color={'black2'} style={styles.bottomText}>
            {I18n.t('text.Dont worry only you can see these stats')}
          </H3>
        </View>
      </ScreenView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
  },
  bottomText: {
    marginBottom: 40,
    textAlign: 'center',
    alignSelf: 'center',
  },
  headerTitle: {
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: 'center',
    alignSelf: 'center',
  },
  memberName: {
    color: '#B8CCFF',
    marginLeft: 15,
    maxWidth: Metrics.screen.width - 150,
  },
  memberWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 35,
  },
  members: {
    flex: 1,
    marginTop: 50,
    paddingHorizontal: 20,
    alignItems: 'flex-start',
  },
  flex: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  centerItems: { alignItems: 'center', width: Metrics.screen.width },
  removeMergin: {
    marginTop: 0,
  },
})

export default GroupReviewKeyMember
