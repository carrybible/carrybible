import { firestore } from 'firebase-admin'
import collections from '../types/collections'
import { MESSAGE_RESPONSE } from './Constants'
import Utils from './Utils'

interface GetPermissionsProps {
  permissions?: string[] // List permission to verify
  user: Carry.User | string
  target?: {
    data: Carry.User | Carry.Group | Carry.Campus | Carry.Organisation | string
    type: TargetType
    scope?: {
      groupId?: string
      campusId?: string
      orgnisationId?: string
    }
  }
}

type TargetType = 'user' | 'group' | 'campus' | 'org'
type FullTargets = 'group' | 'campus' | 'org' | 'member' | 'leader' | 'campus-leader' | 'admin' | 'owner'

export const getPermissions: (props: GetPermissionsProps) => Promise<string[]> = async ({
  permissions,
  user,
  target,
}: GetPermissionsProps) => {
  const userData = await getDataFromFirestore({ type: 'user', data: user })
  //Apply for GM
  if (userData.isGM) {
    await checkGM(userData)
  }

  const basePermissions = getPermissionsByRole(userData)
  let listPermissionToCheck: string[] = []

  let targetData: any = undefined

  if (!target) {
    listPermissionToCheck = basePermissions
  } else {
    targetData = await getDataFromFirestore({ type: target.type, data: target.data })
    const targetPermissions = getPermissionsForTarget(userData, target.type, targetData)
    listPermissionToCheck = [...basePermissions, ...targetPermissions]
  }

  let validPermissions: string[] = []
  if (permissions) {
    validPermissions = listPermissionToCheck.filter((per) => {
      for (const permission of permissions) {
        if (per.includes(permission)) return true
      }
      return false
    })
  } else {
    validPermissions = listPermissionToCheck
  }

  const validScopePermission: string[] = []
  const baseConditions = await getBaseConditions({
    user: userData,
    type: target?.type,
    target: targetData,
    scope: target?.scope,
  })
  validPermissions.forEach((permission) => {
    const conditions = permission.split('.')
    if (conditions.length === 1) {
      validScopePermission.push(permission)
    } else {
      let isValid = true
      conditions.forEach((condition, index) => {
        if (index !== 0) {
          switch (condition) {
            case 'as-owner':
              if (!baseConditions.isOwner) isValid = false
              break
            case 'as-group-owner':
              if (!baseConditions.isAsGroupLeader) isValid = false
              break
            case 'as-campus-leader':
              if (!baseConditions.isAsCampusLeader) isValid = false
              break
            case 'as-org-manager':
              if (!baseConditions.isAsOrgManager) isValid = false
              break
            case 'same-group':
              if (!baseConditions.isSameGroup) isValid = false
              break
            case 'same-campus':
              if (!baseConditions.isSameCampus) isValid = false
              break
            case 'same-org':
              if (!baseConditions.isSameOrg) isValid = false
              break
          }
        }
      })
      if (isValid) {
        validScopePermission.push(conditions[0])
      }
    }
  })
  return validScopePermission
}

const checkGM = async (user: Carry.User) => {
  if (user.isGM) {
    user.organisation = {
      id: user.defaultGMAccess ?? '',
      role: 'owner',
      accessedDashboard: true,
    }
    if (!user.organisation?.id) {
      if (user.gm?.accessAll && user.gm?.organisationIds) {
        user.organisation.id = user.gm?.organisationIds?.[0] ?? ''
      } else {
        const orgs = (await firestore().collection(collections.ORGANISATIONS).get()).docs.map(
          (x) => (x.data() as Carry.Organisation).id,
        )
        user.organisation.id = orgs?.[0] ?? ''
      }
    }
  }
  return user
}

const getPermissionsByRole: (user: Carry.User) => string[] = (user) => {
  if (user.organisation?.role) {
    return [...PERMISSIONS_MAP.defaultPermisisons, ...PERMISSIONS_MAP[user.organisation?.role].permissions]
  }
  return []
}

const getPermissionsForTarget: (user: Carry.User, targetType: TargetType, targetData?: Carry.User) => string[] = (
  user,
  targetType,
  targetData,
) => {
  const type = (
    targetType === 'user' && targetData?.organisation?.role ? targetData.organisation.role : targetType
  ) as FullTargets
  if (user.organisation?.role) {
    return [...PERMISSIONS_MAP.defaultToTarget, ...(PERMISSIONS_MAP[user.organisation.role]?.[type] || [])]
  }
  return []
}

