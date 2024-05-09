import SocialMediaPostsClick from '@assets/images/SocialMediaPostsClick.png'
import Banner from '@components/Banner'
import PageLayout from '@components/Layout/PageLayout'
import ReviewSocialPostModal from '@components/Modals/ReviewSocialPostModal'
import SocialMediaPosts from '@components/Pages/Group/SocialMediaPosts'
import { SocialMediaPost } from '@dts/Group'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import useBreadcrumb from '@hooks/useBreadcrumb'
import { NextPageWithLayout } from '@pages/_app'
import { useAppDispatch } from '@redux/hooks'
import { startLoading, stopLoading } from '@redux/slices/app'
import { withTrans } from '@shared/I18n'
import { message } from 'antd'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  getGroupDetails,
  getSocialMediaPosts,
  GroupDetailType,
} from '../../../../shared/Firebase/group'

const SocialMediaPostsPage: NextPageWithLayout = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [groupDetails, setGroupDetails] = useState<GroupDetailType>()
  const [socialMediaPosts, setSocialMediaPosts] = useState<SocialMediaPost[]>(
    []
  )
  const router = useRouter()
  const reviewRef = useRef<any>()

  const groupId = router.query['groupId'] as string

  //   const giving = useAppSelector((state) => state.giving)

  const getGroupDetail = useCallback(async () => {
    try {
      if (groupId) {
        const {
          success,
          data,
          message: errorMessage,
        } = await getGroupDetails({
          groupId,
        })
        if (!success) {
          console.error('get group detail error: ', errorMessage)
          message.error(t('error-server'))
          return
        }
        setGroupDetails(data)
      }
    } finally {
    }
  }, [groupId, t])

  const fetchSocialMediaPosts = useCallback(async () => {
    const mediaPosts = await getSocialMediaPosts(groupId)
    setSocialMediaPosts(mediaPosts)
  }, [groupId])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([getGroupDetail(), fetchSocialMediaPosts()])
      setLoading(false)
    } catch (error) {
      setLoading(false)
    }
  }, [fetchSocialMediaPosts, getGroupDetail])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useBreadcrumb({
    label: t('group.social-media-posts-no-icon'),
  })

  useEffect(() => {
    if (loading) {
      dispatch(startLoading())
    } else {
      dispatch(stopLoading())
    }
  }, [dispatch, loading])

  return (
    <PageLayout title={t('group.social-media-posts')} routeChangeLoading>
      <Banner
        title={t('group.social-video-click')}
        content={t('group.social-video-click-desc')}
        image={{
          img: SocialMediaPostsClick,
          imgAlt: 'Social Media Post Click',
          width: 150,
          height: 150,
        }}
      />

      {!!groupDetails && (
        <SocialMediaPosts
          posts={socialMediaPosts}
          onClick={(post) => {
            reviewRef.current?.show(post)
          }}
          group={groupDetails}
        />
      )}
      <ReviewSocialPostModal ref={reviewRef} />
    </PageLayout>
  )
}

export const getStaticProps = withTrans()
export async function getStaticPaths() {
  return {
    paths: [],
    fallback: true,
  }
}
export default withPagePermissionChecker(SocialMediaPostsPage, {
  // TODO: revert this when server return this permission
  permissionsRequire: [],
  // permissionsRequire: [Permissions.VIEW_GROUP],
  noPermissionView: true,
})
