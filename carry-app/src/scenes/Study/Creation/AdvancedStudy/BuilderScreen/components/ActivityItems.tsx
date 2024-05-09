import { Subheading, Title } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import I18n from 'i18n-js'
import React from 'react'
import { View, StyleSheet } from 'react-native'

export const PassageItem: React.FC<{ item: StudyPlan.Activity }> = ({ item }) => {
  const activityItem = item as StudyPlan.PassageAct
  return (
    <CommonItem
      text={`${activityItem.chapter?.bookName} ${activityItem?.chapter?.chapterNumber}${
        activityItem.verseRange ? `: ${activityItem.verseRange}` : ''
      }`}
      iconColor="#CDF1E8"
      iconText={'📖'}
    />
  )
}

export const QuestionItem: React.FC<{ item: StudyPlan.Activity }> = ({ item }) => {
  const activityItem = item as StudyPlan.QuestionAct
  return <CommonItem text={activityItem.question} iconColor="#EEC5FE" iconText={'💬'} />
}

export const TextItem: React.FC<{ item: StudyPlan.Activity }> = ({ item }) => {
  const activityItem = item as StudyPlan.TextAct
  return <CommonItem text={activityItem.title} iconColor="#EFCEDD" iconText={'📝'} />
}

export const VideoItem: React.FC<{ item: StudyPlan.Activity }> = ({ item }) => {
  const activityItem = item as StudyPlan.VideoAct
  return <CommonItem text={activityItem.title} iconColor="#FBD3AF" iconText={'🎥'} />
}

export const ActionItem: React.FC<{ item: StudyPlan.Activity }> = ({ item }) => {
  const activityItem = item as StudyPlan.ActionAct
  return (
    <CommonItem
      text={activityItem.text ?? (activityItem.actionType === 'gratitude' ? I18n.t('text.Gratitude prompt') : I18n.t('text.Prayer prompt'))}
      iconColor="#EFEECE"
      iconText={activityItem.actionType === 'gratitude' ? '🎉' : '🙏'}
    />
  )
}

const CommonItem = ({ iconText, text, iconColor }: { iconText: string; iconColor: string; text: string }) => {
  return (
    <View style={styles.wrapper}>
      <View style={[styles.iconWrapper, { backgroundColor: iconColor }]}>
        <Title style={styles.iconText}>{iconText}</Title>
      </View>
      <Subheading numberOfLines={2} style={styles.text}>
        {text}
      </Subheading>
    </View>
  )
}

const styles = StyleSheet.create({
  iconWrapper: {
    marginRight: 10,
    width: 35,
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  wrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
    textAlign: 'center',
  },
  text: {
    flex: 1,
  },
})
