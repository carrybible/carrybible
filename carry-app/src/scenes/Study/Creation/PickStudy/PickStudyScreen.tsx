import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import { NavigationRoot } from '@scenes/root'
import React from 'react'
import { useDispatch } from 'react-redux'

import StudyType from './components/StudyType'

type ParamProps = {
  groupId: string
  fromCreateGroup?: boolean
}

type Props = StackScreenProps<{ PickStudyScreen: ParamProps }, 'PickStudyScreen'>

const PickStudyScreen: React.FC<Props> = props => {
  const { color } = useTheme()
  const dispatch = useDispatch()

  const { groupId, fromCreateGroup } = props.route.params

  const onPressBack = () => {
    if (fromCreateGroup && groupId) {
      dispatch({ type: TYPES.GROUP.OPEN_GROUP_SCREEN, payload: groupId })
      NavigationRoot.home()
    } else {
      NavigationRoot.pop()
    }
  }

  return (
    <Container safe>
      <HeaderBar
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={onPressBack}
      />

      <StudyType groupId={groupId} />
    </Container>
  )
}

export default PickStudyScreen
