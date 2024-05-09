import { StudyPlan } from '@dts/study'
import useTheme from '@hooks/useTheme'
import I18n from 'i18n-js'
import React, { useRef } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import WebView from 'react-native-webview'

const VideoPlayer = ({ video }: { video: StudyPlan.VideoAct; shouldHideVideo: boolean }) => {
  const viewRatio = useRef(1)
  const { color } = useTheme()
  const backgroundColor = color.id === 'light' ? color.white : color.black
  const { service, url } = video
  if (service !== 'web' || !url) {
    return null
  }
  return (
    <View
      style={s.vlcTouch}
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout
        viewRatio.current = width / height
      }}>
      <View style={s.content}>
        <WebView
          mediaPlaybackRequiresUserAction={Platform.OS !== 'android' || Platform.Version >= 17 ? false : undefined}
          userAgent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36"
          playsInline={true}
          allowsInlineMediaPlayback={true}
          source={{
            html: `
            <!DOCTYPE html>
            <html>
              <head>
                  <script src="https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js">
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@700&display=swap" rel="stylesheet">
                  </script>
                  <style>
                    video {
                      object-fit: cover;
                      position: absolute;
                      min-width: 100%;
                      min-height: 100%;
                      top: 50%;
                      left: 50%;
                      transform: translate(-50%, -50%);   
                      background-color: ${backgroundColor};  
                    }
                    .videoContainer {
                      background-color: ${backgroundColor};  
                    }
                    #overlay {
                      position: fixed; /* Sit on top of the page content */
                      width: 100%; /* Full width (cover the whole page) */
                      height: 100%; /* Full height (cover the whole page) */
                      display: flex;
                      top: 0;
                      left: 0;
                      right: 0;
                      bottom: 0;
                      justify-content: center;
                      align-items: center;
                      background-color: rgba(0,0,0,0.5); /* Black background with opacity */
                      flex-direction: 'column'
                      z-index: 2; /* Specify a stack order in case you're using a different order for other elements */
                      cursor: pointer; /* Add a pointer on hover */
                    }
                    .feather-48 {
                      width: 200px;
                      height: 200px;
                      color: white;
                    }
                    h1 {
                      font-family: 'Poppins', sans-serif; color: white; font-size: 50px;
                    }
                    .center {
                      align-items: center;
                      justify-content: center;
                      display: none;
                      flex-direction: column;
                    }
                    .loadingCenter {
                      align-items: center;
                      justify-content: center;
                      display: flex;
                      flex-direction: column;
                    }
                    .loader {
                      border: 16px solid #f3f3f3; /* Light grey */
                      border-top: 16px solid #3498db; /* Blue */
                      border-radius: 50%;
                      width: 120px;
                      height: 120px;
                      animation: spin 2s linear infinite;
                    }
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }

                    html, body { 
                    height: 100%;
                    overflow: hidden;
                    background-color: ${backgroundColor};  
                    }

                  </style>
              </head>
              <body>
                  <div class="videoContainer">
                    <video 
                      autoplay
                      onclick="playPause()" 
                      id="video1"
                      disableremoteplayback 
                      webkit-playsinlines 
                      playsinline
                      preload="metadata"
                      >
                      <source src="${url}">
                    </video>
                  </div>
                  <div onclick="playPause()" id="overlay">
                    <div id="controller" class="center">
                        <i class="feather-48" data-feather="play-circle"></i>
                        <h1 id="label"><h1>
                    </div>
                    <div id="loading" class="loadingCenter">
                        <div class="loader"></div>
                    </div>
                </div>
                  </div>
                  <script>
                    feather.replace()
                    var isVideoLoaded = false;
                    document.getElementById("overlay").style.display = "flex";
                    const resumeText = "${I18n.t('text.Resume')}";
                    const playText = "${I18n.t('text.Play')}";
                    const errorText = "${I18n.t('text.Something went wrong')}";
                    var video = document.getElementById("video1");
                    if (video.load) video.load();
                    var overlay = document.getElementById("overlay");
                    var label = document.getElementById("label");
                    var controller = document.getElementById("controller");
                    var loading = document.getElementById("loading");
                    var isError = false;
                    if (label) label.innerHTML = playText

                    video.addEventListener('ended',onEnded,false);
                    function onEnded(e) {
                      overlay.style.display = "flex";
                      label.innerHTML = playText
                      controller.style.display = "flex";
                      loading.style.display = "none";
                    }

                    video.addEventListener('playing',onPlaying,false);
                    function onPlaying(e) {
                      if (!isVideoLoaded){
                        isVideoLoaded = true;
                        video.pause();
                        overlay.style.display = "flex";
                        label.innerHTML = playText;
                        controller.style.display = "flex";
                        loading.style.display = "none";
                      } else {
                        overlay.style.display = "none";
                        loading.style.display = "none";
                      }
                    }

                    video.addEventListener('error',onError,false);
                    function onError(e) {
                      isError = true;
                      overlay.style.display = "flex";
                      loading.style.display = "none";
                      controller.style.display = "flex";
                      label.innerHTML = errorText
                    }

                    video.addEventListener( "loadedmetadata", function (e) {
                        var width = this.videoWidth,
                            height = this.videoHeight;
                        if (width && height){
                          if (width/height > ${viewRatio.current}){
                            video.style.minWidth = "100%"
                            video.style.minHeight = "0"
                          }
                          if (width/height < ${viewRatio.current}){
                            video.style.minWidth = "0"
                            video.style.minHeight = "100%"
                          }
                        }
                    }, false );
                    
                    function playPause() { 
                      if (isError) {
                        return;
                      }
                      if (video.paused) { 
                        video.play();
                        controller.style.display = "none";
                        loading.style.display = "flex";
                        label.innerHTML = resumeText
                        }
                      else {
                        video.pause();
                        overlay.style.display = "flex";
                        controller.style.display = "flex";
                        loading.style.display = "none";
                        }
                    } 

                  </script>
              </body>
            </html>
          `,
          }}
          useWebKit={true}
          originWhitelist={['*']}
          injectedJavaScript={`
             document.getElementsByTagName("video")[0].play();
         `}
          javaScriptEnabled={true}
          allowsFullscreenVideo={false}
          style={s.webView}
        />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  vlcTouch: { flex: 1, borderRadius: 20, height: '100%', width: '100%', backgroundColor: 'black' },
  content: { flex: 1 },
  webView: { width: '100%', height: '100%', borderRadius: 20 },
})

export default VideoPlayer
