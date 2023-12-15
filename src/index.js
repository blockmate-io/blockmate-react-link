const linkUrl = 'https://link-dev-ovh.blockmate.io/'

export const handleOpen = (message = '', accountId) => {
  console.log(message)
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect'
  }
  window.parent.postMessage({ type: EVENT_MESSAGES[message], accountId }, '*')
}

export const handleClose = (url) => {
  window.parent.postMessage({ type: EVENT_MESSAGES.close, url }, '*')
}

const EVENT_MESSAGES = {
  linkConnect: `${linkUrl}`,
  close: 'blockmate-iframe-close',
  verifyPhone: `${linkUrl}verify-phone`,
  changePhone: `${linkUrl}change-phone`,
  enableTransfer: `${linkUrl}enable-transfer`,
  transferAssets: `${linkUrl}transfer-assets`,
  cryptoSavings: `${linkUrl}crypto-savings`
}

export const LinkModal = ({ jwt, url, cleanupActions = {} }) => {
  console.log('link modal init')
  if (!jwt) return null

  const body = document.querySelector('body')

  const iframeStyle =
    'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0'

  const createIframe = (url, accountId) => {
    console.log('create iframe')
    const iframeId = 'link-iframe'
    const existingIframe = document.getElementById(iframeId)
    if (!existingIframe) {
      const iframe = document.createElement('iframe')
      iframe.setAttribute('src', `${url}/?jwt=${jwt}&accountId=${accountId}`)
      iframe.setAttribute('style', iframeStyle)
      iframe.setAttribute('id', iframeId)
      body.appendChild(iframe)
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
    console.log('onmessage', event)
    if (!Object.values(EVENT_MESSAGES).includes(event.data.type)) {
      console.log('on message null')
      return null
    }
    if (event?.data?.type === EVENT_MESSAGES.close) {
      removeIframe(event)
    } else {
      console.log('else create iframe')
      createIframe(event.data.type, event.data.accountId)
    }
  }

  return null
}
