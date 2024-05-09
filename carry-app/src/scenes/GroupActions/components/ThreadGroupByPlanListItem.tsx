import Avatar from '@components/Avatar'
import { H3, Text } from '@components/Typography'
import { RootState } from '@dts/state'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import { Styles } from '@shared/index'
import { add, format, isSameMonth } from 'date-fns'
import React, { useMemo } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export type ThreadGroupByPlanType = {
  plan: StudyPlan.GroupPlan
  hasUnread: boolean
}

interface Props {
  item: ThreadGroupByPlanType
  group: RootState['group']
}

const ThreadGroupByPlanListItem: React.FC<Props> = ({ item, group }) => {
  const { color } = useTheme()
  const handlePress = () => {
    NavigationRoot.navigate(Constants.SCENES.GROUP_ACTIONS.DISCUSSIONS_BY_PLAN, {
      plan: item.plan,
    })
  }

  const durationText = useMemo(() => {
    // @ts-ignore
    const startDate = item.plan.startDate.toDate()
    const endDate = add(startDate, { days: item.plan.duration })

    const formatDate = (date: Date, comparedDate?: Date) => {
      let formatString = 'do'
      if (!comparedDate || !isSameMonth(date, comparedDate)) {
        formatString = 'MMMM ' + formatString
      }

      return format(date, formatString)
    }

    return `${formatDate(startDate)} - ${formatDate(endDate, startDate)}`
  }, [item.plan.duration, item.plan.startDate])

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.wrapper,
        {
          borderColor: color.middle,
          backgroundColor: color.middle,
        },
        item.hasUnread && {
          borderColor: color.accent,
        },
      ]}>
      <Avatar source={{ uri: item.plan.featuredImage || group.image }} size={60} style={styles.avatar} />
      <View style={styles.info}>
        <H3 color="black2" numberOfLines={1} style={styles.name}>
          {item.plan.name}
        </H3>
        <Text color="gray">{durationText}</Text>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderWidth: 2,
    marginBottom: 15,
    marginHorizontal: 15,
    ...Styles.shadow2,
  },
  avatar: {
    marginRight: 15,
  },
  info: { flex: 1 },
  name: { marginBottom: 3 },
})

export default ThreadGroupByPlanListItem
