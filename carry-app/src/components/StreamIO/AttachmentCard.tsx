/**
 * Attachment Card
 *
 * @format
 *
 */

import Icon from '@components/Icon'
import { Footnote, Subheading } from '@components/Typography'
// import Constants from '@shared/Constants'
// import { useChannelContext } from 'stream-chat-react-native-core'
import { RootState } from '@dts/state'
import useTheme from '@hooks/useTheme'
// import { NavigationRoot } from '@scenes/root'
import BibleFormatter from '@shared/BibleFormatter'
import I18n from 'i18n-js'
import React, { useEffect, useState } from 'react'
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native'
import { useSelector } from 'react-redux'

interface Props {
  type: string
  rootId?: string
  rootIdStr?: string
  osis?: string
  goal?: any
  period?: any
  question?: string
  onlyGoal?: boolean
  title_link?: string
  title?: string
  text?: string
}

const AttachmentCard: React.FC<Props> = props => {
  const { color } = useTheme()

  // const ch = useChannelContext()
  const reading = useSelector<any, RootState['reading']>(s => s.reading)
  const [attachment, setAttachment] = useState<any>({ text: '', title: '', translation: reading.translation?.abbr.toUpperCase() })

  function handleGoalPress() {
    // TODO: Implement again this logic
    // NavigationRoot.navigate(Constants.SCREENS.GOAL.READING, {
    //   goal: props.goal,
    //   period: props.period,
    //   groupId: ch.channel?.id,
    //   groupName: ch.channel?.data?.name,
    //   skipNavigateToGoalPreview: true,
    // })
  }

  useEffect(() => {
    let mounted = true
    const getNewBibleData = async () => {
      try {
        setAttachment({
          title: props.osis || '-',
          translation: `(${reading.translation?.abbr.toUpperCase()})`,
          passages: props.text || [],
        })
      } catch (e) {
        devWarn('AttachentCard', e)
      }
    }
    if (props.type === 'bible') {
      try {
        BibleFormatter.rootIdStrToBibleText(props.rootIdStr as string).then(([t]) => {
          if (mounted)
            setAttachment({
              text: t,
              title: props.osis || '-',
              translation: `(${reading.translation?.abbr.toUpperCase()})`,
            })
        })
      } catch (e) {
        devWarn('AttachentCard', e)
      }
    } else {
      if (mounted) getNewBibleData()
    }

    return () => {
      mounted = true
    }
  }, [props.osis, props.rootIdStr, props?.text, props.type, reading.translation?.abbr])

  if (props.type === 'bible')
    return (
      <View
        style={[s.verse__container, { backgroundColor: `${color.background}55`, borderColor: `${color.text}33` }]}
        // onPress={handleVersePress}
      >
        <View style={[s.verse__header, { borderBottomColor: `${color.text}33` }]}>
          <View style={[s.icon, { backgroundColor: color.orange }]}>
            <Icon source="book" size={14} color={color.white} />
          </View>
          <View>
            <Subheading bold>{attachment.title}</Subheading>
            <Footnote style={s.subtitle}>{attachment.translation}</Footnote>
          </View>
        </View>
        <Subheading style={s.italic}>{attachment.text}</Subheading>
      </View>
    )

  if (props.type === 'new-bible') {
    devLog('attachment', attachment)
    return (
      <View
        style={[s.verse__container, { backgroundColor: `${color.background}55`, borderColor: `${color.text}33` }]}
        // onPress={handleVersePress}
      >
        <View style={[s.verse__header, { borderBottomColor: `${color.text}33` }]}>
          <View style={[s.icon, { backgroundColor: color.orange }]}>
            <Icon source="book" size={14} color={color.white} />
          </View>
          <View>
            <Subheading bold>{attachment.title}</Subheading>
            <Footnote style={s.subtitle}>{attachment.translation}</Footnote>
          </View>
        </View>
        {props.texts?.length ? props.texts.map(p => <Footnote style={s.italic}>{p}</Footnote>) : null}
      </View>
    )
  }

  if (props.type === 'goal') {
    const goal = props.goal
    const period = props.period

    if (goal.studyType === 'advanced') return null

    return (
      <TouchableOpacity
        style={[
          s.study__container,
          // eslint-disable-next-line react-native/no-inline-styles
          { marginTop: props.onlyGoal ? 10 : 0, backgroundColor: `${color.background}55`, borderColor: `${color.text}33` },
        ]}
        onPress={handleGoalPress}>
        <View style={[s.icon, { backgroundColor: color.accent }]}>
          <Icon source="flag" size={14} color={color.white} />
        </View>
        <View>
          <Subheading bold>{BibleFormatter.toOsis(period?.reading, 'full')}</Subheading>
          <Footnote style={s.subtitle}>{`${I18n.t('text.Question')} ${goal.questions?.findIndex(q => q === props.question) + 1}`}</Footnote>
        </View>
      </TouchableOpacity>
    )
  }

  if (props?.title_link) {
    return (
      <TouchableOpacity
        style={[
          s.study__container,
          // eslint-disable-next-line react-native/no-inline-styles
          { marginTop: props.onlyGoal ? 10 : 0, backgroundColor: `${color.background}55`, borderColor: `${color.text}33` },
        ]}
        onPress={() => {
          Linking.openURL(props.title_link || '')
        }}>
        <View>
          <Subheading bold>{props.title}</Subheading>
          <Footnote style={s.subtitle}>{props.text}</Footnote>
        </View>
      </TouchableOpacity>
    )
  }

  return null
}

const s = StyleSheet.create({
  verse__container: {
    backgroundColor: '#FFFFFF33',
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 8,
    borderRadius: 10,
    maxWidth: 234,
    minHeight: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  verse__header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 5,
    marginBottom: 8,
  },
  study__container: {
    backgroundColor: '#FFFFFF33',
    marginHorizontal: 10,
    marginBottom: 10,
    padding: 8,
    maxWidth: 234,
    minWidth: 200,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  icon: {
    padding: 5,
    borderRadius: 20,
    marginRight: 8,
  },
  subtitle: {
    opacity: 0.8,
    maxHeight: 150,
  },
  italic: { fontStyle: 'italic' },
})

export default AttachmentCard
