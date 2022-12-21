export const handleOpen = () => {
  window.parent.postMessage({ type: EVENT_MESSAGES.open }, '*')
}

export const handleClose = (url) => {
  window.parent.postMessage({ type: EVENT_MESSAGES.close, url }, '*')
}

const EVENT_MESSAGES = {
  open: 'blockmate-iframe-open',
  close: 'blockmate-iframe-close'
}

export const LinkModal = ({ jwt, url = 'https://link-dev.blockmate.io' }) => {
  if (!jwt) return null

  const body = document.querySelector('body')

  const iframeStyle =
    'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0'

  const createIframe = () => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('src', `${url}/?jwt=${jwt}`)
    iframe.setAttribute('style', iframeStyle)
    iframe.setAttribute('id', 'link-iframe')
    body.appendChild(iframe)
  }

  const removeIframe = (event) => {
    const iframe = document.querySelector('#link-iframe')
    body.removeChild(iframe)
    if (event.data.url) {
      window.location = event.data.url
    }
  }

  window.onmessage = function (event) {
    if (event?.data?.type === EVENT_MESSAGES.close) {
      removeIframe(event)
    }
    if (event?.data?.type === EVENT_MESSAGES.open) {
      createIframe()
    }
  }

  return null
}
