import AsyncStorage from '@react-native-async-storage/async-storage'
import Reactotron, { overlay } from 'reactotron-react-native'
import { reactotronRedux } from 'reactotron-redux'
import sagaPlugin from 'reactotron-redux-saga'

const reactotron = Reactotron

reactotron
  .setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: 'Carry Bible',
  })
  .use(overlay())
  .use(sagaPlugin())
  .use(reactotronRedux())
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate/,
    },
    errors: { veto: stackFrame => false },
  })
  .connect()

console.tron = reactotron

export default reactotron
