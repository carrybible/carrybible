import Loading from '@components/Loading'
import { StudyPlan } from '@dts/study'
import { NavigationRoot } from '@scenes/root'
import { Metrics } from '@shared/index'
import React, { useContext, useRef, useState } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'
import { StudyPreviewContext } from '../StudyPreviewScreen'
import PreviewAdvancedItem from './StudyPreviewItem'
import Constants from '@shared/Constants'
import Firestore from '@shared/Firestore'
import useLoading from '@hooks/useLoading'
import { checkShowedDayIntro } from '@shared/Utils'

const StudyPreviewPlan = () => {
  const context = useContext(StudyPreviewContext)
  const flatListRef = useRef<FlatList>(null)
  const [expandedIndex, setExpandedIndex] = useState(-1)
  const { showLoading, hideLoading } = useLoading()

  const renderItem = ({ item, index }: { item: StudyPlan.Block; index: number }) => {
    return (
      <PreviewAdvancedItem
        index={index}
        expanded={index === expandedIndex}
        locked={index >= context.blockIndex}
        goalStatus={context.planStatus}
        highlighted={false}
        block={item}
        onCollapse={onCollapse}
        progress={context.progress?.[index + 1]}
        onPressStart={async (isRedo?: boolean) => {
          const planUpdated = await Firestore.Group.triggerCreateMessage(context.plan, index + 1, showLoading, hideLoading)
          const showed = await checkShowedDayIntro(planUpdated, index + 1)
          if (!showed) {
            await new Promise(resolve => {
              NavigationRoot.navigate(Constants.SCENES.STUDY_PLAN.DAY_INTRO, {
                onConfirm: () => resolve(true),
                plan: planUpdated,
                blockIndex: index + 1,
              })
            })
          }
          NavigationRoot[!showed ? 'replace' : 'navigate'](Constants.SCENES.STUDY_PLAN.ACTIVITIES, {
            plan: planUpdated,
            block: planUpdated?.blocks[index],
            blockIndex: index + 1,
            progress: context.progress?.[index + 1],
            isRedo: isRedo === true,
            useFadeTransition: !showed,
          })
        }}
      />
    )
  }

  const onCollapse = index => {
    if (index !== expandedIndex) {
      setExpandedIndex(index)
    } else {
      setExpandedIndex(-1)
    }
  }

  const getItemLayout = React.useCallback((_data, index) => ({ length: 80, offset: 80 * index, index }), [])
  return (
    <FlatList
      ref={flatListRef}
      data={context.plan?.blocks}
      ListEmptyComponent={<Loading />}
      initialScrollIndex={0}
      renderItem={renderItem}
      keyExtractor={(item, index) => 'key' + index}
      style={s.containerItem}
      contentContainerStyle={s.contentContainer}
      ListFooterComponent={<View style={s.footer} />}
      getItemLayout={getItemLayout}
      showsVerticalScrollIndicator={false}
    />
  )
}

const s = StyleSheet.create({
  contentContainer: {
    paddingTop: 12,
    paddingHorizontal: Metrics.insets.horizontal,
  },
  containerItem: {
    flex: 1,
  },
  footer: { height: 30 },
})

export default StudyPreviewPlan
