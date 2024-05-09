import Delete from '@assets/icons/Delete.svg'
import Pencil from '@assets/icons/Pencil.svg'
import PlusBlack from '@assets/icons/PlusBlack.svg'
import AddAnActivity from '@assets/images/AddAnActivity.png'
import Banner from '@components/Banner'
import Button from '@components/Button'
import AddGroupActionPrompt, {
  AddGroupActionPromptRef,
} from '@components/Modals/Plan/AddGroupActionPrompt'
import AddPassageModal, {
  AddPassageModalRef,
} from '@components/Modals/Plan/AddPassageModal'
import AddQuestionModal, {
  AddQuestionModalRef,
} from '@components/Modals/Plan/AddQuestionModal'
import AddTextEntryModal, {
  AddTextEntryModalRef,
} from '@components/Modals/Plan/AddTextEntryModal'
import AddYoutubeVideoModal, {
  AddYoutubeVideoModalRef,
} from '@components/Modals/Plan/AddYoutubeVideoModal'
import ChooseActivityModal, {
  ChooseActivityModalRef,
} from '@components/Modals/Plan/ChooseActivityModal'
import ChooseVideoOptionModal, {
  ChooseVideoOptionModalRef,
} from '@components/Modals/Plan/ChooseVideoOptionModal'
import UploadVideoModal, {
  UploadVideoModalRef,
} from '@components/Modals/Plan/UploadVideoModal'
import ActivityRowBlock from '@components/PlanBuilder/ActivityRowBlock'
import { GroupActionsType } from '@dts/GroupActions'
import {
  Activity,
  GroupActionAct,
  PassageAct,
  QuestionAct,
  TextAct,
  VideoAct,
} from '@dts/Plans'
import useDidMountEffect from '@hooks/useDidMountEffect'
import {
  getActTypeDescription,
  getActTypeIcon,
  getActTypeText,
} from '@shared/Utils'
import classNames from 'classnames'
import { omit } from 'lodash'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import React, {
  ForwardRefRenderFunction,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd'
import { useDispatch } from 'react-redux'
import { hideHighlight } from '@redux/slices/app'

type Props = {
  initActivities: Activity[]
  onActivitiesUpdate?: (activities: Activity[]) => void
  isReadOnly?: boolean
  showTour?: boolean
}

export type PlanDayActivitiesBuilderRef = {
  save: () => Activity[]
}

const PlanDayActivitiesBuilder: ForwardRefRenderFunction<
  PlanDayActivitiesBuilderRef,
  Props
> = (
  { initActivities, onActivitiesUpdate, isReadOnly = false, showTour },
  ref
) => {
  useImperativeHandle(ref, () => ({
    save: () => activities.map((act) => omit(act, ['id']) as Activity),
  }))

  const { t } = useTranslation()
  const [activities, setActivities] = useState(() =>
    initActivities.map((act, index) => ({ ...act, id: Date.now() + index }))
  )
  const chooseActivityRef = useRef<ChooseActivityModalRef>(null)
  const dispatch = useDispatch()

  const addPassageModalRef = useRef<AddPassageModalRef>(null)
  const addQuestionModalRef = useRef<AddQuestionModalRef>(null)
  const addPrayerPromptRef = useRef<AddGroupActionPromptRef>(null)
  const addGratitudePromptRef = useRef<AddGroupActionPromptRef>(null)
  const addTextEntryModalRef = useRef<AddTextEntryModalRef>(null)
  const addYoutubeVideoModalRef = useRef<AddYoutubeVideoModalRef>(null)
  const chooseVideoOptionModalRef = useRef<ChooseVideoOptionModalRef>(null)
  const uploadVideoModalRef = useRef<UploadVideoModalRef>(null)

  const handleUpdateActivity = useCallback(function <T = Activity>(
    actIndex?: number
  ) {
    return (newAct?: T) => {
      setActivities((prevActs) => {
        if (actIndex !== undefined) {
          return prevActs
            .map((currAct, currIndex) =>
              currIndex === actIndex
                ? newAct
                  ? { ...currAct, ...newAct }
                  : (undefined as any)
                : currAct
            )
            .filter(Boolean)
        }
        return [
          ...prevActs,
          { ...(newAct as unknown as Activity), id: Date.now() },
        ]
      })
    }
  },
  [])

  const handleDeleteActivity = useCallback(
    (actIndex: number) => {
      handleUpdateActivity(actIndex)()
    },
    [handleUpdateActivity]
  )

  const handleAddActivity = useCallback(
    async ({
      actType,
      subActType,
      initAct,
      actIndex,
    }: {
      actType: Activity['type']
      subActType?: GroupActionsType
      initAct?: Activity
      actIndex?: number // without is appended mode, otherwise is edit mode
    }) => {
      const updateAct = handleUpdateActivity(actIndex)
      switch (actType) {
        case 'passage': {
          const passageAct = await addPassageModalRef.current?.show(
            initAct as PassageAct
          )
          if (passageAct) {
            updateAct(passageAct)
          }
          return
        }
        case 'question': {
          const questionAct = await addQuestionModalRef.current?.show(
            initAct as QuestionAct
          )
          if (questionAct) {
            updateAct(questionAct)
          }
          return
        }
        case 'action': {
          const actionAct = await (subActType === 'prayer'
            ? addPrayerPromptRef.current?.show(initAct as GroupActionAct)
            : addGratitudePromptRef.current?.show(initAct as GroupActionAct))

          if (actionAct) {
            updateAct(actionAct)
          }
          return
        }
        case 'text': {
          const textAct = await addTextEntryModalRef.current?.show(
            initAct as TextAct
          )
          if (textAct) {
            updateAct(textAct)
          }
          return
        }
        case 'video': {
          const type =
            initAct?.type || (await chooseVideoOptionModalRef.current?.show())
          if (type !== 'youtube') {
            const videoAct = await uploadVideoModalRef.current?.show(
              initAct as VideoAct
            )
            if (videoAct) {
              updateAct(videoAct)
            }
          } else {
            const videoAct = await addYoutubeVideoModalRef.current?.show(
              initAct as VideoAct
            )
            if (videoAct) {
              updateAct(videoAct)
            }
          }
          return
        }
        default:
          return
      }
    },
    [handleUpdateActivity]
  )

  const buttonMoreActivityData = useMemo(() => {
    const actions: {
      key: string
      label: string
      danger?: boolean
      icon: React.ReactNode
    }[] = []

    actions.push(
      {
        key: 'edit-act',
        label: t('plans.edit-act'),
        icon: <Image src={Pencil} alt="edit-detail-icon" />,
      },
      {
        key: 'delete-act',
        label: t('plans.delete-act'),
        danger: true,
        icon: <Image src={Delete} className="text-warning" alt="delete-icon" />,
      }
    )

    return actions
  }, [t])

  useDidMountEffect(() => {
    onActivitiesUpdate?.(activities.map((act) => omit(act, ['id']) as Activity))
  }, [activities])

  const handleDrop = (droppedItem: DropResult) => {
    // Ignore drop outside droppable container
    if (!droppedItem.destination) return
    const updatedActivities = [...activities]
    // Remove dragged item
    const [reorderedItem] = updatedActivities.splice(
      droppedItem.source.index,
      1
    )
    // Add dropped item
    updatedActivities.splice(droppedItem.destination.index, 0, reorderedItem)
    // Update State
    setActivities(updatedActivities)
  }

  return (
    <div className={classNames('flex flex-col', 'justify-start', 'mt-6')}>
      <div className="pt-6 pb-6">
        {!isReadOnly ? (
          <Button
            type="secondary"
            className={classNames(
              'w-full sm:w-fit',
              'self-end',
              'text-neutral-100',
              'shadow-none hover:border-primary',
              showTour && 'relative z-[10001] bg-[#fff]'
            )}
            icon={
              <div className="mr-1 flex">
                <Image src={PlusBlack} alt="plus-icon" width={15} height={15} />
              </div>
            }
            onClick={() => {
              dispatch(hideHighlight())
              chooseActivityRef.current?.show()
            }}
          >
            {t('plans.add-activity')}
          </Button>
        ) : null}
      </div>

      {!isReadOnly ? (
        <div
          className={classNames(
            'flex flex-row flex-wrap',
            'justify-between',
            'mb-6'
          )}
        >
          <Banner
            className={classNames(
              'w-full',
              showTour && 'relative z-[10001] bg-[#fff]'
            )}
            title={t('plans.add-day-activity-title')}
            content={t('plans.add-day-activity-content')}
            image={{
              img: AddAnActivity,
              imgAlt: 'EditActivities',
              width: 246,
              height: 180,
            }}
          />
        </div>
      ) : null}

      <DragDropContext onDragEnd={handleDrop}>
        <Droppable droppableId="list-container" isDropDisabled={isReadOnly}>
          {(provided) => (
            <div
              className="list-container"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {activities.map((act, actIndex) => {
                const actType = act.type
                const subActType =
                  act.type === 'action' ? act.actionType : undefined
                return (
                  <Draggable
                    key={act.id}
                    draggableId={act.id.toString()}
                    index={actIndex}
                    isDragDisabled={isReadOnly}
                  >
                    {(provided) => (
                      <div
                        className="item-container mb-6"
                        ref={provided.innerRef}
                        {...provided.dragHandleProps}
                        {...provided.draggableProps}
                      >
                        <ActivityRowBlock
                          className="w-full sm:py-6"
                          icon={getActTypeIcon(actType, subActType)}
                          type={t(getActTypeText(actType, subActType))}
                          description={getActTypeDescription(act)}
                          isReadOnly={isReadOnly}
                          buttonMore={{
                            data: buttonMoreActivityData,
                            onClick: async ({ key }) => {
                              if (key === 'edit-act') {
                                await handleAddActivity({
                                  actType,
                                  subActType,
                                  initAct: act,
                                  actIndex,
                                })
                              } else if (key === 'delete-act') {
                                handleDeleteActivity(actIndex)
                              }
                            },
                          }}
                        />
                      </div>
                    )}
                  </Draggable>
                )
              })}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <ChooseActivityModal ref={chooseActivityRef} onData={handleAddActivity} />

      <AddPassageModal ref={addPassageModalRef} />
      <AddQuestionModal ref={addQuestionModalRef} />
      <AddGroupActionPrompt mode={'prayer'} ref={addPrayerPromptRef} />
      <AddGroupActionPrompt mode={'gratitude'} ref={addGratitudePromptRef} />
      <AddTextEntryModal ref={addTextEntryModalRef} />
      <ChooseVideoOptionModal ref={chooseVideoOptionModalRef} />
      <AddYoutubeVideoModal ref={addYoutubeVideoModalRef} />
      <UploadVideoModal ref={uploadVideoModalRef} />
    </div>
  )
}

export default React.forwardRef(PlanDayActivitiesBuilder)
