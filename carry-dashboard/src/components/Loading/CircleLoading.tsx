import circleLoading from '@assets/animations/circle-loading.json'
import React, { useEffect, useRef } from 'react'
import Lottie, { LottieProps } from 'react-lottie'

type Props = Partial<LottieProps>

let GLOBAL_CIRCLE_LOADING_TIME = {
  value: 0,
}

const CircleLoading: React.FC<Props> = (props) => {
  const ref = useRef(null)
  useEffect(() => {
    // @ts-ignore
    ref.current?.anim.goToAndPlay(GLOBAL_CIRCLE_LOADING_TIME.value, true)
  }, [])
  return (
    <Lottie
      ref={ref}
      width={300}
      height={300}
      isClickToPauseDisabled={true}
      options={{
        loop: true,
        autoplay: false,
        animationData: circleLoading,
        ...(props.options ?? {}),
      }}
      eventListeners={[
        {
          eventName: 'enterFrame',
          // @ts-ignore
          callback: (e: any) => {
            GLOBAL_CIRCLE_LOADING_TIME.value = e.currentTime
          },
        },
      ]}
      {...props}
    />
  )
}

export default CircleLoading
