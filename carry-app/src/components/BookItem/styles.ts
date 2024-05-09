import { StyleSheet } from 'react-native'
import { Metrics } from '@shared/index'

export default StyleSheet.create({
  cover: {
    marginHorizontal: Metrics.insets.horizontal,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    height: 50,
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  title: {},
  icon: { marginLeft: 15, marginRight: 8 },
})
