/**
 * UnsplashPage
 *
 * @format
 *
 */
import BottomButton from '@components/BottomButton'
import Loading from '@components/Loading'
import { Text } from '@components/Typography'
import useCameraRollPaging from '@hooks/useCameraRollPaging'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import { useFocusEffect } from '@react-navigation/native'
import { Metrics } from '@shared/index'
import { UnsplashImage } from '@shared/Unsplash'
import { isIphoneXSMax } from '@shared/Utils'
import I18n from 'i18n-js'
import _ from 'lodash'
import React, { useRef, useState } from 'react'
import { Dimensions, FlatList, InteractionManager, StyleSheet, View } from 'react-native'
import ImageItem from './ImageItem'

interface Props {
  onImageSelect: (i: UnsplashImage) => void
}

const CameraPage: React.FC<Props> = props => {
  const { color } = useTheme()
  const firstFocus = useRef(true)
  const [selectedImage, setSelectedImage] = useState<any>(undefined)
  const { landscape } = useScreenMode()
  const NUM_OF_COLS = (isIphoneXSMax() ? 4 : 3) * (landscape ? 2 : 1)
  const { width } = Dimensions.get('window')
  const ITEM_WIDTH = Math.floor((width - Metrics.insets.horizontal * 2 - (NUM_OF_COLS - 1) * 10) / NUM_OF_COLS)

  const [data, loadMore, refresh, status] = useCameraRollPaging(NUM_OF_COLS * 10)

  useFocusEffect(
    React.useCallback(() => {
      const task = InteractionManager.runAfterInteractions(() => {
        if (firstFocus.current) {
          firstFocus.current = false
          refresh(false)
        }
      })

      return () => task.cancel()
    }, []),
  )

  function renderEmpty() {
    if (status.loading || status.loadingMore || status.refreshing) {
      return <Loading style={s.container} />
    }
    return <Text>No photo found</Text>
  }

  function handleSelectImage() {
    if (props.onImageSelect) props.onImageSelect(selectedImage)
  }

  return (
    <View style={[s.container, { backgroundColor: color.background }]}>
      <FlatList
        key={NUM_OF_COLS}
        style={[s.container, { backgroundColor: color.background }]}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={s.flatListContent}
        data={data}
        numColumns={NUM_OF_COLS}
        keyExtractor={(item, index) => index.toString()}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH + 10,
          offset: (ITEM_WIDTH + 10) * index,
          index,
        })}
        onEndReached={_.debounce(loadMore, 200)}
        // refreshing={status.refreshing}
        // onRefresh={() => refresh(true)}
        renderItem={({ item, index }) => (
          <ImageItem
            width={ITEM_WIDTH}
            isLocal
            selected={selectedImage?.id === item.id}
            isLastCol={index === NUM_OF_COLS - 1}
            url={item.urls.thumb}
            onPress={() => setSelectedImage(item)}
          />
        )}
      />
      <BottomButton title={I18n.t('text.Select')} rounded disabled={!selectedImage} onPress={handleSelectImage} />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  flatListContent: {
    flexGrow: 1,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingTop: 10,
  },
})

export default CameraPage
