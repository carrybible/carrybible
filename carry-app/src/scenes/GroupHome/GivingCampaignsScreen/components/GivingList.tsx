import EmptyData from '@components/EmptyData'
import { Campaign } from '@dts/campaign'
import useTheme from '@hooks/useTheme'
import Metrics from '@shared/Metrics'
import I18n from 'i18n-js'
import React, { forwardRef, LegacyRef } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Platform } from 'react-native'
import Animated from 'react-native-reanimated'
import GivingItem from './GivingItem'

type Props = {
  type: 'current-giving' | 'past-giving'
  data: Campaign[]
  onScroll?: ((event: NativeSyntheticEvent<NativeScrollEvent>) => void) | undefined
  paddingTopStyle: any
  ref: LegacyRef<any> | undefined
}

const GivingList = forwardRef(({ data, onScroll, paddingTopStyle }: Props, ref) => {
  const { color } = useTheme()
  const renderItem = ({ item }) => <GivingItem campaign={item} />
  const keyThreadExtractor = (item: Campaign) => `${item.id}`

  return (
    <>
      <Animated.FlatList
        ref={ref}
        scrollToOverflowEnabled={false}
        scrollEventThrottle={1}
        onScroll={onScroll}
        showsVerticalScrollIndicator={false}
        data={data}
        renderItem={renderItem}
        keyExtractor={keyThreadExtractor}
        ListHeaderComponent={(Platform.OS === 'ios' && <Animated.View style={[styles.listHeader, paddingTopStyle]} />) || undefined}
        ListEmptyComponent={
          <EmptyData
            type="textIcon"
            text={I18n.t('text.No giving')}
            image={'🤝'}
            style={styles.emptyData}
            iconContainerStyle={{ backgroundColor: `${color.accent}40` }}
          />
        }
        ListFooterComponent={<Animated.View style={styles.footer} />}
      />
    </>
  )
})

const styles = StyleSheet.create({
  listHeader: {
    marginVertical: 2,
  },
  footer: {
    height: 300,
  },
  emptyData: { marginTop: 40 },
})

export default GivingList
