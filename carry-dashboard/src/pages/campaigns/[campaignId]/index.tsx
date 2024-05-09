/* eslint-disable max-lines */

import _ from 'lodash'
import { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Avatar, Empty, message, Modal } from 'antd'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
// import { Timestamp } from 'firebase/firestore'

import { withTrans } from '@shared/I18n'
import {
  attachCampaignVideo,
  deleteCampaign,
  getCampaign,
  getCampaignDonations,
  publishCampaign,
  removeCampaignVideo,
  updateCampaign,
} from '@shared/Firebase/campaign'
import withPagePermissionChecker from '@hoc/withPagePermissionChecker'
import PageLayout from '@components/Layout/PageLayout'
import { H4, H5, Text, LargerText, H3 } from '@components/Typography'
import Button from '@components/Button'
import ButtonMore from '@components/ButtonMore'
import RectangleStatBlock from '@components/StatBlock/RectangleStatBlock'
import Table from '@components/Table'
import ActivityBlock from '@components/StatBlock/ActivityBlock'
import { Campaign, CampaignStatus, CampaignVideoType } from '@dts/Campaign'
import ChoosePublishOptionModal, {
  ChoosePublishOptionModalRef,
} from '@components/Modals/Giving/ChoosePublishOptionModal'
import PreviewCampaignVideoModal, {
  PreviewCampaignVideoModalRef,
} from '@components/Modals/Giving/PreviewCampaignVideoModal'
import ChooseCampusModal, {
  ChooseCampusModalRef,
} from '@components/Modals/Giving/ChooseCampusModal'
import ChooseGroupsModal, {
  ChooseGroupsModalRef,
} from '@components/Modals/Giving/ChooseGroupsModal'
import SetDateCampaignModal, {
  SetDateCampaignModalModalRef,
} from '@components/Modals/Giving/SetDateCampaignModal'
import ChooseVideoOptionModal, {
  ChooseVideoOptionModalRef,
} from '@components/Modals/Plan/ChooseVideoOptionModal'
import UploadVideoModal, {
  UploadVideoModalRef,
} from '@components/Modals/Plan/UploadVideoModal'
import AddYoutubeVideoModal, {
  AddYoutubeVideoModalRef,
} from '@components/Modals/Plan/AddYoutubeVideoModal'
import CreateCampaignModal, {
  CreateCampaignModalRef,
} from '@components/Modals/Giving/CreateCampaignModal'
import SuggestedGiftModal, {
  SuggestedGiftModalRef,
} from '@components/Modals/Giving/SuggestedGiftModal'
import SetGoalAmountCampaignModal, {
  SetGoalAmountCampaignModalRef,
} from '@components/Modals/Giving/SetGoalAmountCampaignModal'
import { DonationOfUser } from '@shared/Firebase/giving'
import useGlobalLoading from '@hooks/useGlobalLoading'
import { getCampaignDateStatus, toCurrency } from '@shared/Utils'
import useBreadcrumb from '@hooks/useBreadcrumb'
import { useAppSelector } from '@redux/hooks'

import IcPencil from '@assets/icons/Pencil.svg'
import IcPlus from '@assets/icons/Plus.svg'
import IcArrowRight from '@assets/icons/ArrowRight.svg'
import IcPlay from '@assets/icons/Play.svg'
import IcDelete from '@assets/icons/Delete.svg'
import IcXCircle from '@assets/icons/XCircleIcon.svg'

