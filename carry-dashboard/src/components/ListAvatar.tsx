import { BasicUserType } from '@shared/Firebase/report'
import { Avatar } from 'antd'
import classNames from 'classnames'
import * as React from 'react'
import { Text } from './Typography'
import { doc, DocumentReference, getDoc } from 'firebase/firestore'
import Firebase from '@shared/Firebase/index'
import { User } from '@dts/User'
import { DEFAULT_USER_AVATAR } from '@shared/Constants'

type Props = {
  className?: string
  users?: Array<BasicUserType>
  maxImage?: number
  size?: number
}

const ListAvatar: React.FC<Props> = ({
  users,
  maxImage = 4,
  className,
  size = 28,
}) => {
  const [data, setData] = React.useState<
    Array<{ src: string; alt?: string; id: string }>
  >([])

  React.useEffect(() => {
    if (users && Firebase) {
      const getAvatars = async () => {
        const userDocs = await Promise.all(
          users.map((user) => {
            const memberRef = doc(
              Firebase.firestore,
              Firebase.collections.USERS,
              user.uid
            ) as DocumentReference<User>
            return getDoc(memberRef)
          })
        )
        setData(
          userDocs.map((userDoc, index) => {
            const userData = userDoc.data()
            return {
              src: userData?.image || DEFAULT_USER_AVATAR,
              alt: userData?.name || 'user',
              id: userData?.id || String(index),
            }
          })
        )
      }
      getAvatars()
    }
  }, [users])

  return (
    <div className={classNames('flex items-center', className)}>
      <div className="flex -space-x-1 overflow-hidden">
        {data.slice(0, maxImage).map((item) => (
          <Avatar
            key={item?.id}
            src={item.src}
            alt={item.alt}
            style={{
              width: size,
              height: size,
            }}
            className="ring-2 ring-neutral-10"
          />
        ))}
      </div>
      {data.length > maxImage && (
        <Text strong className="ml-1 !font-['Roboto'] text-neutral-70">
          +
        </Text>
      )}
    </div>
  )
}

export default ListAvatar
