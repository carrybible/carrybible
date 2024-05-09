import React, { memo } from 'react'
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native'
import FastImage from 'react-native-fast-image'
import Icon from '@components/Icon'
import { Styles } from '@shared/index'

function areEqual(prevProps, nextProps) {
  return (
    prevProps.url === nextProps.url &&
    prevProps.selected === nextProps.selected &&
    prevProps.isLocal === nextProps.isLocal &&
    prevProps.isLastCol === nextProps.isLastCol
  )
}

type Props = {
  url?: string
  selected: boolean
  isLastCol: boolean
  onPress?: () => void
  isLocal?: boolean
  width: number
}

const ImageItem = memo<Props>(
  ({ url, selected, isLastCol, onPress, isLocal, width }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      {isLocal ? (
        // eslint-disable-next-line react-native/no-inline-styles
        <Image source={{ uri: url }} style={[styles.image, { marginRight: isLastCol ? 0 : 10, width }]} />
      ) : (
        // eslint-disable-next-line react-native/no-inline-styles
        <FastImage source={{ uri: url || '' }} style={[styles.image, { marginRight: isLastCol ? 0 : 10, width }]} />
      )}
      {selected && (
        <View style={[styles.image, styles.selectedOverlay]}>
          <Icon source="check" color="white" size={30} />
        </View>
      )}
    </TouchableOpacity>
  ),
  areEqual,
)

const styles = StyleSheet.create({
  image: {
    aspectRatio: 1,
    ...Styles.br7,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedOverlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    ...StyleSheet.absoluteFillObject,
  },
})

export default ImageItem