export const getDataFromFirestore: (props: { user?: Carry.User; type?: TargetType; data: any }) => any = async ({
  user,
  type,
  data,
}) => {
  if (typeof data === 'string') {
    const id = data
    switch (type) {
      case 'user':
        const userRef = await firestore().collection('users').doc(id).get()
        return userRef.data()
      case 'group':
        const groupRef = await firestore().collection('groups').doc(id).get()
        return groupRef.data()
      case 'campus':
        const campusRef = await firestore()
          .collection('organisations')
          .doc(user?.organisation?.id || '')
          .collection('campuses')
          .doc(id)
          .get()
        return campusRef.data()
      case 'org':
        const orgRef = await firestore().collection('organisations').doc(id).get()
        return orgRef.data()
      default:
        return undefined
    }
  }
  return data
}

export const isAuthen: (user?: Carry.User | string, skipForUser?: boolean) => Promise<{
  success: boolean
  isAuthen?: boolean
  message?: string
  permissions?: string[]
  user: Carry.User
}> = async (user,skipForUser) => {
  const error = {
    success: false,
    isAuthen: false,
    message: MESSAGE_RESPONSE.UAUTHEN,
    user: user as Carry.User, // Bypass typescript
  }
  if (!user) return error
  const userData = await getDataFromFirestore({ data: user, type: 'user' })
  const permissions = await getPermissions({ user: userData })

  if (!skipForUser) {
    if (!permissions?.includes('view-dashboard')) {
      return error
    }
  }
  return {
    success: true,
    permissions: permissions,
    user: userData,
  }
}

const getBaseConditions: (props: {
  user: Carry.User
  type?: TargetType
  target: any
  scope?: {
    groupId?: string
    campusId?: string
    orgnisationId?: string
  }
}) => Promise<{
  isOwner: boolean
  isSameGroup: boolean
  isSameCampus: boolean
  isSameOrg: boolean
  isAsGroupLeader: boolean
  isAsCampusLeader: boolean
  isAsOrgManager: boolean
}> = async ({ user, type, target, scope }) => {
  const base = {
    isOwner: type === 'user' && user.uid === target?.uid,

    isSameGroup: false,
    isSameCampus: false,
    isSameOrg: false,

    isAsGroupLeader: false,
    isAsCampusLeader: false,
    isAsOrgManager: ['admin', 'owner'].includes(user.organisation?.role || ''),
  }
  switch (type) {
    case 'user':
      const targetUser = target as Carry.User
      const groupTarget = scope?.groupId
      if (groupTarget) {
        const group = (await firestore().doc(`${collections.GROUPS}/${groupTarget}`).get()).data() as Carry.Group
        if (group && group.members.includes(user.uid) && group.members.includes(target.uid)) {
          base.isSameCampus = true
        }
      } else {
        const groups = await firestore()
          .collection(collections.GROUPS)
          .where('organisation.id', '==', user.organisation?.id)
          .where('members', 'array-contains', user.uid)
          .get()
        groups.forEach((doc) => {
          if (doc.data()?.members?.includes(target.uid)) {
            base.isSameGroup = true
          }
        })
      }

      const campusTarget = scope?.campusId
      const userCampus = Utils.getCampus(user.organisation)
      const targetUserCampus = Utils.getCampus(targetUser.organisation)

      if (campusTarget) {
        base.isSameCampus = userCampus?.includes(campusTarget) && targetUserCampus?.includes(campusTarget)
        if (campusTarget && base.isSameCampus) {
          const campus = (await getDataFromFirestore({
            user: user,
            type: 'campus',
            data: campusTarget,
          })) as Carry.Campus
          base.isAsCampusLeader = campus?.leaders?.includes(user.uid)
        }
      } else {
        let flagSameCampus: string | undefined = undefined

        for (const campusId of userCampus) {
          if (targetUserCampus.includes(campusId)) {
            flagSameCampus = campusId
            break
          }
        }
        if (flagSameCampus) base.isSameCampus = true
        if (flagSameCampus && base.isSameCampus) {
          const campus = (await getDataFromFirestore({
            user: user,
            type: 'campus',
            data: flagSameCampus,
          })) as Carry.Campus
          base.isAsCampusLeader = campus?.leaders?.includes(user.uid)
        }
      }

      if (scope?.orgnisationId) {
        base.isSameOrg =
          targetUser.organisation?.id === user?.organisation?.id && user?.organisation?.id === scope?.orgnisationId
      } else {
        base.isSameOrg = targetUser.organisation?.id === user?.organisation?.id
      }
      break
    case 'group':
      const targetGroup = target as Carry.Group
      base.isAsGroupLeader = user.uid === targetGroup.owner

      if (scope?.orgnisationId) {
        base.isSameOrg =
          targetGroup.organisation?.id === user?.organisation?.id && user?.organisation?.id === scope?.orgnisationId
      } else {
        base.isSameOrg = targetGroup.organisation?.id === user?.organisation?.id
      }

      if (scope?.campusId) {
        base.isSameCampus =
          Utils.getCampus(user.organisation)?.includes(targetGroup.organisation?.campusId ?? '') &&
          targetGroup.organisation?.campusId === scope?.campusId
      } else {
        base.isSameCampus = Utils.getCampus(user.organisation)?.includes(targetGroup.organisation?.campusId ?? '')
      }

      break
    case 'campus':
      const targetCampus = target as Carry.Campus
      base.isAsCampusLeader = targetCampus.leaders?.includes(user.uid)

      if (scope?.campusId) {
        base.isSameCampus =
          Utils.getCampus(user.organisation)?.includes(targetCampus.id) && targetCampus.id === scope?.campusId
      } else {
        base.isSameCampus = Utils.getCampus(user.organisation)?.includes(targetCampus.id)
      }
      if (scope?.orgnisationId) {
        base.isSameOrg =
          targetCampus.organisationId === user.organisation?.id && user?.organisation?.id === scope?.orgnisationId
      } else {
        base.isSameOrg = targetCampus.organisationId === user.organisation?.id
      }
      break
    case 'org':
      const targetOrg = target as Carry.Organisation
      base.isSameOrg = targetOrg.id === user.organisation?.id
      break
  }
  return base
}

