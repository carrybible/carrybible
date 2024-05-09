/**
 * UnsplashPage
 *
 * @format
 *
 */
import BottomButton from '@components/BottomButton'
import Loading from '@components/Loading'
import { Text } from '@components/Typography'
import useScreenMode from '@hooks/useScreenMode'
import useTheme from '@hooks/useTheme'
import useUnsplashPaging from '@hooks/useUnsplashPaging'
import { Metrics } from '@shared/index'
import { UnsplashImage } from '@shared/Unsplash'
import { isIphoneXSMax } from '@shared/Utils'
import I18n from 'i18n-js'
import { debounce } from 'lodash'
import React, { useState } from 'react'
import { Dimensions, FlatList, StyleSheet, View } from 'react-native'
import ImageItem from './ImageItem'

interface Props {
  onImageSelect: (i: UnsplashImage) => void
}

const UnsplashPage: React.FC<Props> = props => {
  const { color } = useTheme()
  const [selectedImage, setSelectedImage] = useState<any>(undefined)
  const { landscape } = useScreenMode()
  const NUM_OF_COLS = (isIphoneXSMax() ? 4 : 3) * (landscape ? 2 : 1)
  const { width } = Dimensions.get('window')
  const ITEM_WIDTH = Math.floor((width - Metrics.insets.horizontal * 2 - (NUM_OF_COLS - 1) * 10) / NUM_OF_COLS)
  // eslint-disable-next-line no-unused-vars
  const [unsplashData, loadMore, refresh, _unused, status] = useUnsplashPaging(NUM_OF_COLS * 10)

  function renderEmpty() {
    if (status.loading || status.loadingMore || status.refreshing) {
      return <Loading style={s.flex} />
    }
    return <Text>No photo found</Text>
  }

  function handleSelectImage() {
    if (props.onImageSelect) props.onImageSelect(selectedImage)
  }

  return (
    <View style={[s.flex, { backgroundColor: color.background }]}>
      <FlatList
        key={NUM_OF_COLS}
        style={[s.flex, { backgroundColor: color.background }]}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={s.flatListContent}
        data={unsplashData}
        numColumns={NUM_OF_COLS}
        keyExtractor={(item, index) => index.toString()}
        getItemLayout={(data, index) => ({
          length: ITEM_WIDTH + 10,
          offset: (ITEM_WIDTH + 10) * index,
          index,
        })}
        onEndReached={debounce(loadMore, 200)}
        refreshing={status.refreshing}
        onRefresh={() => refresh(true)}
        renderItem={({ item, index }) => (
          <ImageItem
            width={ITEM_WIDTH}
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

UnsplashPage.defaultProps = {}

const s = StyleSheet.create({
  flex: { flex: 1 },
  flatListContent: {
    flexGrow: 1,
    paddingHorizontal: Metrics.insets.horizontal,
    paddingTop: Metrics.insets.horizontal,
  },
})

export default UnsplashPage
