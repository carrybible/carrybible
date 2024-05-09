import firebase from '@react-native-firebase/app'
import ReduxSagaFirebase from 'redux-saga-firebase'
export default new ReduxSagaFirebase(firebase.app())
