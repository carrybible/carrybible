import { App } from '@dts/app'
import { AppEventsLogger } from 'react-native-fbsdk-next'

// let instance: Analytics

const useAnalytic = () => {
  // const _user = useRef<any>()
  // const _traits = useRef<any>()

  const identifyTrack = async (user: App.User, traits = {}) => {
    //   if ((user && Auth().currentUser) || traits) {
    //     _user.current = { ..._user.current, ...user }
    //     if (traits) _traits.current = { ..._traits.current, ...traits }
    //     const data = {
    //       name: user.name || '',
    //       email: user.email || Auth().currentUser?.email || '',
    //       chapterPerDay: user.habit || 1,
    //       purpose: user.describe || 'Unknown',
    //       currentStreak: user.currentStreak || 0,
    //       totalStreak: user.totalStreak || 0,
    //       longestStreak: user.longestStreak || 0,
    //       ..._traits.current,
    //     }
    //     await identify(user.uid, data)
    //     // console.info('[TrackEvent Mixpanel]', user.uid, data)
    //   }
    AppEventsLogger.setUserID(user?.uid)
  }

  /**
   * Log event
   * @param {string} name
   * @param {Object} props
   */
  const event = (name: string, props?: any) => {
    const data = {
      ...props,
      timestamp: new Date().getTime(),
    }
    // track(name, data)
    // console.info('[TrackEvent Mixpanel]', name, props)
    AppEventsLogger.logEvent(name, data)
  }

  /**
   * Log screen transition event
   * @param {string} name screen name
   * @param {Object} props properties of screen
   */
  const screenTrack = (name: string, props: any = {}) => {
    const screenName = name.split(/(?=[A-Z])/).join(' ')

    const data = {
      screen: screenName,
      ...props,
    }
    // screen(screenName, data)
    // console.info('[TrackEvent Mixpanel]', screenName, data)
    AppEventsLogger.logEvent(`View Screen ${screenName}`, data)
  }

  const resetTrack = () => {
    // console.info('[TrackEvent Mixpanel]', 'Reset')
    // reset()
  }

  return { event, screen: screenTrack, reset: resetTrack, identify: identifyTrack }
}

export { useAnalytic }
