import { H4, H5, SmallText } from '@components/Typography'
import { GroupDetailType } from '@shared/Firebase/group'
import { Button, Image } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import * as React from 'react'
import { useMemo } from 'react'
import { SocialMediaPost } from '../../../dts/Group'
import { LargerText, TinyText } from '../../Typography/Text'

type Props = {
  onClick?: (a: SocialMediaPost) => void
  type?: 'normal' | 'table' | 'small'
  post: SocialMediaPost
  group: GroupDetailType
}

const PlanSocialMediaPost: React.FC<Props> = ({
  onClick,
  type,
  post,
  group,
}) => {
  const { t } = useTranslation()

  const style = useMemo(() => {
    if (type === 'table' || type === 'small') {
      return {
        container: classNames(
          'relative',
          type === 'table' ? 'h-fit px-0' : 'mr-4 w-[206px] h-fit',
          'rounded-[10px] border-2 border-solid border-neutral-50',
          'hover:border-primary-light',
          'flex flex-col'
        ),
        image: classNames(
          'h-56 ',
          type === 'table' ? 'w-full' : 'w-[202px]',
          'rounded-t-[10px] object-cover'
        ),
        content: classNames(
          type === 'table' ? 'w-full' : 'w-[202px]',
          'flex flex-col flex-wrap items-center justify-center'
        ),
        header: 'bold text-xs mx-6 mb-0 mt-8 text-center',
        title: 'mt-2 text-xs mb-6 text-primary  mx-2 text-center',
        orgAvatar:
          'absolute top-[148px] left-0 right-0 flex flex-col flex-wrap items-center justify-center',
        avatar: classNames('mt-10 h-16 w-16', 'rounded-[80px] border-0'),
        BottomTextView: TinyText,
      }
    }
    return {
      container: classNames(
        'relative',
        'mr-4 w-[256px] h-fit',
        'rounded-[10px] border-2 border-solid border-neutral-50',
        'hover:border-primary-light',
        'flex flex-col'
      ),
      image: classNames(
        'h-72 w-[252px]',
        'flex flex-col flex-wrap items-center justify-center',
        'rounded-t-[10px] object-cover'
      ),
      content: classNames(
        'w-[252px]',
        'flex flex-col flex-wrap items-center justify-center'
      ),
      header: 'bold mx-6 mb-0 mt-10 text-center',
      title: 'mt-2 mb-6 text-primary mx-2 text-center',
      orgAvatar:
        'absolute top-[166px] left-0 right-0 flex flex-col flex-wrap items-center justify-center',
      avatar: classNames('mt-20 h-20 w-20', 'rounded-[80px] border-0'),
      BottomTextView: SmallText,
    }
  }, [type])

  if (!post) return null

  return (
    <div
      onClick={() => {
        if (post) onClick?.(post)
      }}
      className={style.container}
    >
      <Image
        src={post.thumbnail}
        alt="template"
        className={style.image}
        preview={false}
      />

      {type === 'small' || type === 'table' ? (
        <div className={style.content}>
          <LargerText strong className={style.header}>
            {t('Join us this week as we study')}
          </LargerText>
          <H5 className={style.title}>{post.studyName}</H5>
        </div>
      ) : (
        <div className={style.content}>
          <H5 strong className={style.header}>
            {t('Join us this week as we study')}
          </H5>
          <H4 className={style.title}>{post.studyName}</H4>
        </div>
      )}

      <div className={style.orgAvatar}>
        <Image
          src={group.image || ''}
          alt="template"
          className={style.avatar}
          preview={false}
        />
      </div>

      <div className="flex items-baseline self-center">
        <style.BottomTextView className="mb-2 text-neutral-80">
          {t('created in')}
        </style.BottomTextView>
        <style.BottomTextView className="mb-2 ml-1 text-neutral-80" strong>
          {t(' Carry Bible')}
        </style.BottomTextView>
      </div>
    </div>
  )
}

export const AddPlanDayBlock: React.FC<{
  className?: string
  onClick?: () => void
}> = ({ className, onClick }) => {
  const { t } = useTranslation()
  return (
    <Button
      onClick={onClick}
      className={classNames(
        'h-44 w-44 px-5 py-9',
        'sm:h-52 sm:w-52 sm:px-6 sm:py-6',
        'flex flex-col flex-wrap items-center justify-center bg-neutral-40',
        'rounded-[10px] border-2 border-dashed border-[#DFE1E9]',
        'text-lg font-bold text-neutral-100',
        'hover:border-[#a5a5a5]',
        className
      )}
    >
      {t('plans.add-a-day')}
    </Button>
  )
}

export default PlanSocialMediaPost
