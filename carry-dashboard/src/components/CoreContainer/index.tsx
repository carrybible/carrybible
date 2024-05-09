import Authentication from '@components/Authentication'
import { persistor, store } from '@redux/store'
import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'

import RouterLoader from './RouterLoader'

const CoreContainer: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Authentication>
          <RouterLoader>{children}</RouterLoader>
        </Authentication>
      </PersistGate>
    </Provider>
  )
}
export default CoreContainer
