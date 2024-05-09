import GroupFilledIcon from '@assets/icons/GroupFilledIcon.svg'
import GroupIcon from '@assets/icons/GroupIcon.svg'
import HomeFilledIcon from '@assets/icons/HomeFilledIcon.svg'
import HomeIcon from '@assets/icons/HomeIcon.svg'
import MemberFilledIcon from '@assets/icons/MemberFilledIcon.svg'
import MemberIcon from '@assets/icons/MemberIcon.svg'
import Permissions from '@shared/Permissions'
import PlanIcon from '@assets/icons/PlanIcon.svg'
import GivingIcon from '@assets/icons/GivingIcon.svg'
import GivingFilledIcon from '@assets/icons/GivingFilledIcon.svg'
import PlanFilledIcon from '@assets/icons/PlanFilledIcon.svg'
import SettingIcon from '@assets/icons/SettingIcon.svg'
import SettingFilledIcon from '@assets/icons/SettingFilledIcon.svg'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { useAppSelector } from '@redux/hooks'

const useMenuItem = () => {
  const { t } = useTranslation()
  const org = useAppSelector((state) => state.organisation)
  const me = useAppSelector((state) => state.me)

  return useMemo(() => {
    let hideSetting = false
    const organisation = org?.info

    // Check if all tab in setting is hidden
    if (
      !organisation ||
      (organisation.settings?.showUsers === false &&
        (!['owner', 'admin'].includes(me.organisation?.role || '') ||
          (organisation.settings?.showCampuses === false &&
            !(organisation.billing?.enabled && organisation.billing?.url) &&
            !organisation.giving?.allowSetup)))
    ) {
      hideSetting = true
    }
    return [
      {
        key: 'home',
        label: t('menu.home'),
        icon: HomeIcon,
        iconSelected: HomeFilledIcon,
        iconAlt: 'Home Icon',
        permission: Permissions.VIEW_DASHBOARD,
        path: '/home',
      },
      {
        key: 'groups',
        label: t('menu.groups'),
        icon: GroupIcon,
        iconSelected: GroupFilledIcon,
        iconAlt: 'Group Icon',
        permission: Permissions.VIEW_DASHBOARD_GROUPS,
        path: '/groups',
      },
      {
        key: 'members',
        label: t('menu.members'),
        icon: MemberIcon,
        iconSelected: MemberFilledIcon,
        iconAlt: 'Member Icon',
        permission: Permissions.VIEW_DASHBOARD_MEMBERS,
        path: '/members',
      },
      {
        key: 'plans',
        label: t('menu.plans'),
        icon: PlanIcon,
        iconSelected: PlanFilledIcon,
        iconAlt: 'Plan Icon',
        // permission: Permissions.VIEW_DASHBOARD_PLANS,
        path: '/plans',
      },
      {
        key: 'giving',
        label: t('menu.giving'),
        icon: GivingIcon,
        iconSelected: GivingFilledIcon,
        iconAlt: 'Giving Icon',
        permission: Permissions.VIEW_DASHBOARD_GIVING,
        path: '/giving',
        disable:
          !org?.info?.giving?.isConnected || !org?.info?.giving?.allowSetup,
      },
      {
        key: 'settings',
        label: t('menu.settings'),
        icon: SettingIcon,
        iconSelected: SettingFilledIcon,
        iconAlt: 'Setting Icon',
        permission: Permissions.VIEW_DASHBOARD_SETTINGS,
        path: '/settings',
        disable: hideSetting,
      },
    ]
  }, [org, me.organisation?.role, t])
}

export default useMenuItem
