import Toast from '@components/Toast'
import { App } from '@dts/app'
import { Campaign } from '@dts/campaign'
import firebase from '@react-native-firebase/app'
import firestore from '@react-native-firebase/firestore'
import functions from '@react-native-firebase/functions'
import axios from 'axios'
import { Config } from '..'
import collections from './collections'

/**
 * Return the reference to a new Space in Firestore
 */

function ref(id: string) {
  return firestore().collection(collections.ORGANISATIONS).doc(id)
}

const getOrganisation = async (data: any) => {
  try {
    const organisation = await firestore().collection(`${collections.ORGANISATIONS}`).doc(`${data.organisationId}`).get()
    return organisation.data()
  } catch (e) {
    return { isError: true, error: e }
  }
}

const getGroups = async (orgId: string) => {
  try {
    const groupsRef = firestore().collection(collections.GROUPS).where('organisation.id', '==', orgId)
    const groupDocs = (await groupsRef.get()).docs
    const groups = groupDocs.map(g => g.data())
    return groups
  } catch (error) {
    devLog('Can not get groups for organisation')
  }
}

const getSharedGroupFromCode = async (invitation: App.Codes) => {
  try {
    const groupsRef = firestore()
      .collection(collections.GROUPS)
      .where('id', 'in', invitation.sharedGroups || [])
    const groupDocs = (await groupsRef.get()).docs
    const groups = groupDocs.map(g => g.data())
    return groups
  } catch (error) {
    devLog('Can not get groups for organisation')
    return []
  }
}

async function sharePlanToOrg({ planId, orgId }: { planId: string; orgId: string }): Promise<{ success: boolean }> {
  try {
    const request = functions().httpsCallable('func_share_plan_to_org')
    const response = await request({
      planId,
      orgId,
    })

    return { success: response.data.success }
  } catch (e) {
    devLog(`Can't share user plan to org`, e)
    return { success: false }
  }
}

async function getMobileOrgPlans(orgId: string) {
  const orgPlansRef = await ref(orgId).collection(collections.ORG_PLANS).where('shareWithMobile', '==', true)
  const orgPlans = await orgPlansRef.get()
  return Promise.all(
    orgPlans.docs.map(async plan => {
      const sharePlanData = plan.data()
      return sharePlanData
    }),
  )
}

async function getOrgSharedPlans(orgId: string, isGetDetail = false, getRecommened = false) {
  let sharePlansRef
  sharePlansRef = await ref(orgId).collection(collections.SHARED_PLANS)
  if (getRecommened) {
    sharePlansRef = await ref(orgId).collection(collections.SHARED_PLANS).where('recommended', '==', true)
  }
  const sharePlans = await sharePlansRef.get()

  if (!isGetDetail) {
    return sharePlans.docs.map(plan => plan.id)
  } else if (getRecommened) {
    return Promise.all(
      sharePlans.docs.map(async plan => {
        const sharePlanData = plan.data()
        return sharePlanData
      }),
    )
  } else {
    return Promise.all(
      sharePlans.docs
        .map(async plan => {
          const sharePlanData = plan.data()
          if (!sharePlanData?.recommended) return (await sharePlanData.data.get())?.data()
          return null
        })
        .filter(data => !!data),
    )
  }
}

async function getMemberOrgInfo(orgId?: string, userId?: string): Promise<{ data?: App.MemberOrg; isError: boolean; error?: unknown }> {
  try {
    const memberOrgInfo = await firestore()
      .collection(collections.ORGANISATIONS)
      .doc(orgId)
      .collection(collections.ORG_MEMBERS)
      .doc(userId)
      .get()
    return {
      data: memberOrgInfo.data(),
      isError: false,
    } as { data?: App.MemberOrg; isError: boolean; error?: unknown }
  } catch (e) {
    return { isError: true, error: e }
  }
}

async function addRecommendedOrgPlan(orgId: string, mockData: any) {
  try {
    if (orgId) {
      const sharePlansRef = await ref(orgId).collection(collections.SHARED_PLANS)
      await sharePlansRef.add({
        ...mockData,
      })
      return { success: true }
    }
  } catch (error) {
    return { success: false }
  }
}

