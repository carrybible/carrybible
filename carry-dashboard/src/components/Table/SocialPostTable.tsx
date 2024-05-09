import Button from '@components/Button'
import PlanSocialMediaPost from '@components/Pages/Group/PlanSocialMediaPost'
import { ArrowRight } from '@components/Table/components/Arrow'
import { H4 } from '@components/Typography'
import { SocialMediaPost } from '@dts/Group'
import { GroupDetailType } from '@shared/Firebase/group'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'

const SocialPostTable: React.FC<{
  className?: string
  posts: SocialMediaPost[]
  onClick: (a: SocialMediaPost) => void
  group: GroupDetailType
}> = ({ className, posts, onClick, group }) => {
  const { t } = useTranslation()

  if (posts.length > 0) {
    return (
      <div className={classNames('mt-10 mb-6', className)}>
        <H4>{t('plans.social-media-post')}</H4>
        <div className="mt-7 flex flex-row overflow-x-auto">
          {posts.slice(0, 3).map((value, index) => (
            <PlanSocialMediaPost
              key={index}
              post={value}
              type="small"
              group={group}
              onClick={onClick}
            />
          ))}
          {<ViewMoreButton />}
        </div>
      </div>
    )
  }

  return null
}

const ViewMoreButton = () => {
  const { t } = useTranslation()
  const router = useRouter()

  return (
    <Button
      type="secondary"
      className={classNames('w-full sm:w-fit', 'self-center', 'mt-6')}
    >
      <Link href={`${router.asPath}/social_media_posts`}>
        <a className="flex items-center gap-2">
          {t('view-more')}
          <ArrowRight border={false} />
        </a>
      </Link>
    </Button>
  )
}

export default SocialPostTable
