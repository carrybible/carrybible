import XCircleIcon from '@assets/icons/XCircleIcon.svg'
import CampusLeaderRole from '@assets/images/CampusLeaderRole.png'
import CampusUserRole from '@assets/images/CampusUserRole.png'
import MinistryAdminRole from '@assets/images/MinistryAdminRole.png'
import Button from '@components/Button'
import { usePermissionChecker } from '@components/PermissionsChecker'
import { H5, LargerText, Text } from '@components/Typography'
import { Modal } from 'antd'
import classNames from 'classnames'
import { useTranslation } from 'next-i18next'
import Image, { StaticImageData } from 'next/image'
import {
  forwardRef,
  ForwardRefRenderFunction,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'

type Props = {
  handleResult?: (role: string | undefined) => void
}

export type DashboardRoleSelectionModalRef = {
  show: () => Promise<'admin' | 'campus-leader' | 'campus-user' | undefined>
}

const Role = ({
  roleTitle,
  image,
  roleDesc,
  className,
  width,
  height,
  onClick,
  role,
}: {
  roleTitle: string
  image: StaticImageData
  roleDesc: string
  className?: string
  width?: number
  height?: number
  onClick?: (role: 'admin' | 'campus-leader' | 'campus-user') => void
  role: 'admin' | 'campus-leader' | 'campus-user'
}) => (
  <div
    className={classNames(
      'flex flex-row',
      'rounded-2xl border-2 border-solid border-neutral-50',
      'px-6 py-3',
      'cursor-pointer',
      className
    )}
    onClick={() => onClick?.(role)}
  >
    <Image
      src={image}
      width={width}
      height={height}
      alt="role-image"
      objectFit="contain"
    />
    <div className="mx-9 flex flex-col justify-center">
      <LargerText strong className="">
        {roleTitle}
      </LargerText>
      <Text className="text-neutral-70">{roleDesc}</Text>
    </div>
  </div>
)

const DashboardRoleSelectionModal: ForwardRefRenderFunction<
  DashboardRoleSelectionModalRef,
  Props
> = ({ handleResult }, ref) => {
  const [isModalVisible, setIsModalVisible] = useState(false)
  const { t } = useTranslation()
  const permitAddAdmin = usePermissionChecker({
    permissionsRequire: ['add-dashboard-admin'],
  })
  const permitAddCampusLeader = usePermissionChecker({
    permissionsRequire: ['add-dashboard-campus-leader'],
  })
  const permitAddCampusUser = usePermissionChecker({
    permissionsRequire: ['add-dashboard-campus-user'],
  })

  const resolveRef = useRef<
    | ((role: 'admin' | 'campus-leader' | 'campus-user' | undefined) => void)
    | null
  >(null)
  const [role, setRole] = useState<
    'admin' | 'campus-leader' | 'campus-user' | undefined
  >()

  useImperativeHandle(ref, () => ({
    show: () => {
      setIsModalVisible(true)
      return new Promise<'admin' | 'campus-leader' | 'campus-user' | undefined>(
        (resolve) => {
          resolveRef.current = resolve
        }
      )
    },
  }))

  const handleCancel = () => {
    resolveRef.current = null
    setRole(undefined)
    setIsModalVisible(false)
  }

  const onFinish = async () => {
    resolveRef.current?.(role)
    handleCancel()
    handleResult?.(role)
  }

  return (
    <Modal
      closable
      visible={isModalVisible}
      onCancel={handleCancel}
      closeIcon={
        <Image src={XCircleIcon} alt="close-icon" width={22} height={22} />
      }
      footer={null}
      centered
      wrapClassName="overflow-scroll no-scrollbar py-10"
    >
      <div className={classNames('flex flex-col', 'py-10')}>
        <H5 className="text-center">{t('settings.assign-a-role')}</H5>
        {permitAddAdmin && (
          <Role
            role="admin"
            roleTitle={t('settings.ministry-admin')}
            roleDesc={t('settings.ministry-admin-desc')}
            image={MinistryAdminRole}
            className={classNames(
              'mt-6',
              role === 'admin' && 'border-x-primary border-y-primary'
            )}
            width={100}
            height={100}
            onClick={setRole}
          />
        )}
        {permitAddCampusLeader && (
          <Role
            role="campus-leader"
            roleTitle={t('settings.campus-leader')}
            roleDesc={t('settings.campus-leader-desc')}
            image={CampusLeaderRole}
            className={classNames(
              'mt-6',
              role === 'campus-leader' && 'border-x-primary border-y-primary'
            )}
            width={160}
            height={160}
            onClick={setRole}
          />
        )}
        {permitAddCampusUser && (
          <Role
            role="campus-user"
            roleTitle={t('settings.campus-user')}
            roleDesc={t('settings.campus-user-desc')}
            image={CampusUserRole}
            className={classNames(
              'mt-6',
              role === 'campus-user' && 'border-x-primary border-y-primary'
            )}
            width={120}
            height={120}
            onClick={setRole}
          />
        )}
        <div className="flex items-center justify-center">
          <Button
            className="mt-10 w-1/3"
            type="primary"
            htmlType="submit"
            disabled={!role}
            onClick={onFinish}
            // loading={loading}
            // onClick={() => setModalVisble(false)}
          >
            {t('continue')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default forwardRef(DashboardRoleSelectionModal)
