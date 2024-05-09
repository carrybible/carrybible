import Avatar from '@components/Avatar'
import BottomButton from '@components/BottomButton'
import { H2, Text, Title } from '@components/Typography'
import { GroupActionsType } from '@dts/groupAction'
import { RootState } from '@dts/state'

import useTheme from '@hooks/useTheme'
import { FollowUpAction } from '@scenes/GroupActions/FollowUpActivity'

import Metrics from '@shared/Metrics'

import I18n from 'i18n-js'
import React, { FC, useMemo } from 'react'
import { Animated, ScrollView, StyleSheet, View, ViewStyle } from 'react-native'
import { useSelector } from 'react-redux'

export type GroupActionAttachment = {
  type: 'groupAction'
  groupActionType: GroupActionsType
  groupId: string
  id: string
  content: string
}

export type GroupActionInfoType = NonNullable<RootState['groupActions']['data']>[number]

export type Props = {
  info: FollowUpAction
  onContinue: () => void
}

const FollowUpHighlightAction: FC<Props> = ({ info, onContinue }) => {
  return (
    <>
      <Animated.View style={styles.container}>
        <GroupActionContentViewer type={info.type} creatorInfo={info.creatorInfo} content={info.content} requestText={info?.question} />
      </Animated.View>
      <BottomButton title={I18n.t('text.Continue')} rounded onPress={onContinue} />
    </>
  )
}

export type ActionContentProps = {
  type?: 'action'
  content?: string
  creatorInfo: GroupActionInfoType['creatorInfo']
  isRenderInChat?: boolean
  style?: ViewStyle
  requestText?: string
}

export const GroupActionContentViewer: FC<ActionContentProps> = ({
  type,
  content,
  creatorInfo,
  isRenderInChat = false,
  style,
  requestText,
}) => {
  const { color } = useTheme()
  return (
    <View
      style={[
        styles.contentScrollView,
        {
          backgroundColor: color.id === 'light' ? color.white : color.black,
        },
        style,
      ]}>
      <ScrollView bounces={false} showsVerticalScrollIndicator={false} contentContainerStyle={styles.viewerWrapper}>
        <View style={styles.premiumIconWrapper}>
          <View style={styles.flex1} />
        </View>
        <View style={styles.contentWrapper}>
          <TitleDetail type={type} creatorInfo={creatorInfo} requestText={requestText} />
          <Avatar url={creatorInfo.image} size={135} style={[styles.avatar, { backgroundColor: color.whiteSmoke }]} touchable={false} />
          <Text color="gray8" align="center" style={styles.contentText} numberOfLines={isRenderInChat ? 5 : undefined}>
            {content}
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const TitleDetail = ({
  creatorInfo,
  requestText,
}: {
  type?: string
  creatorInfo: GroupActionInfoType['creatorInfo']
  requestText?: string
}) => {
  const me = useSelector<RootState, RootState['me']>(state => state.me)

  const question = useMemo(() => {
    const texts = requestText?.split('{{nameValue}}')
    return (
      <H2 bold align="center" style={styles.titleText}>
        {texts?.[0] || ''}
        <H2 bold color="accent" align="center" style={styles.titleText}>
          {creatorInfo?.name}
        </H2>
        {texts?.[1] || ''}
      </H2>
    )
  }, [creatorInfo, me, requestText])

  return (
    <View style={styles.titleWrapper}>
      <Title style={styles.iconText}>🙌</Title>
      {question}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: Metrics.safeArea.bottom,
  },
  viewerWrapper: {
    paddingTop: Metrics.insets.horizontal * 2,
    paddingHorizontal: Metrics.insets.horizontal,
    alignItems: 'center',
  },
  premiumIconWrapper: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  avatar: {
    marginBottom: 25,
    height: 145,
    width: 145,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    marginHorizontal: 40,
  },
  titleWrapper: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconText: {
    marginBottom: 23,
    fontSize: 36,
  },
  titleText: {
    marginHorizontal: 40,
  },
  contentScrollView: {
    flex: 1,
    borderRadius: 20,
    marginBottom: 10,
    paddingBottom: 20,
  },
})

export default FollowUpHighlightAction
