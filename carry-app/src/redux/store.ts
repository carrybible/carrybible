import { applyMiddleware, compose, createStore } from 'redux'
import createReduxWaitForMiddleware from 'redux-wait-for-action'
import { persistReducer, persistStore } from 'redux-persist'
import storage from '@react-native-async-storage/async-storage'
import createSagaMiddleware from 'redux-saga'

import reducers from './reducers'
import sagas from './sagas'

import Reactotron from '../../ReactotronConfig'

class Store {
  store: any
  persistor: any

  constructor() {
    // Config persistStore
    const config = {
      key: 'root',
      keyPrefix: '',
      storage,
      blacklist: ['invite', 'screen', 'group', 'onboarding', 'groupActions', 'actionSteps', 'campuses', 'organisation'],
    }
    const reducer = persistReducer(config, reducers)

    // Redux saga
    const sagaOption: { sagaMonitor?: any } = {}
    if (__DEV__) {
      // @ts-ignore
      sagaOption.sagaMonitor = Reactotron.createSagaMonitor()
    }
    const sagaMiddleware = createSagaMiddleware(sagaOption)

    const enhancers = [applyMiddleware(sagaMiddleware), applyMiddleware(createReduxWaitForMiddleware())]
    if (__DEV__) {
      // @ts-ignore
      enhancers.push(Reactotron.createEnhancer())
    }
    this.store = createStore(reducer, compose(...enhancers))
    global.store = this.store
    // Create persistor
    this.persistor = persistStore(this.store)
    // Run saga
    sagaMiddleware.run(sagas)
  }
}

export default new Store()
