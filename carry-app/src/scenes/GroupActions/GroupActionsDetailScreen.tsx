import Container from '@components/Container'
import HeaderBar from '@components/HeaderBar'
import TransparentNavigation from '@components/TransparentNavigation'
import { Text } from '@components/Typography'
import { RootState } from '@dts/state'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { StackScreenProps } from '@react-navigation/stack'
import ReadingProgress from '@scenes/Study/Main/components/ReadingProgress'
import { NavigationRoot } from '@scenes/root'
import { Constants, Firestore } from '@shared/index'
import I18n from 'i18n-js'
import { keyBy } from 'lodash'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { TYPES } from '../../redux/actions'
import GroupActionDetailViewer from './components/GroupActionDetailViewer'

type ParamProps = {
  mode: 'read' | 'unread' // single or multiple
  initGroupActionId: string // first action to show if mode is multiple
  groupId?: string // only need when separately from GroupActionsListingScreen
}

type Props = StackScreenProps<{ GroupActionsDetailScreen: ParamProps }, 'GroupActionsDetailScreen'>

const MAXIMUM_ACTIONS = 10

const GroupActionsDetailScreen: React.FC<Props> = props => {
  const { initGroupActionId, mode, groupId } = props.route.params
  const { showLoading, hideLoading } = useLoading()
  const me = useSelector<RootState, RootState['me']>(state => state.me)
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const dispatch = useDispatch()
  const { color } = useTheme()

  const groupActions = useSelector<RootState, RootState['groupActions']>(state => state.groupActions)
  const groupActionMap = React.useMemo(() => {
    return keyBy(groupActions.data, 'id')
  }, [groupActions])

  const [actionList, setActionList] = React.useState(() => {
    if (!groupActions.data) {
      return []
    }
    if (mode === 'unread') {
      return [
        groupActionMap[initGroupActionId],
        ...groupActions.data.filter(action => action.unread && action.id !== initGroupActionId),
      ].slice(0, MAXIMUM_ACTIONS)
    }
    return [groupActionMap[initGroupActionId]]
  })
  React.useEffect(
    () => {
      const loadData = async () => {
        if ((!groupActions.data || groupActions.data.length === 0) && (groupId || group.id)) {
          const data = await Firestore.GroupActions.get({ groupId: groupId || group.id, groupActionId: initGroupActionId })
          if (data) {
            setActionList([data])
          }
        }
      }
      loadData()
    },
    // Only run when init
    [],
  )

  const handleLoadData = React.useCallback(
    type => {
      dispatch({
        type: TYPES.GROUP_ACTIONS.LOAD,
        payload: {
          type,
          isLoadMore: false,
          isRefresh: false,
        },
      })
    },
    [dispatch],
  )
  const [currentIndex, setCurrentIndex] = React.useState(0)

  return (
    <Container safe style={[styles.container, { backgroundColor: color.gray7 }]}>
      {actionList.length === 1 && me.uid === actionList[0].creator ? (
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
          onPressRight={() => {
            NavigationRoot.push(Constants.SCENES.MODAL.BOTTOM_ACTIONS, {
              item: null,
              handleActions: async action => {
                if (action === 'delete') {
                  NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
                    titleIcon: <Text style={styles.titleIcon}>{'✋'}</Text>,
                    title: I18n.t('text.Are you sure'),
                    description: I18n.t('text.Delete action', {
                      type: actionList[0].type,
                    }),
                    confirmTitle: I18n.t('text.Yes delete'),
                    cancelTitle: I18n.t('text.Cancel'),
                    onConfirm: async () => {
                      const typeOfAction = actionList[0].type
                      showLoading()
                      const success = await Firestore.GroupActions.deleteAction({
                        uid: me.uid,
                        groupId: group.id,
                        groupActionId: actionList[0].id,
                      })
                      hideLoading()
                      if (success) {
                        handleLoadData(typeOfAction)
                        NavigationRoot.pop()
                      }
                    },
                    onCancel: () => undefined,
                    confirmColor: color.red,
                  })
                }
              },
              headerStyle: { height: 60 },
              headerComponent: () => <Text style={styles.headerComponent}>{I18n.t('text.Menu')}</Text>,
              actions: [
                {
                  title: actionList[0].type === 'prayer' ? I18n.t('text.Delete prayer') : I18n.t('text.Delete gratitude'),
                  icon: 'trash-2',
                  action: 'delete',
                },
              ],
            })
          }}
        />
      ) : (
        <ReadingProgress
          style={styles.progressBar}
          stepCount={actionList.length > 1 ? actionList.length : 0}
          currentStep={currentIndex + 1}
          isShowAnswer={false}
          onClosePress={() => {
            NavigationRoot.pop()
          }}
        />
      )}
      {actionList[currentIndex] && <GroupActionDetailViewer info={actionList[currentIndex]} />}
      <TransparentNavigation
        mode="left"
        width={50}
        onPress={() => {
          currentIndex > 0 && setCurrentIndex(currentIndex - 1)
        }}
      />
      <TransparentNavigation
        mode="right"
        width={100}
        onPress={() => {
          if (currentIndex < actionList.length - 1) {
            setCurrentIndex(currentIndex + 1)
          } else if (mode === 'unread') {
            NavigationRoot.pop()
          }
        }}
      />
    </Container>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  progressBar: { marginTop: 10 },
  headerComponent: { fontWeight: '700', maxHeight: 50 },
  titleIcon: { fontSize: 49, marginTop: 30, marginBottom: -10 },
})

export default GroupActionsDetailScreen
