export const handleOpen = (event, accountId) => {
  if (!Object.keys(EVENT_MESSAGES).includes(event)) {
    event = 'linkConnect'
  }
  window.parent.postMessage({ type: EVENT_MESSAGES[event], accountId }, '*')
}

export const handleClose = (url) => {
  window.parent.postMessage({ type: EVENT_MESSAGES.close, url }, '*')
}

const EVENT_MESSAGES = {
  linkConnect: 'https://link.blockmate.io/',
  close: 'blockmate-iframe-close',
  verifyPhone: 'https://link.blockmate.io/verify-phone',
  changePhone: 'https://link.blockmate.io/change-phone',
  enableTransfer: 'https://link.blockmate.io/enable-transfer',
  transferAssets: 'https://link.blockmate.io/transfer-assets'
}


export const LinkModal = ({ jwt, url }) => {
  if (!jwt) return null

  const body = document.querySelector('body')

  const iframeStyle =
    'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0'

  const createIframe = (url, accountId) => {
    const iframe = document.createElement('iframe')
    iframe.setAttribute('src', `${url}/?jwt=${jwt}&accountId=${accountId}`)
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
    if (!Object.values(EVENT_MESSAGES).includes(event.data.type)) {
      return null
    }
    if (event?.data?.type === EVENT_MESSAGES.close) {
      removeIframe(event)
    } else {
      createIframe(event.data.type, event.data.accountId)
    }
  }

  return null
}
