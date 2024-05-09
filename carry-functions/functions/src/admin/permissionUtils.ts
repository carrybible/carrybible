import { firestore } from 'firebase-admin'
import { logger } from 'firebase-functions'
import _ from 'lodash'

import { ROLE_BASE, SCOPE } from '../shared/Constants'
import stringUtils from '../shared/stringUtils'
import collections from '../types/collections'

export const getPermissionOfUser = async function (userId: string | undefined, scope: string, scopeId: string) {
  if (stringUtils.isNullOrEmpty(userId)) return null
  const userInfo = (await firestore().doc(`/users/${userId}`).get()).data() as Carry.User

  if (!userInfo) {
    logger.log(`Permission Error: User with id(${userId}) not found`)
    throw Error(`User with id(${userId}) not found`)
  }

  switch (scope) {
    case SCOPE.ORGANISATION:
      return await GetPermissionOfUserInOrg(userInfo, scopeId)
    case SCOPE.CAMPUS:
      return await GetPermissionOfUserInCampus(userInfo, scopeId)
    case SCOPE.GROUP:
      return await GetPermissionOfUserInGroup(userInfo, scopeId)
    case SCOPE.DASHBOARD:
      return await GetPermissionBaseOnRole(userInfo.organisation?.role)
    case SCOPE.MEMBER:
      return await GetPermissionBaseOnRole(userInfo.organisation?.role)
    default:
      break
  }
  return null
}

export const checkPermissionInPage = function (pagePermissions: string[], userPermission: string[]) {
  let flag = false
  for (const permission of userPermission) {
    if (pagePermissions.includes(permission)) {
      flag = true
      break
    }
  }
  return flag
}

async function GetPermissionOfUserInOrg(userInfo: Carry.User, orgId: string) {
  if (userInfo.organisation?.id !== orgId || stringUtils.isNullOrEmpty(userInfo.organisation?.role)) return null
  return await GetPermissionBaseOnRole(userInfo.organisation.role)
}

async function GetPermissionOfUserInCampus(userInfo: Carry.User, campusId: string) {
  if (stringUtils.isNullOrEmpty(userInfo.organisation?.id)) return null
  const org = (await firestore().doc(`/organisations/${userInfo.organisation?.id}`).get()).data() as Carry.Organisation

  if (!org) {
    logger.log(`Permission Error: Campus with id(${campusId}) not found`)
    throw Error(`Campus with id(${campusId}) not found`)
  }

  const listCampus: Array<Carry.Campus> = [] as Array<Carry.Campus>

  ;(
    await firestore()
      .doc(`${collections.ORGANISATIONS}/${userInfo.organisation?.id}`)
      .collection(collections.CAMPUS)
      .where('id', '==', campusId)
      .get()
  ).forEach((element) => {
    const data = element.data() as Carry.Campus
    listCampus.push(data)
  })

  if (listCampus) {
    logger.log(`Permission Error: Campus with id(${campusId}) not found`)
    throw Error(`Campus with id(${campusId}) not found`)
  }

  const campus = listCampus[0] as Carry.Campus

  if (userInfo.organisation?.campusId !== campusId || stringUtils.isNullOrEmpty(userInfo.organisation?.role))
    return null

  if (
    campus.leaders.includes(userInfo.organisation?.campusId) ||
    ((userInfo.organisation?.role === ROLE_BASE.OWNER || userInfo.organisation.role === ROLE_BASE.ADMIN) &&
      userInfo.organisation.id === campus.organisationId)
  ) {
    return await GetPermissionBaseOnRole(userInfo.organisation?.role)
  } else {
    return await GetPermissionBaseOnRole(ROLE_BASE.MEMBER)
  }
}

async function GetPermissionOfUserInGroup(userInfo: Carry.User, groupId: string) {
  const groupInfo = (await firestore().doc(`/groups/${groupId}`).get()).data() as Carry.Group

  if (!groupInfo) {
    logger.log(`Permission Error: Group with id(${groupId}) not found`)
    throw Error(`Group with id(${groupId}) not found`)
  }

  if (
    userInfo.uid === groupInfo.owner ||
    userInfo.organisation?.role === ROLE_BASE.LEADER ||
    isCanManageGroup(userInfo, groupInfo)
  ) {
    return await GetPermissionBaseOnRole(userInfo.organisation?.role)
  } else {
    return await GetPermissionBaseOnRole(ROLE_BASE.MEMBER)
  }
}

function isCanManageGroup(userInfo: Carry.User, groupInfo: Carry.Group) {
  //User is manage campus, and group include in campus
  if (
    !stringUtils.isNullOrEmpty(userInfo.organisation?.campusId) &&
    !stringUtils.isNullOrEmpty(groupInfo.organisation?.campusId) &&
    userInfo.organisation?.campusId === groupInfo.organisation?.campusId &&
    userInfo.organisation?.role === ROLE_BASE.CAMPUSLEADER
  )
    return true

  //User is manage org
  if (
    !stringUtils.isNullOrEmpty(userInfo.organisation?.id) &&
    !stringUtils.isNullOrEmpty(groupInfo.organisation?.id) &&
    userInfo.organisation?.id === groupInfo.organisation?.id &&
    (userInfo.organisation?.role === ROLE_BASE.ADMIN || userInfo.organisation?.role === ROLE_BASE.OWNER)
  )
    return true

  return false
}

async function GetPermissionBaseOnRole(role: string | null | undefined) {
  if (stringUtils.isNullOrEmpty(role)) return []
  return (await firestore().doc(`/permissions/${role}`).get()).data() as Array<string>
}

export default { getPermissionOfUser, checkPermissionInPage }
