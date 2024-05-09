import { StudyPlan } from '@dts/study'
import { Metrics } from '@shared/index'
import React, { useState } from 'react'
import { View } from 'react-native'
import { TabView } from 'react-native-tab-view'

import ChooseBookChapter from '../components/ChooseBookChapter'
import ChooseVerses from '../components/ChooseVerses'

const INITIAL_LAYOUT = {
  height: 0,
  width: Metrics.screen.width,
}

const PassageModal = ({
  onCreate,
  initActivity,
}: {
  onCreate: (act: StudyPlan.PassageAct) => void
  onDismiss: () => void
  initActivity?: StudyPlan.PassageAct
}) => {
  const [passage, setPassage] = useState<StudyPlan.PassageAct>(() => {
    if (initActivity) {
      return initActivity
    }
    return {
      type: 'passage',
      chapter: undefined,
      verseRange: undefined,
      verses: undefined,
      error: '',
    }
  })

  const [navigationState, setNavigationState] = React.useState(() => {
    const routes: { key: string }[] = [{ key: 'choose-book-chapter' }, { key: 'choose-verses' }]
    return {
      index: 0,
      routes,
    }
  })

  const handleIndexChange = React.useCallback(
    (index: number) => {
      setNavigationState({ ...navigationState, index })
    },
    [navigationState],
  )

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'choose-book-chapter': {
        return (
          <ChooseBookChapter
            chapter={passage.chapter}
            setChapter={newChapter => {
              setPassage({
                ...passage,
                // @ts-ignore
                chapter: {
                  ...(passage?.chapter || {}),
                  ...newChapter,
                },
                verses: [],
              })
            }}
            onNextPress={() => {
              handleIndexChange(1)
            }}
          />
        )
      }
      case 'choose-verses': {
        return (
          <ChooseVerses
            onCreate={onCreate}
            passage={passage}
            setVerses={(verses, verseRange) => {
              setPassage({
                ...passage,
                verses,
                verseRange,
              })
            }}
          />
        )
      }
      default:
        return null
    }
  }

  return (
    <View style={{ height: 0.7 * Metrics.screen.height }}>
      <TabView
        navigationState={navigationState}
        renderScene={renderScene}
        renderTabBar={() => null}
        onIndexChange={handleIndexChange}
        initialLayout={INITIAL_LAYOUT}
        swipeEnabled={false}
        lazy
      />
    </View>
  )
}

export default PassageModal
