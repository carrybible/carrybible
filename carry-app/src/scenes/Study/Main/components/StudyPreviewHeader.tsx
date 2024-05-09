import Button from '@components/Button'
import { Subheading } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import React, { useContext } from 'react'
import { StyleSheet, View } from 'react-native'
import { StudyPreviewContext } from '../StudyPreviewScreen'
import useStudyPlanMoreOptions from '@hooks/useStudyPlanMoreOptions'
import { NavigationRoot } from '@scenes/root'

const StudyPreviewHeader: React.FC = () => {
  const context = useContext(StudyPreviewContext)
  const { color } = useTheme()
  const { onPress, renderPopup } = useStudyPlanMoreOptions({
    plan: context.plan,
    isFuturePlan: context.isFuturePlan,
    onStudyDelete: () => {
      NavigationRoot.pop()
    },
    onStudyEnd: () => {
      NavigationRoot.pop()
    },
  })

  if (context.loading) {
    return (
      <View style={s.container} pointerEvents="box-none">
        <View style={s.headerWrapper}>
          <Button.Icon
            icon="chevron-left"
            size={28}
            color={color.text}
            onPress={() => {
              NavigationRoot.pop()
            }}
            width={44}
          />
        </View>
        <View />
      </View>
    )
  }

  return (
    <View style={s.container} pointerEvents="box-none">
      <View style={s.headerWrapper}>
        <Button.Icon
          icon="chevron-left"
          size={28}
          color={color.text}
          onPress={() => {
            NavigationRoot.pop()
          }}
          width={44}
        />
      </View>
      <View style={s.headerTitle}>
        <Subheading bold>{context?.channel?.data?.name || ''}</Subheading>
      </View>
      <View style={[s.headerWrapper, s.flexEnd]}>
        {onPress != null && (
          <Button.Icon
            icon="more-vertical"
            size={26}
            color={color.text}
            onPress={onPress}
            width={44}
            hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
          />
        )}
      </View>
      {renderPopup()}
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 6,
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.3,
  },
  flexEnd: {
    justifyContent: 'flex-end',
  },
  headerTitle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

export default StudyPreviewHeader
