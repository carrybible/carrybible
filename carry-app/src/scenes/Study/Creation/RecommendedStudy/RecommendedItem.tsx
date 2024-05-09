import Avatar from '@components/Avatar'
import { Subheading, Text } from '@components/Typography'
import useTheme from '@hooks/useTheme'
import Firestore from '@shared/Firestore'
import Styles from '@shared/Styles'
import I18n from 'i18n-js'
import React, { FC, useState, useEffect } from 'react'
import { View, StyleSheet, TouchableOpacity } from 'react-native'
interface Props {
  item: {
    author: string
    name: string
    featuredImage: string
    duration: string
    authorInfo: {
      name: string
    }
    description: string
  }
  index: number
  onSelect: (index: number) => void
  selecting: boolean
  orgName: string
}

const RecommendedItem: FC<Props> = props => {
  const { item, selecting, onSelect, index } = props
  const { color } = useTheme()
  const onPress = () => onSelect(index)

  const [creatorName, setCreatorName] = useState('')

  useEffect(() => {
    const getName = async () => {
      if (item.authorInfo?.name) return setCreatorName(item.authorInfo?.name)
      if (item.author) {
        setCreatorName('...')
        const user = await Firestore.User.getUser({ uid: item.author })
        if (user?.name) return setCreatorName(user.name)
      }
      setCreatorName(props.orgName || '')
    }

    getName()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        { backgroundColor: color.middle },
        color.id === 'light' ? Styles.shadow2 : Styles.shadowDark,
        styles.container,
        { borderColor: selecting ? color.accent : color.middle },
      ]}>
      <View style={styles.row}>
        <Avatar url={item.featuredImage} size={60} loading={false} pressable={false} />
        <View style={styles.contentContainer}>
          <Text bold>{item.name}</Text>
          <Subheading color="gray" numberOfLines={1}>
            {I18n.t('text.recommended description', {
              totalDay: item.duration,
              plural: Number(item.duration) > 1 ? 's' : '',
              authorName: creatorName,
            })}
          </Subheading>
        </View>
      </View>
      {item.description !== 'No descriptions' && (
        <Subheading numberOfLines={3} style={styles.des}>
          {item.description}
        </Subheading>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 15,
    marginHorizontal: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginTop: 10,
    borderWidth: 2,
  },
  contentContainer: {
    justifyContent: 'center',
    marginHorizontal: 16,
    flex: 1,
  },
  des: {
    marginTop: 10,
  },
  row: { flexDirection: 'row' },
})

export default RecommendedItem
