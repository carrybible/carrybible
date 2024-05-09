/**
 * @format
 */

import './src/config/global'
import { AppRegistry } from 'react-native'
import '@shared/I18n'
import App from './App'
import { name as appName } from './app.json'

AppRegistry.registerComponent(appName, () => App)