const CampaignDetailPage: NextPage = () => {
  const router = useRouter()
  const { t } = useTranslation()
  const giving = useAppSelector((state) => state.giving)

  const { startLoading, stopLoading } = useGlobalLoading()

  const campaignId = router.query.campaignId as string

  const [loading, setLoading] = useState<boolean>(false)

  const [campaign, setCampaign] = useState<Campaign | null>()
  const [donations, setDonations] = useState<DonationOfUser[]>([])

  const choosePublishOptionModalRef = useRef<ChoosePublishOptionModalRef>(null)
  const previewVideoModalRef = useRef<PreviewCampaignVideoModalRef>(null)
  const chooseVideoOptionModalRef = useRef<ChooseVideoOptionModalRef>(null)
  const addYoutubeVideoModalRef = useRef<AddYoutubeVideoModalRef>(null)
  const uploadVideoModalRef = useRef<UploadVideoModalRef>(null)
  const chooseCampusModalRef = useRef<ChooseCampusModalRef>(null)
  const chooseGroupsModalRef = useRef<ChooseGroupsModalRef>(null)
  const setDateCampaignModalModalRef =
    useRef<SetDateCampaignModalModalRef>(null)

  const createCampaignModalRef = useRef<CreateCampaignModalRef>(null)
  const suggestedGiftModalRef = useRef<SuggestedGiftModalRef>(null)
  const setGoalAmountCampaignModalRef =
    useRef<SetGoalAmountCampaignModalRef>(null)

  useBreadcrumb({
    previousLabel: t('giving.campaigns-header'),
    label: !campaignId || !campaign ? 'Campaign detail' : campaign.name,
  })

  const getData = useCallback(async () => {
    setLoading(true)

    const [resCampaign, resDonations] = await Promise.all([
      getCampaign(campaignId),
      getCampaignDonations<DonationOfUser>({
        scope: 'user',
        search: '',
        filters: { campaignId },
        page: 1,
        limit: 99999,
      }),
    ])

    setLoading(false)

    if (!resCampaign.success) {
      message.error(resCampaign.message!)
    } else {
      setCampaign(resCampaign.data)
    }

    if (!resDonations.success) {
      message.error(resDonations.message!)
    } else {
      setDonations(resDonations.data)
    }
  }, [campaignId])

  useEffect(() => {
    if (campaignId) {
      getData()
    }
  }, [campaignId, getData])

  useEffect(() => {
    if (loading) {
      startLoading()
    } else {
      stopLoading()
    }
  }, [loading, startLoading, stopLoading])

  const getButtonOptions = (): {
    key: string
    label: string
    icon: JSX.Element
    danger?: boolean
  }[] => {
    const options: {
      key: string
      label: string
      icon: JSX.Element
      danger?: boolean
    }[] = []

    switch (campaign!.status) {
      case CampaignStatus.active:
        options.push({
          key: '2',
          label: t('giving.edit-end-date'),
          icon: <Image src={IcPencil} alt="" />,
        })
        break

      case CampaignStatus.draft:
        options.push(
          ...[
            {
              key: '1',
              label: t('giving.edit-campaign'),
              icon: <Image src={IcPencil} alt="" />,
            },
            {
              key: '3',
              danger: true,
              label: t('giving.delete-campaign'),
              icon: <Image src={IcDelete} alt="" />,
            },
          ]
        )
        break

      default:
        break
    }

    return options
  }

  const handleAddVideoClicked = useCallback(async () => {
    const type = await chooseVideoOptionModalRef.current!.show()

    if (type === 'web') {
      const videoAct = await uploadVideoModalRef.current!.show()

      if (_.isNil(videoAct)) {
        return
      }

      setLoading(true)

      const res = await attachCampaignVideo({
        id: campaign!.id,
        video: {
          videoOption: CampaignVideoType.web,
          url: videoAct.url!,
          thumbnail: '',
          title: videoAct.title,
          description: videoAct.description || '',
        },
      })

      setLoading(false)

      if (!res.success) {
        message.error(res.message!)
      } else {
        setCampaign((prev) => ({
          ...prev!,
          video: {
            videoOption: CampaignVideoType.web,
            title: videoAct.title,
            description: videoAct.description || '',
            thumbnail: '',
            url: videoAct.url!,
          },
        }))
      }
    } else if (type === 'youtube') {
      const videoAct = await addYoutubeVideoModalRef.current!.show()

      if (_.isNil(videoAct)) {
        return
      }

      const url = `https://www.youtube.com/watch?v=${videoAct.videoId}`
      const thumbnail = `https://i.ytimg.com/vi/${videoAct.videoId}/mqdefault.jpg`

      setLoading(true)

      const res = await attachCampaignVideo({
        id: campaign!.id,
        video: {
          videoOption: CampaignVideoType.youtube,
          url,
          thumbnail,
          title: videoAct.title,
          description: videoAct.description || '',
        },
      })

      setLoading(false)

      if (!res.success) {
        message.error(res.message!)
      } else {
        setCampaign((prev) => ({
          ...prev!,
          video: {
            videoOption: CampaignVideoType.youtube,
            title: videoAct.title,
            description: videoAct.description || '',
            thumbnail,
            url,
          },
        }))
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign])

  const handlePublishOption = () => {
    choosePublishOptionModalRef.current?.show()
  }

  const handlePublishCampuses = async () => {
    choosePublishOptionModalRef.current?.hide()
    const campusIds = await chooseCampusModalRef.current!.show()
    const {
      //
      startDate,
      endDate,
    } = await setDateCampaignModalModalRef.current!.show('publish')

    setLoading(true)

    const res = await publishCampaign({
      id: campaign!.id,
      campusIds: campusIds || [],
      startDate: startDate!.format('YYYY-MM-DD'),
      endDate: endDate!.format('YYYY-MM-DD'),
    })

    setLoading(false)

    if (!res.success) {
      message.error(res.message!)
    } else {
      message.success(t('giving.campaign-published'))
      setCampaign((prev) => ({
        ...prev!,
        status: CampaignStatus.active,
      }))
      await getData()
    }
  }

  const handlePublishGroups = async () => {
    choosePublishOptionModalRef.current?.hide()
    const groupIds = await chooseGroupsModalRef.current!.show()
    const {
      //
      startDate,
      endDate,
    } = await setDateCampaignModalModalRef.current!.show('publish')

    setLoading(true)

    const res = await publishCampaign({
      id: campaign!.id,
      groupIds: groupIds || [],
      startDate: startDate!.format('YYYY-MM-DD'),
      endDate: endDate!.format('YYYY-MM-DD'),
    })

    setLoading(false)

    if (!res.success) {
      message.error(res.message!)
    } else {
      message.success(t('giving.campaign-published'))
      setCampaign((prev) => ({
        ...prev!,
        status: CampaignStatus.active,
      }))
      await getData()
    }
  }
  const handleEditCampaignClicked = async () => {
    createCampaignModalRef.current!.show('edit', campaign!)
  }

  const handleEditEndDateClicked = async () => {
    if (!campaign) {
      return
    }

    const { endDate } = await setDateCampaignModalModalRef.current!.show(
      'edit',
      typeof campaign.endDate === 'string'
        ? new Date(campaign.endDate)
        : campaign.endDate
    )

    setLoading(true)

    const res = await updateCampaign({
      id: campaign.id,
      endDate: endDate!.format('YYYY-MM-DD'),
    })

    setLoading(false)

    if (!res.success) {
      message.error(res.message!)
    } else {
      message.success(res.message!)

      await getData()
    }
  }

  const handleConfirmDeleteClicked = async () => {
    const isConfirmed = await new Promise((resolve) =>
      Modal.confirm({
        closable: true,
        centered: true,
        icon: null,
        okButtonProps: { className: 'hidden' },
        cancelButtonProps: { className: 'hidden' },
        closeIcon: (
          <Image src={IcXCircle} alt="close-icon" width={22} height={22} />
        ),
        width: 'auto',
        content: (
          <div className="flex flex-col items-center">
            <H5>Delete Campaign</H5>
            <div className="py-10">
              <Text>Are you sure to delete this campaign?</Text>
            </div>
            <Button
              type="danger"
              onClick={() => {
                resolve(true)

                Modal.destroyAll()
              }}
            >
              Delete Campaign
            </Button>
          </div>
        ),
      })
    )

    if (isConfirmed) {
      setLoading(true)

      const res = await deleteCampaign({ id: campaign!.id })

      setLoading(false)

      if (!res.success) {
        message.error(res.message!)
      } else {
        message.success(res.message!)

        router.push('/campaigns')
      }
    }
  }

  const handleConfirmRemoveVideoClicked = useCallback(async () => {
    const isConfirmed = await new Promise((resolve) =>
      Modal.confirm({
        closable: true,
        centered: true,
        icon: null,
        okButtonProps: { className: 'hidden' },
        cancelButtonProps: { className: 'hidden' },
        closeIcon: (
          <Image src={IcXCircle} alt="close-icon" width={22} height={22} />
        ),
        width: 'auto',
        content: (
          <div className="flex flex-col items-center">
            <H5>{t('remove-video')}</H5>
            <div className="py-10">
              <Text>Are you sure to delete this video?</Text>
            </div>
            <Button
              type="danger"
              onClick={() => {
                resolve(true)

                Modal.destroyAll()
              }}
            >
              {t('remove-video')}
            </Button>
          </div>
        ),
      })
    )

    if (isConfirmed) {
      setLoading(true)

      const res = await removeCampaignVideo({ id: campaign!.id })

      setLoading(false)

      if (!res.success) {
        message.error(res.message!)
      } else {
        message.success(res.message!)

        setCampaign((prev) => ({
          ...prev!,
          video: undefined,
        }))
      }
    }
  }, [campaign, t])

  const dateState = useMemo(() => {
    if (campaign) {
      return getCampaignDateStatus(campaign, t)
    }
    return ''
  }, [campaign, t])

  const editable = useMemo(() => {
    if (
      !campaign ||
      campaign.status === CampaignStatus.ended ||
      [t('giving.campaign-ended'), ''].includes(dateState)
    ) {
      return false
    }

    return true
  }, [campaign, dateState, t])

  const getSymbol = (currency: string) =>
    giving.settingCurrencies?.[currency]?.symbol

  const VideoOptions = useMemo(() => {
    if (!campaign || !editable) return null
    return _.isNil(campaign.video) ? (
      <Button
        icon={
          <div className="mr-1 flex">
            <Image src={IcPlus} alt="plus-icon" width={15} height={15} />
          </div>
        }
        onClick={handleAddVideoClicked}
        className="w-full sm:w-auto sm:min-w-[160px]"
      >
        {t('add-video')}
      </Button>
    ) : (
      <ButtonMore
        className="sm:h-[46px] sm:w-[46px] sm:rounded-lg"
        data={[
          {
            key: '1',
            label: t('remove-video'),
            danger: true,
            icon: <Image src={IcDelete} alt="" />,
          },
        ]}
        onClick={handleConfirmRemoveVideoClicked}
      />
    )
  }, [
    campaign,
    editable,
    handleAddVideoClicked,
    handleConfirmRemoveVideoClicked,
    t,
  ])

  return (
    <PageLayout routeChangeLoading title={t('giving.giving-title')}>
      {!_.isNil(campaign) && (
        <>
          <div className="mb-8 rounded-2xl border-2 border-solid border-neutral-50 bg-neutral-10">
            <div className="border-0 border-b-2 border-solid border-neutral-50 p-6">
              <div className="relative flex items-start">
                <div className="hidden sm:flex">
                  <Image
                    src={campaign.image}
                    width={100}
                    height={100}
                    alt=""
                    className="rounded-xl"
                  />
                </div>
                <div className="flex sm:hidden">
                  <Image
                    src={campaign.image}
                    width={70}
                    height={70}
                    alt=""
                    className="rounded-xl"
                  />
                </div>
                <div className="ml-4 flex-1 sm:mx-6">
                  <div className="sm:w-4/5">
                    <H4 className="mb-1">{campaign.name}</H4>
                    <Text className="text-neutral-80">
                      {campaign.organization.name}
                    </Text>
                    <div className="mt-4 mb-3 h-3 w-full rounded-full bg-neutral-50 dark:bg-neutral-50">
                      <div
                        className="h-3 rounded-full bg-primary"
                        style={{
                          width: `${Math.min(
                            (campaign.totalFunds / campaign.goalAmount) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between">
                      <Text className="text-neutral-80">{dateState}</Text>
                      <Text>
                        {t('giving.campaign-of-goal', {
                          curr: toCurrency(campaign.totalFunds),
                          total: toCurrency(campaign.goalAmount),
                          symbol: getSymbol(campaign.currency),
                        })}
                      </Text>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 flex sm:static">
                  {campaign.status === CampaignStatus.draft && (
                    <Button
                      className="mr-1 py-0 sm:mr-3 sm:h-[46px] sm:min-w-[160px] "
                      onClick={handlePublishOption}
                    >
                      {t('publish')}
                    </Button>
                  )}
                  {editable && (
                    <ButtonMore
                      className="sm:h-[46px] sm:w-[46px] sm:rounded-lg"
                      data={getButtonOptions()}
                      onClick={(t) => {
                        switch (t.key) {
                          case '1':
                            handleEditCampaignClicked()
                            break
                          case '2':
                            handleEditEndDateClicked()
                            break
                          case '3':
                            handleConfirmDeleteClicked()
                            break
                          default:
                            break
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col p-6">
              <Text className="mb-2 font-bold">
                {t('giving.campaign-description')}
              </Text>
              <Text className="text-neutral-80">{campaign.description}</Text>
            </div>
          </div>
          {_.isNil(campaign.video) && !editable ? null : (
            <div className="mb-8">
              <div className="mb-4">
                <H4>{t('giving.campaign-media')}</H4>
              </div>
              <div className="rounded-2xl border-2 border-solid border-neutral-50 bg-neutral-10 p-6">
                <div className="flex flex-wrap items-center">
                  <div className="relative h-20 w-20 rounded-full bg-neutral-60">
                    {!_.isNil(campaign.video) ? (
                      <>
                        <Avatar
                          src={campaign.video.thumbnail}
                          alt=""
                          shape="circle"
                          size={80}
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center"
                          onClick={() => previewVideoModalRef.current!.show()}
                        >
                          <Image
                            src={IcPlay}
                            alt=""
                            width={24}
                            height={24}
                            className="pl-1"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <H3 className="m-0">🎥</H3>
                      </div>
                    )}
                  </div>
                  <div className="mx-6 flex-1">
                    <H5>
                      {!_.isNil(campaign.video)
                        ? campaign.video.title
                        : t('giving.add-campaign-media')}
                    </H5>
                    <Text className="text-neutral-80">
                      {!_.isNil(campaign.video)
                        ? campaign.video.description
                        : t('giving.add-campaign-media-desc')}
                    </Text>
                  </div>
                  <div className="mt-4 flex basis-full sm:mt-0 sm:basis-0">
                    {VideoOptions}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mb-8">
            <div className="gap-6 sm:flex">
              <div className="flex-1">
                <div className="mb-4">
                  <H4>{t('giving.campaign-activity')}</H4>
                </div>
                <div className="flex flex-col gap-6">
                  <RectangleStatBlock
                    stat={`${getSymbol(campaign.currency)}${toCurrency(
                      campaign.totalFunds
                    )}`}
                    title={t('giving.raised-funds')}
                    growUnit={`${campaign.totalFundsIncreasedPercent} %`}
                  />
                  <div className="flex gap-6">
                    <div className="-m-2 flex-1">
                      <ActivityBlock
                        activityType={t('giving.donors')}
                        count={campaign.donorIds.length}
                        textIcon="👥"
                      />
                    </div>
                    <div className="-m-2 flex-1">
                      <ActivityBlock
                        activityType={t('giving.groups')}
                        count={campaign.groups.length}
                        textIcon="⭐"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex-1 sm:mt-0">
                <div className="mb-4">
                  <H4>{t('giving.participating-groups')}</H4>
                </div>
                <div className="rounded-2xl border-2 border-solid border-neutral-50 bg-neutral-10 p-6">
                  <div className="flex flex-col gap-6">
                    {!_.isEmpty(campaign.groups) ? (
                      _.take(campaign.groups, 4).map((group, i) => (
                        <div key={i} className="flex items-center">
                          <div className="flex items-center space-x-6">
                            <div>
                              <Avatar src={group.avatar || ''} size={50} />
                            </div>
                            <div className="max-w-[240px]">
                              <LargerText strong>{group.name}</LargerText>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <Empty />
                    )}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <Link href={`${router.asPath}/participating-groups`}>
                    <Button type="secondary">
                      {t('view-all')}
                      <Image src={IcArrowRight} alt="" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-8">
            <div className="mb-4">
              <H4>{t('giving.donations')}</H4>
            </div>
            <Table<DonationOfUser>
              columns={[
                {
                  key: 'name',
                  title: t('giving.name').toUpperCase(),
                  dataIndex: 'name',
                  sorter: (a, b) => a.name.localeCompare(b.name),
                  render(val, row) {
                    return (
                      <div className="flex items-center space-x-6">
                        <div>
                          <Avatar src={row.image || ''} size={50} />
                        </div>
                        <div className="max-w-[240px]">
                          <LargerText strong>{val}</LargerText>
                        </div>
                      </div>
                    )
                  },
                },
                {
                  key: 'amount',
                  title: t('giving.gift-amount').toUpperCase(),
                  dataIndex: 'amount',
                  sorter: (a, b) => a.amount - b.amount,
                  render(value, record) {
                    return (
                      <Text>{`${getSymbol(record.currency)}${toCurrency(
                        value
                      )} `}</Text>
                    )
                  },
                },
                {
                  key: 'paidAt',
                  title: t('giving.date').toUpperCase(),
                  dataIndex: 'paidAt',
                  sorter: (a, b) => moment(a.paidAt).diff(moment(b.paidAt)),
                  render(val) {
                    return <Text>{moment(val).format('MMMM Do, YYYY')}</Text>
                  },
                },
              ]}
              dataSource={donations}
              rowClassName="hover:cursor-pointer"
              onRow={(row) => ({
                onClick: () => {
                  router.push(`/members/${row.id}`)
                },
              })}
            />
          </div>
          {!_.isNil(campaign.video) ? (
            <PreviewCampaignVideoModal
              ref={previewVideoModalRef}
              video={campaign.video}
            />
          ) : (
            <>
              <ChooseVideoOptionModal ref={chooseVideoOptionModalRef} />
              <AddYoutubeVideoModal ref={addYoutubeVideoModalRef} />
              <UploadVideoModal ref={uploadVideoModalRef} />
            </>
          )}
          <ChoosePublishOptionModal
            ref={choosePublishOptionModalRef}
            onClickPublishCampuses={handlePublishCampuses}
            onClickPublishGroups={handlePublishGroups}
          />
          <ChooseCampusModal
            ref={chooseCampusModalRef}
            skipCheckExistCampus={true}
          />
          <ChooseGroupsModal ref={chooseGroupsModalRef} />
          <SetDateCampaignModal ref={setDateCampaignModalModalRef} />
          <CreateCampaignModal
            ref={createCampaignModalRef}
            onChooseSuggestedGift={suggestedGiftModalRef.current?.show}
            onSetGoalAmount={setGoalAmountCampaignModalRef.current?.show}
            onFinish={getData}
          />
          <SuggestedGiftModal ref={suggestedGiftModalRef} />
          <SetGoalAmountCampaignModal ref={setGoalAmountCampaignModalRef} />
        </>
      )}
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
export default withPagePermissionChecker(CampaignDetailPage, {
  permissionsRequire: [],
  noPermissionView: true,
})
