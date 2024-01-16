const EVENT_MESSAGES = {
  linkConnect: ``,
  verifyPhone: `verify-phone`,
  changePhone: `change-phone`,
  enableTransfer: `enable-transfer`,
  transferAssets: `transfer-assets`,
  cryptoSavings: `crypto-savings`,
  withdrawAssets: `withdraw-assets`,
  close: 'blockmate-iframe-close'
}

export const handleOpen = (message = '', accountId) => {
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect'
  }

  window.parent.postMessage({ type: message, accountId }, '*')
}

export const handleClose = (url) => {
  window.parent.postMessage({ type: 'close', url }, '*')
}

export const LinkModal = ({
  jwt,
  url = 'https://link.blockmate.io/',
  cleanupActions = {},
  additionalUrlParams= null
}) => {
  if (!jwt) return null

  const body = document.querySelector('body')
  const iframeStyle =
    'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0'

  const createIframe = (url, accountId) => {
    const iframeId = 'link-iframe'
    const existingIframe = document.getElementById(iframeId)
    if (!existingIframe) {
      let additionalParamsStr = '';
      if (additionalUrlParams) {
        additionalParamsStr = Object.keys(additionalUrlParams).map(key =>
          `&${key}=${additionalUrlParams[key]}
        `).join('');
      }
      const urlWithParams = `${url}/?jwt=${jwt}&accountId=${accountId}${additionalParamsStr}`

      const iframe = document.createElement('iframe')
      iframe.setAttribute('src', urlWithParams)
      iframe.setAttribute('style', iframeStyle)
      iframe.setAttribute('id', iframeId)
      iframe.setAttribute('allow', 'camera');  // For QR-code scanning
      body.appendChild(iframe);
    }
  }

  const removeIframe = (event) => {
    const iframe = document.querySelector('#link-iframe')
    body.removeChild(iframe)
    if (event.data.url) {
      window.location = event.data.url
    }

    const endResult = event?.data?.endResult
    if (endResult && cleanupActions[endResult]) {
      cleanupActions[endResult]()
    }
  }

  window.onmessage = function (event) {
    if (!Object.hasOwn(EVENT_MESSAGES, event.data.type)) {
      return null
    }

    if (event?.data?.type === 'close') {
      removeIframe(event)
    } else {
      createIframe(
        new URL(EVENT_MESSAGES[event.data.type], url).href,
        event.data.accountId
      )
    }
  }

  return null
}
