import { Campaign } from '@dts/campaign'
import { call, put, takeLatest } from '@redux-saga/core/effects'
import { TYPES } from '@redux/actions'
import { Firestore } from '@shared/index'
import { getRealGivingStatus } from '@shared/Utils'
import { RootState } from '@dts/state'

function* loadOrg({ payload }: { type: string; payload: { campusId: string; orgId: string } }) {
  const orgInfo = yield call(Firestore.Organisations.getOrgInfo, payload.orgId)
  yield put({
    type: TYPES.ORGANISATION.UPDATE,
    payload: {
      orgInfo,
    },
  })
}

function* loadTithing({ payload }: { type: string; payload: { campusId: string; organisationId: string } }) {
  const tithingsData = yield call(Firestore.Organisations.getTithing, payload.campusId, payload.organisationId)
  const tithings = tithingsData.data
  yield put({
    type: TYPES.ORGANISATION.UPDATE,
    payload: {
      tithings,
    },
  })
}

function* loadCampaigns({ payload }: { type: string; payload: { organisation: RootState['group']['organisation']; groupId: string } }) {
  const organisation = payload.organisation
  const groupId = payload.groupId
  if (!organisation?.id || !organisation?.campusId) return

  const campaignData = yield call(Firestore.Organisations.getCampaigns, organisation.id, organisation.campusId, groupId)
  const campaigns = campaignData.data
  const endedCampaigns: Campaign[] = []
  const activeCampaigns: Campaign[] = campaigns.filter((camp: Campaign) => {
    const realStatus = getRealGivingStatus(camp)
    if (realStatus === 'active') {
      return true
    } else if (realStatus === 'ended') {
      endedCampaigns.push(camp)
    }
  })
  yield put({
    type: TYPES.ORGANISATION.UPDATE,
    payload: {
      campaigns,
      endedCampaigns,
      activeCampaigns,
    },
  })
}

export default [
  takeLatest(TYPES.ORGANISATION.GET_ORG, loadOrg),
  takeLatest(TYPES.ORGANISATION.GET_TITHINGS, loadTithing),
  takeLatest(TYPES.ORGANISATION.GET_CAMPAIGNS, loadCampaigns),
]
