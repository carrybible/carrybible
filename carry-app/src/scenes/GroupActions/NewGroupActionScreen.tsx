import Container from '@components/Container'
import { GroupActionsType } from '@dts/groupAction'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import { TYPES } from '@redux/actions'
import GroupActionCreate from '@scenes/GroupActions/components/GroupActionCreate'
import { NavigationRoot } from '@scenes/root'
import ReadingProgress from '@scenes/Study/Main/components/ReadingProgress'
import React, { FC } from 'react'
import { StyleSheet, View } from 'react-native'
import { useDispatch } from 'react-redux'

type ParamProps = { type: GroupActionsType }

type Props = StackScreenProps<{ NewGroupActionScreen: ParamProps }, 'NewGroupActionScreen'>

const NewGroupActionScreen: FC<Props> = props => {
  const dispatch = useDispatch()
  const {
    route: {
      params: { type },
    },
  } = props
  const { color } = useTheme()

  // Effect load data
  const handleLoadData = React.useCallback(
    (
      options = {
        isLoadMore: false,
        isRefresh: false,
      },
    ) => {
      const { isLoadMore, isRefresh } = options
      dispatch({
        type: TYPES.GROUP_ACTIONS.LOAD,
        payload: {
          type,
          isLoadMore,
          isRefresh,
        },
      })
    },
    [dispatch, type],
  )

  const onShare = () => {
    handleLoadData()
    NavigationRoot.pop()
  }
  return (
    <Container safe={true} forceInset={{ bottom: true, top: true }} backgroundColor={color.id === 'light' ? '#fafafa' : color.background}>
      <ReadingProgress
        stepCount={0}
        onClosePress={() => {
          NavigationRoot.pop()
        }}
      />
      <View style={s.flex}>
        <GroupActionCreate type={type} onShare={onShare} />
      </View>
    </Container>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
})

export default NewGroupActionScreen
