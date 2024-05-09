let channel: BroadcastChannel
export const setupAuthBroadcastChannel = () => {
  channel = new BroadcastChannel('carry_dashboard_authentication_bus')
  channel.onmessage = function (e) {
    const { type } = e.data ?? {}

    if (type === 'logged-in' || type === 'logged-out') {
      window.location.reload()
    }
  }
}

export const sendLoggedInMessage = () => {
  channel?.postMessage({
    type: 'logged-in',
  })
}
export const sendLoggedOutMessage = () => {
  channel?.postMessage({
    type: 'logged-out',
  })
}
