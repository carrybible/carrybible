import EnterPlanDayTitleModal, {
  EnterPlanDayTitleModalRef,
} from '@components/Modals/Plan/EnterPlanDayTitleModal'
import PlanDayBlock, {
  AddPlanDayBlock,
} from '@components/PlanBuilder/PlanDayBlock'
import { Block, Plan } from '@dts/Plans'
import useDidMountEffect from '@hooks/useDidMountEffect'
import { useAppSelector } from '@redux/hooks'
import { updateOrgPlan } from '@shared/Firebase/plan'
import { wait } from '@shared/Utils'
import { arrayMoveImmutable } from 'array-move'
import classNames from 'classnames'
import { Timestamp } from 'firebase/firestore'
import { useRouter } from 'next/router'
import React, { useCallback, useRef, useState } from 'react'
import { SortableContainer, SortableElement } from 'react-sortable-hoc'

type Props = {
  plan: Plan
  readonly?: boolean
  isTemplate?: boolean
  isPreview?: boolean
  showHighlightEdit?: boolean
}

const PlanDays: React.FC<Props> = ({
  plan,
  readonly = false,
  isTemplate = false,
  isPreview = false,
  showHighlightEdit = false,
}) => {
  const me = useAppSelector((state) => state.me)
  const router = useRouter()
  const [blocks, setBlocks] = useState<Block[]>(plan.blocks)
  const enterPlanDayTitleModalRef = useRef<EnterPlanDayTitleModalRef>(null)
  const dragTime = useRef(0)

  useDidMountEffect(() => {
    updateOrgPlan({
      plan: {
        id: plan.id,
        blocks,
        duration: blocks.length,
      },
      organisationId: me.organisation.id,
    })
  }, [blocks])

  const handleAddADay = () => {
    const list = [...blocks]
    list.push({
      name: `Day ${list.length + 1}`,
      activities: [],
      created: Timestamp.now(),
    })
    setBlocks(list)
  }

  const handleUpdateBlock = useCallback((index: number) => {
    return (updatedBlock: Partial<Block>) => {
      setBlocks((prevBlocks) =>
        prevBlocks.map((curBlock, curIndex) =>
          curIndex === index ? { ...curBlock, ...updatedBlock } : curBlock
        )
      )
    }
  }, [])

  const onSortEnd = ({
    oldIndex,
    newIndex,
  }: {
    oldIndex: number
    newIndex: number
  }) => {
    const isClick = new Date().getTime() - dragTime.current < 100
    if (oldIndex === newIndex && isClick) {
      const block = blocks[oldIndex]
      const valueIndex = oldIndex
      const onClick = async () => {
        if (block.name === '' && !isTemplate && !readonly) {
          const newTitle = await enterPlanDayTitleModalRef.current?.show({
            plan: {
              ...plan,
              blocks,
            },
            dayIndex: valueIndex,
          })
          if (!newTitle) {
            return
          }
          handleUpdateBlock(valueIndex)({ name: newTitle })
          await wait(250)
        }
        router.push({
          pathname: !isTemplate
            ? `/plans/${plan.id}/${valueIndex}`
            : `/plans/template/${plan.id}/${valueIndex}`,
        })
      }

      onClick()
      return
    }
    setBlocks((items) =>
      arrayMoveImmutable(items, oldIndex, newIndex).map((value, index) => ({
        ...value,
        index,
      }))
    )
  }

  const handleClickDayBlock = (valueIndex: number) => {
    if (isPreview) {
      return router.push(`${router.asPath}/${valueIndex}`)
    }
    if (readonly && isTemplate) {
      return router.push({
        pathname: `/plans/template/${plan.id}/${valueIndex}`,
      })
    }

    return undefined
  }

  const SortableItem: any = SortableElement(
    ({
      key,
      block,
      valueIndex,
    }: {
      key: string
      block: Block
      valueIndex: number
    }) => {
      return (
        <PlanDayBlock
          me={me}
          key={key}
          className={classNames(
            'sm:py-6',
            !readonly && 'hover:cursor-pointer',
            showHighlightEdit && valueIndex === 0
              ? 'relative z-[10001] rounded-[10px] !bg-[#fff]'
              : ''
          )}
          block={block}
          dayIndex={valueIndex}
          onClick={() => {
            handleClickDayBlock(valueIndex)
          }}
        />
      )
    }
  )

  const SortableList = SortableContainer<{ items: Block[] }>(
    ({ items }: { items: Block[] }) => {
      return (
        <div
          className={classNames(
            'grid grid-cols-2 gap-4 sm:grid-cols-4',
            'justify-start',
            'mt-6'
          )}
        >
          {items.map((item, index) => {
            return (
              <SortableItem
                key={`item-${index}`}
                index={index}
                valueIndex={index}
                block={item}
                disabled={readonly}
              />
            )
          })}
          {!readonly && !isPreview && items.length < 60 && (
            <AddPlanDayBlock onClick={handleAddADay} />
          )}
        </div>
      )
    }
  )

  return (
    <div>
      <SortableList
        axis="xy"
        items={blocks}
        onSortEnd={onSortEnd}
        onSortStart={() => {
          dragTime.current = new Date().getTime()
        }}
        helperClass="SortableHelper"
        pressDelay={50}
        pressThreshold={50}
        transitionDuration={500}
      />
      <EnterPlanDayTitleModal
        ref={enterPlanDayTitleModalRef}
        shouldCallApi={false}
      />
    </div>
  )
}

export default PlanDays
