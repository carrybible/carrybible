import { httpsCallable } from 'firebase/functions'

import { Campaign, CampaignStatus, CampaignVideo } from '@dts/Campaign'
import Firebase from '@shared/Firebase/index'
import { GetDonationType } from '@shared/Firebase/giving'
import { ResponseType } from '@shared/Types/apiResponse'

export type CampaignCreate = {
  image: string
  name: string
  description: string
  goal: number
  currency: string
  suggestions: number[]
}

export type CampaignPublish = {
  id: string
  campusIds?: string[]
  groupIds?: string[]
  startDate: string
  endDate: string
}

export type CampaignUpdateEndDate = {
  id: string
  endDate: string
}

export const getCampaigns = async ({
  search,
  status,
  campusId,
  limit = 999,
  page = 1,
}: {
  search?: string
  status?: CampaignStatus
  campusId?: string
  limit?: number
  page?: number
}): Promise<ResponseType<Campaign[]>> => {
  try {
    const funcGetCampaigns = httpsCallable(
      Firebase.functions,
      'func_get_campaigns'
    )

    const data = (
      await funcGetCampaigns({
        search,
        status,
        campusId,
        limit,
        page,
      })
    ).data as ResponseType<Campaign[]>

    return data
  } catch (error) {
    return {
      success: false,
      data: [],
      message: 'can-not-get-campaigns',
    }
  }
}

export const getCampaign = async (
  id: string
): Promise<ResponseType<Campaign | null>> => {
  try {
    const funcGetCampaign = httpsCallable(
      Firebase.functions,
      'func_get_campaign_details'
    )

    const data = (await funcGetCampaign({ id })).data as ResponseType<Campaign>

    return data
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'can-not-get-campaign',
    }
  }
}

export const getCampaignDonations = async <T>(
  params: GetDonationType
): Promise<ResponseType<T[]>> => {
  try {
    const funcGetCampaignDonations = httpsCallable(
      Firebase.functions,
      'func_get_donations'
    )

    const data = (await funcGetCampaignDonations(params)).data as ResponseType<
      T[]
    >

    return data
  } catch (error) {
    return {
      success: false,
      data: [],
      message: 'can-not-get-campaign-donations',
    }
  }
}

export const createCampaign = async (
  params: CampaignCreate
): Promise<ResponseType<Campaign | null>> => {
  try {
    const funcCreateCampaign = httpsCallable(
      Firebase.functions,
      'func_create_campaign'
    )

    const data = (await funcCreateCampaign(params))
      .data as ResponseType<Campaign>

    return data
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'can-not-create-campaign',
    }
  }
}

export const updateCampaign = async (
  params: (CampaignCreate & { id: string }) | CampaignUpdateEndDate
): Promise<ResponseType<any>> => {
  try {
    const funcUpdateCampaign = httpsCallable(
      Firebase.functions,
      'func_update_campaign'
    )

    const data = (await funcUpdateCampaign(params)).data as ResponseType<any>

    return data
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'can-not-update-campaign',
    }
  }
}

export const publishCampaign = async (
  params: CampaignPublish
): Promise<ResponseType<any>> => {
  try {
    const funcPublishCampaign = httpsCallable(
      Firebase.functions,
      'func_publish_campaign'
    )

    const data = (await funcPublishCampaign(params)).data as ResponseType<any>

    return data
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'can-not-publish-campaign',
    }
  }
}

export const deleteCampaign = async (params: {
  id: string
}): Promise<ResponseType<any>> => {
  try {
    const funcDeleteCampaign = httpsCallable(
      Firebase.functions,
      'func_delete_campaign'
    )

    const data = (await funcDeleteCampaign(params)).data as ResponseType<any>

    return data
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'can-not-delete-campaign',
    }
  }
}

export const attachCampaignVideo = async (params: {
  id: string
  video: CampaignVideo
}): Promise<ResponseType<any>> => {
  try {
    const funcAttachCampaignVideo = httpsCallable(
      Firebase.functions,
      'func_attach_campaign_video'
    )

    const data = (await funcAttachCampaignVideo(params)).data as ResponseType<{
      result: boolean
    }>

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'can-not-attach-campaign-video',
    }
  }
}

export const removeCampaignVideo = async (params: {
  id: string
}): Promise<ResponseType<any>> => {
  try {
    const funcRemoveCampaignVideo = httpsCallable(
      Firebase.functions,
      'func_remove_campaign_video'
    )

    const data = (await funcRemoveCampaignVideo(params))
      .data as ResponseType<any>

    return data
  } catch (error) {
    return {
      success: false,
      data: null,
      message: 'can-not-remove-campaign-video',
    }
  }
}
