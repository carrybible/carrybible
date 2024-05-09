const Permissions = {
  // Dashboard wise permissions
  VIEW_DASHBOARD: 'view-dashboard',
  VIEW_DASHBOARD_GROUPS: 'view-dashboard-groups',
  VIEW_DASHBOARD_MEMBERS: 'view-dashboard-members',
  VIEW_DASHBOARD_PLANS: 'view-dashboard-plans',
  VIEW_DASHBOARD_CAMPUSES: 'view-dashboard-campuses',
  VIEW_DASHBOARD_SETTINGS: 'view-dashboard-settings',
  VIEW_DASHBOARD_INTEGRATIONS: 'view-dashboard-integrations',
  VIEW_DASHBOARD_GIVING: 'view-dashboard-giving',

  // Member wise permissions
  VIEW_PROFILE_MEMBER: 'view-profile-member',
  EDIT_PROFILE: 'edit-profile',
  DELETE_ACCOUNT: 'delete-account',
  REMOVE_MEMBER: 'remove-member',

  // Group wise permissions
  VIEW_GROUP: 'view-group',
  CREATE_GROUP: 'create-group',
  EDIT_GROUP: 'edit-group',
  DELETE_GROUP: 'delete-group',
  LEAVE_GROUP: 'leave-group',
  INVITE_GROUP_MEMBER: 'invite-group-member',

  // Role permissions
  CHANGE_ROLE_TO_LEADER: 'change-role-to-leader',
  CHANGE_ROLE_TO_MEMBER: 'change-role-to-member',
  REMOVE_MEMBER_FROM_GROUP: 'remove-member-from-group',
  REMOVE_MEMBER_FROM_CAMPUS: 'remove-member-from-campus',
  REMOVE_MEMBER_FROM_ORG: 'remove-member-from-org',

  // Campus permissions
  VIEW_CAMPUS: 'view-campus',
  CREATE_CAMPUS: 'create-campus',
  EDIT_CAMPUS: 'edit-campus',

  // Miscellaneous
  INTEGRATE: 'integrate',
  INTEGRATE_PLANNING_CENTER: 'integrate-planning-center',
  EDIT_ORGANISATION: 'edit-organisation',
}

export default Permissions
