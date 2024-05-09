import { StudyPlan } from '@dts/study'
import Metrics from '@shared/Metrics'
import { wait } from '@shared/Utils'
import React, { useCallback, useState } from 'react'
import YoutubePlayer from 'react-native-youtube-iframe'
import qs from 'query-string'
import { LoadingContainer } from './WebVideo'

const YoutubeVideo = ({ video }: { video: StudyPlan.VideoAct }) => {
  const [videoReady, setVideoReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  let v = ''
  const onStateChange = useCallback(state => {
    if (state === 'ended') {
      setPlaying(false)
    }
  }, [])

  if (video.url) {
    const params = qs.parseUrl(video.url)
    v = params.query.v as string
  }
  if (video.service !== 'youtube' || (!video.videoId && !v)) {
    return null
  }

  return (
    <LoadingContainer isReady={videoReady}>
      <YoutubePlayer
        height={Metrics.screen.width * 0.58}
        play={playing}
        videoId={video.videoId || v}
        onChangeState={onStateChange}
        onReady={async () => {
          await wait(250)
          setVideoReady(true)
        }}
      />
    </LoadingContainer>
  )
}

export default YoutubeVideo