/* Note for logic
- .as-owner: Must be owner of user profile
- .as-group-owner: Must be owner or that group
- .as-campus-leader: Must be leader or that campus
- .as-org-manager: Must be admin or owner of that orgnisation
- .same-group: Both user and target must be in the same group
- .same-campus: Both user and target must be in the same campus
- .same-org: Both user and target must be in the same org

Things to remember:
- for target 'group','campus','orgnisation', check is user belong to that scope or not
*/

export const PERMISSIONS_MAP = {
  defaultPermisisons: [
    'edit-profile.as-owner',
    'delete-account.as-owner',
    'leave-group.as-owner',
    // If leader leave group, the group will be delete
  ],
  defaultToTarget: ['view-profile-member.same-group', 'invite-group-member'],
  member: {
    permissions: [],
    member: [],
    leader: [],
    'campus-user': [],
    'campus-leader': [],
    admin: [],
    owner: [],
    group: [],
    campus: [],
    org: [],
  },
  leader: {
    permissions: ['create-group'],
    member: ['remove-member-from-group.same-group.as-group-owner'],
    leader: ['remove-member-from-group.same-group.as-group-owner'],
    'campus-user': [],
    'campus-leader': [],
    admin: [],
    owner: [],
    group: [
      'view-members.as-group-owner',
      'view-group.as-group-owner',
      'edit-group.as-group-owner',
      'delete-group.as-group-owner',
    ],
    campus: [],
    org: [],
  },
  'campus-user': {
    permissions: [
      'view-dashboard',
      'view-dashboard-groups',
      'view-dashboard-members',

      'create-group', // can assign to other
      'view-group.same-campus.as-campus-leader',
      'edit-group.same-campus.as-campus-leader',
      'delete-group.same-campus.as-campus-leader',

      'view-profile-member.same-campus',
      'invite-create-group',
      'view-plan',
      'view-group',
    ],
    member: [
      'change-role-to-leader.same-campus.as-campus-leader',
      'remove-member-from-group.same-group.as-group-owner',
    ],
    leader: [
      'change-role-to-member.same-campus.as-campus-leader',
      'remove-member-from-group.same-group.as-group-owner',
    ],
    'campus-user': [],
    'campus-leader': [],
    admin: [],
    owner: [],
    group: [
      'view-members.as-group-owner',
      'view-group.as-group-owner',
      'edit-group.as-group-owner',
      'delete-group.as-group-owner',
    ],
    campus: [],
    org: [],
  },
  'campus-leader': {
    permissions: [
      'view-dashboard',
      'view-dashboard-groups',
      'view-dashboard-members',
      'view-dashboard-campuses',
      'view-dashboard-settings',

      'create-group', // can assign to other
      'view-group.same-campus.as-campus-leader',
      'edit-group.same-campus.as-campus-leader',
      'delete-group.same-campus.as-campus-leader',

      'view-profile-member.same-campus',
      'add-dashboard-campus-user',
      'invite-create-group',
      'view-plan',
      'view-group',
    ],
    member: [
      'change-role-to-leader.same-campus.as-campus-leader',
      'change-role-to-campus-user.same-campus.as-campus-leader',
      'remove-member-from-group.same-campus.as-campus-leader',
      'remove-member-from-campus.same-campus.as-campus-leader',
    ],
    leader: [
      'change-role-to-member.same-campus.as-campus-leader',
      'change-role-to-campus-user.same-campus.as-campus-leader',

      'remove-member-from-campus.same-campus.as-campus-leader',
    ],
    'campus-user': [
      'change-role-to-member.same-campus.as-campus-leader',
      'change-role-to-leader.same-campus.as-campus-leader',
    ],
    'campus-leader': [],
    admin: [],
    owner: [],
    group: [],
    campus: ['view-members.as-campus-leader', 'view-campus.as-campus-leader', 'edit-campus.as-campus-leader'],
    org: [],
  },
  admin: {
    permissions: [
      'view-dashboard',
      'view-dashboard-groups',
      'view-dashboard-members',
      'view-dashboard-campuses',
      'view-dashboard-settings',
      'view-dashboard-integrations',

      'create-group',
      'view-group.same-org',
      'edit-group.same-org',
      'delete-group.same-org',

      'view-campus.same-org',
      'view-campus',
      'create-campus',
      'edit-campus',
      'edit-campus.same-org',

      'view-profile-member.same-org',

      'integrate-planning-center',

      'edit-orgnisation.as-org-manager',
      'view-members.as-org-manager',
      'add-dashboard-campus-user',
      'remove-dashboard-campus-user',
      'add-dashboard-campus-leader',
      'invite-create-group',
      'view-plan',
      'view-group',
      'remove-member',
      'edit-profile',
      'view-campaign',
      'create-campaign',
      'update-campaign',
      'delete-campaign',
      'view-fund',
      'create-fund',
      'update-fund',
      'delete-fund',
    ],
    member: [
      'change-role-to-leader.same-org',
      'change-role-to-campus-user.same-org',
      'change-role-to-campus-leader.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    leader: [
      'change-role-to-member.same-org',
      'change-role-to-campus-user.same-org',
      'change-role-to-campus-leader.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    'campus-user': [
      'change-role-to-member.same-org',
      'change-role-to-leader.same-org',
      'change-role-to-campus-leader.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    'campus-leader': [
      'change-role-to-member.same-org',
      'change-role-to-leader.same-org',
      'change-role-to-campus-user.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    admin: [],
    owner: [],
    group: [],
    campus: [],
    org: [],
  },
  owner: {
    permissions: [
      'connect-stripe',

      'view-dashboard',
      'view-dashboard-groups',
      'view-dashboard-members',
      'view-dashboard-campuses',
      'view-dashboard-settings',
      'view-dashboard-giving',
      'view-dashboard-integrations',

      'create-group',
      'view-group.same-org',
      'edit-group.same-org',
      'delete-group.same-org',

      'view-campus.same-org',
      'view-campus',
      'create-campus',
      'edit-campus',
      'edit-campus.same-org',

      'view-profile-member.same-org',

      'integrate.planning-center',
      'edit-orgnisation.as-org-manager',
      'view-members.as-org-manager',
      'add-dashboard-campus-user',
      'add-dashboard-campus-leader',
      'add-dashboard-admin',
      'remove-dashboard-campus-user',
      'invite-create-group',
      'view-plan',
      'view-group',
      'remove-member',
      'edit-profile',
      'view-campaign',
      'create-campaign',
      'update-campaign',
      'delete-campaign',
      'view-fund',
      'create-fund',
      'update-fund',
      'delete-fund',
    ],
    member: [
      'change-role-to-leader.same-org',
      'change-role-to-campus-user.same-org',
      'change-role-to-campus-leader.same-org',
      'change-role-to-admin.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    leader: [
      'change-role-to-member.same-org',
      'change-role-to-campus-user.same-org',
      'change-role-to-campus-leader.same-org',
      'change-role-to-admin.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    'campus-user': [
      'change-role-to-member.same-org',
      'change-role-to-leader.same-org',
      'change-role-to-campus-leader.same-org',
      'change-role-to-admin.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    'campus-leader': [
      'change-role-to-member.same-org',
      'change-role-to-leader.same-org',
      'change-role-to-campus-user.same-org',
      'change-role-to-admin.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    admin: [
      'change-role-to-member.same-org',
      'change-role-to-leader.same-org',
      'change-role-to-campus-user.same-org',
      'change-role-to-campus-leader.same-org',

      'remove-member-from-group.same-org',
      'remove-member-from-campus.same-org',
      'remove-member-from-org.same-org',
    ],
    owner: [],
    group: [],
    campus: [],
    org: [],
  },
}

export default {}
