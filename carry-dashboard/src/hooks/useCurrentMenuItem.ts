import useMenuItems from '@hooks/useMenuItems'
import { useRouter } from 'next/router'

const useCurrentMenuItem = () => {
  const router = useRouter()
  const menuItems = useMenuItems()
  return menuItems.find((menuItem) =>
    menuItem.path === '/'
      ? router.pathname === menuItem.path
      : router.pathname.startsWith(menuItem.path)
  )
}

export default useCurrentMenuItem