async function getCampaigns(
  orgId: string,
  campusId: string,
  groupId: string,
): Promise<{ success: boolean; message?: string; data?: Campaign[] }> {
  const user = firebase.auth().currentUser
  if (!user || !campusId) {
    return { success: false, message: 'User not found!' }
  }
  const { data } = await functions().httpsCallable('func_get_campaigns')({
    page: 1,
    limit: 999,
    campusId,
    groupId,
    organisationId: orgId,
  })
  if (!data.success) {
    Toast.error(data.message)
    return { success: false, message: data.message, data: [] }
  }
  return data
}

async function getTithing(campusId: string, organisationId: string): Promise<{ success: boolean; message?: string; data?: Campaign[] }> {
  const user = firebase.auth().currentUser
  if (!user || !campusId) {
    return { success: false, message: 'User not found!' }
  }
  const { data } = await functions().httpsCallable('func_get_tithings')({
    campusId,
    page: 1,
    limit: 999,
    organisationId,
  })
  if (!data.success) {
    Toast.error(data.message)
    return { success: false, message: data.message, data: [] }
  }
  return data
}

async function getCampaignDetail(orgId: string, campaignId: string): Promise<{ success: boolean; message?: string; data?: Campaign }> {
  const user = firebase.auth().currentUser

  if (!user || !campaignId) {
    return { success: false, message: 'Data not found!' }
  }
  const result = await functions().httpsCallable('func_get_campaign_details')({
    id: campaignId,
    organisationId: orgId,
  })

  const { data } = result
  if (!data.success) {
    Toast.error(data.message)
    return { success: false, message: data.message }
  }
  return data
}

async function getOrgInfo(orgId: string): Promise<App.Organisation | { success: boolean; message: string }> {
  const user = firebase.auth().currentUser
  if (!user || !orgId) {
    return { success: false, message: 'User not found!' }
  }
  const orgResult = (await firestore().collection('organisations').doc(orgId).get()).data()
  return orgResult as App.Organisation
}

const confirmPayment = async (code: string) => {
  try {
    const response = await axios.post(`${Config.SERVER}/func_confirm_checkout`, {
      code,
    })

    const { success, message, data } = response.data as any
    if (!success) {
      Toast.error(message)
      return ''
    } else {
      return data.id
    }
  } catch (e: any) {
    devLog('[ERROR CONFIRM CHECKOUT]', e)
    Toast.error(e.message)
    return ''
  }
}

const isCheckoutConfirmed = async (id: string) => {
  try {
    const checkoutDoc = await firestore().collection(collections.CHECKOUTS).doc(id).get()
    const checkoutData = checkoutDoc.data() as StripCheckout

    if (!checkoutData) return false

    const request = checkoutData.requestOptions

    const donateDocs = await firestore()
      .collection(collections.ORGANISATIONS)
      .doc(request.info.organisationId)
      .collection(collections.DONATES)
      .where('transactionDetails.checkoutId', '==', 'id')
      .get()

    if (donateDocs.docs.length > 0) {
      return donateDocs.docs[0].id
    }
    return ''
  } catch (e: any) {
    devLog('[ERROR CONFIRM CHECKOUT]', e)
    Toast.error(e.message)
    return ''
  }
}

export interface StripCheckout {
  status: 'open' | 'expired' | 'complete'
  id: string
  url: string
  requestOptions: {
    uid: string
    amount: number | undefined
    currency: string
    info: {
      type: 'campaign' | 'tithe'
      eventId: string
      eventName: string
      groupId: string
      groupName: string
      campusId: string
      campusName?: string
      organisationId: string // Support donate from guest
      productName?: string
    }
  }
  identifierCode: string
}

export default {
  ref,
  getOrganisation,
  getGroups,
  getSharedGroupFromCode,
  sharePlanToOrg,
  getOrgSharedPlans,
  addRecommendedOrgPlan,
  getMobileOrgPlans,
  getMemberOrgInfo,
  getCampaigns,
  getTithing,
  getOrgInfo,
  getCampaignDetail,
  confirmPayment,
  isCheckoutConfirmed,
}
