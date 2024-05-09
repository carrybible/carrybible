import BottomButton from '@components/BottomButton'
import Container from '@components/Container'
import EmptyData from '@components/EmptyData'
import HeaderBar from '@components/HeaderBar'
import { H3, Subheading, Text } from '@components/Typography'
import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { NavigationRoot } from '@scenes/root'
import { useAnalytic } from '@shared/Analytics'
import Constants from '@shared/Constants'
import I18n from '@shared/I18n'
import { Firestore, Styles } from '@shared/index'
import Metrics from '@shared/Metrics'
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import { FlatList, Image, StyleSheet, TouchableOpacity, View } from 'react-native'

import BuilderTitle from '../components/BuilderTitle'
import { useMainBuilderMoreOption, usePlanData, usePublishAndApplyPlan } from './hook'

type ParamProps = {
  plan?: StudyPlan.UserPlan // if not specify means not logged in -> create local draft in onboarding redux
  draft?: StudyPlan.UserPlan
}

type Props = StackScreenProps<{ MainBuilderScreen: ParamProps }, 'MainBuilderScreen'>

const MainBuilderScreen: React.FC<Props> = props => {
  const { plan: defaultPlan, draft } = props.route.params || {}

  const Analytics = useAnalytic()
  const { color, typography } = useTheme()

  useEffect(() => {
    Analytics.event(Constants.EVENTS.ADVANCED_GOAL.VIEW_STUDY_BUILDER)
  }, [Analytics])

  const listRef = useRef<FlatList>(null)
  const { plan, updatePlan, updateBlock, deleteBlock, updateTitle } = usePlanData({
    defaultPlan,
    onAddedNewBlock: useCallback(() => {
      listRef.current?.scrollToEnd()
    }, []),
  })

  useEffect(() => {
    const updateDraftTitle = () => {
      console.log('update title')
      if (plan?.name && draft?.id) Firestore.Study.updateAdvancedStudyDraft({ ...draft, name: plan.name })
    }
    updateDraftTitle()
  }, [draft, plan.name, plan.pace])

  const { onPress: handleOpenMoreOption } = useMainBuilderMoreOption({
    plan,
    headerComponent: () => <Text style={s.headerMoreOptions}>{I18n.t('text.Menu')}</Text>,
    updatePlan,
  })

  const { handlePublishGoal } = usePublishAndApplyPlan({ plan, updatePlan })

  const onPressPublish = async () => {
    NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_CHOOSE_START_DATE, {
      onDateSelected: (publishDate: Date) => {
        handlePublishGoal(publishDate)
      },
    })
  }

  const AddButtons = useMemo(() => {
    const comps: any = []
    if (plan.blocks.length === 0 || plan.pace === 'day') {
      comps.push('day')
    }
    if (plan.blocks.length === 0 || plan.pace === 'week') {
      comps.push('week')
    }
    return (
      <>
        {comps.map(pace => (
          <BottomButton
            key={pace}
            title={I18n.t(`text. Add ${pace}`)}
            rounded
            secondary
            onPress={() => {
              updatePlan({ pace })
              Analytics.event(Constants.EVENTS.ADVANCED_GOAL.CREATE_NEW_STUDY_BLOCK)
              NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_BUILDER, {
                index: plan?.blocks?.length || 0,
                onUpdateBlock: newBlock => updateBlock(newBlock, plan.blocks.length || 0),
                onDeleteBlock: () => {
                  NavigationRoot.pop()
                },
                pace: pace,
              })
            }}
          />
        ))}
      </>
    )
  }, [Analytics, plan.blocks.length, plan.pace, updateBlock, updatePlan])

  return (
    <Container safe forceInset={{ bottom: false, top: true }}>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          NavigationRoot.pop()
        }}
        iconRight={'more-vertical'}
        colorRight={color.text}
        iconRightSize={22}
        onPressRight={handleOpenMoreOption}
      />

      <View style={s.titleWrapper}>
        <Image source={plan.featuredImage ?? require('@assets/images/img-no-plan.png')} style={s.planImage} />
        <BuilderTitle
          onUpdateTitle={updateTitle}
          initTitle={plan.name}
          placeholder={I18n.t('text.Enter study name')}
          fontSize={typography.h1}
        />
      </View>

      <View style={[s.wrapper, { backgroundColor: color.id === 'light' ? color.whiteSmoke : color.middle }]}>
        <FlatList
          ref={listRef}
          alwaysBounceVertical={false}
          contentContainerStyle={s.list}
          data={plan.blocks}
          renderItem={({ item, index }: { item: StudyPlan.Block; index: number }) => (
            <BlockItem
              item={item}
              index={index}
              onUpdateBlock={newBlock => updateBlock(newBlock, index)}
              onDeleteBlock={() => deleteBlock(index)}
              pace={plan.pace}
            />
          )}
          keyExtractor={(item, index) => `${index}`}
          ListEmptyComponent={
            <EmptyData
              style={s.emptyWrapper}
              text={I18n.t('text.Tap Add day to start')}
              textStyle={[s.emptyText, { color: color.gray4, fontSize: typography.subhead }]}
              image={require('@assets/images/empty_study.png')}
              imgStyle={s.emptyImg}
            />
          }
        />
        {AddButtons}
        <BottomButton title={I18n.t('text.Publish plan')} rounded onPress={onPressPublish} disabled={(plan?.blocks?.length || 0) === 0} />
      </View>
    </Container>
  )
}

const BlockItem = ({
  item,
  index,
  onUpdateBlock,
  onDeleteBlock,
  pace = 'day',
}: {
  item: StudyPlan.Block
  index: number
  onUpdateBlock: (newBlock: StudyPlan.Block) => void
  onDeleteBlock: () => void
  pace: 'week' | 'day'
}) => {
  const { color } = useTheme()

  return (
    <TouchableOpacity
      style={[s.blockItem, { backgroundColor: color.background }, color.id === 'light' ? Styles.shadow2 : Styles.shadowDark]}
      onPress={() => {
        NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.ADVANCED_STUDY_BUILDER, {
          index,
          name: item.name,
          activities: item.activities,
          onUpdateBlock,
          onDeleteBlock,
          pace,
        })
      }}>
      <H3>{`${I18n.t(`text.${pace.charAt(0).toUpperCase() + pace.slice(1)}`)} ${index + 1}`}</H3>
      <Subheading color="gray2">{item.name || I18n.t(`text.Untitled ${pace}`)}</Subheading>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingBottom: Metrics.safeArea.bottom,
  },
  emptyWrapper: {
    justifyContent: 'center',
    transform: [{ translateY: -80 }],
  },
  emptyText: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyImg: {
    width: 100,
    height: 100,
  },
  blockItem: {
    borderRadius: 10,
    padding: Metrics.insets.horizontal,
    marginHorizontal: Metrics.insets.horizontal,
    marginTop: 10,
  },
  list: {
    paddingBottom: 10,
  },
  titleWrapper: {
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  planImage: {
    width: 44,
    height: 44,
    marginLeft: 10,
  },
  headerMoreOptions: {
    fontWeight: '700',
    maxHeight: 50,
  },
})

export default MainBuilderScreen
