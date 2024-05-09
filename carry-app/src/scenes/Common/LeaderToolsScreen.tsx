import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import SettingItem from '@components/SettingItem'
import { RootState } from '@dts/state'
import useActionStepFeature from '@hooks/useActionStepFeature'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { Config, Constants, Firestore } from '@shared/index'
import { differenceInDays } from 'date-fns'
import I18n from 'i18n-js'
import React, { useMemo } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { useSelector } from 'react-redux'

// eslint-disable-next-line @typescript-eslint/ban-types
type ParamProps = {}

type Props = StackScreenProps<{ LeaderTools: ParamProps }, 'LeaderTools'>

const LeaderTools: React.FC<Props> = () => {
  const { color } = useTheme()
  const { showLoading, hideLoading } = useLoading()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const role = me.organisation?.role
  const shouldShowWeeklyReview = useMemo(
    () => group.created?.seconds && Math.abs(differenceInDays(group.created.seconds * 1000, Date.now())) >= 7,
    [group.created?.seconds],
  )
  const hasActionStepFeature = useActionStepFeature()
  return (
    <Container safe>
      <HeaderBar
        title={I18n.t('text.Leader tools with ic')}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
      />
      <View style={styles.settingWrapper}>
        <SettingItem
          icon="calendar"
          text={I18n.t('text.Schedule a new plan')}
          onPress={() =>
            NavigationRoot.push(Constants.SCENES.STUDY_PLAN.PICK_STUDY, {
              groupId: group.id,
            })
          }
        />
        {shouldShowWeeklyReview && (
          <SettingItem
            icon={require('@assets/icons/review.png')}
            text={I18n.t('text.Weekly review')}
            onPress={async () => {
              try {
                showLoading()
                const weeklyReviewData = await Firestore.Group.getWeeklyReview(group.id)
                hideLoading()
                NavigationRoot.push(Constants.SCENES.GROUP_ACTIONS.WEEKLY_REVIEW, {
                  weeklyReviewData,
                })
                // @ts-ignore
              } catch (e: Error) {
                hideLoading()
                toast.error(e.message)
              }
            }}
          />
        )}
        {hasActionStepFeature && (
          <SettingItem
            icon="check-square"
            text={I18n.t('text.Action steps')}
            onPress={() => NavigationRoot.navigate(Constants.SCENES.MODAL.ACTION_STEP_CREATION)}
          />
        )}
        {role && ['owner', 'admin', 'campus-leader', 'campus-user'].includes(role) ? (
          <SettingItem
            icon={require('@assets/icons/desktop.png')}
            text={I18n.t('text.Go to ministry dashboard')}
            onPress={() => Linking.openURL(Config.DASHBOARD_URL)}
          />
        ) : null}
      </View>
    </Container>
  )
}

const styles = StyleSheet.create({
  settingWrapper: {
    paddingHorizontal: 30,
    marginTop: 32,
  },
})

export default LeaderTools
