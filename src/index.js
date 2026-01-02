/* eslint-disable */

window.Buffer = window.Buffer || require('buffer').Buffer

const EVENT_MESSAGES = {
  linkConnect: ``,
  verifyPhone: `verify-phone`,
  changePhone: `change-phone`,
  enableTransfer: `enable-transfer`,
  transferAssets: `transfer-assets`,
  cryptoSavings: `crypto-savings`,
  withdrawAssets: `withdraw-assets`,
  close: 'blockmate-iframe-close',
  redirect: 'redirect',
  deposit: 'deposit-exchange',
  directDeposit: 'deposit-wallet-connect',
  withdrawal: 'withdrawal-exchange',
}

const TRUSTED_ORIGINS = [
  'https://link.blockmate.io',
  'https://link-dev-ovh.blockmate.io',
  'https://link-cs.blockmate.io',
  'http://localhost:3000'
]

const OAUTH_QUERY_PARAM = 'oauthConnectedAccount'
const OAUTH_LOCAL_STORAGE_KEY = 'oauth_connected_account'
const DEPOSIT_OAUTH_SUCCESS_STEP = 'oauth_success'
const DEPOSIT_ID_PARAM = 'deposit_id'
const DEPOSIT_SUCCESS_PARAM = 'success'
const DEPOSIT_SUCCESS_PARAM_FOR_MERCHANT = 'payment_success'
const DEPOSIT_ERROR_STORAGE_KEY = 'deposit_error'
const DEPOSIT_JWT_LOCAL_STORAGE_KEY = 'deposit_jwt'
const DEPOSIT_LANG_LOCAL_STORAGE_KEY = 'deposit_lang'
const MODAL_TYPE_LOCAL_STORAGE_KEY = 'modal_type'

export const handleOpen = (
  message = '',
  accountId,
  oauthConnectedAccount,
  extraUrlParams
) => {
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect'
  }
  if (extraUrlParams?.jwt) {
    localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, extraUrlParams.jwt)
  }
  if (extraUrlParams?.lang) {
    localStorage.setItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY, extraUrlParams.lang)
  }
  const storedLang = localStorage.getItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY)
  const mergedExtraUrlParams = {
    ...(extraUrlParams ?? {})
  }
  if (!Object.hasOwn(mergedExtraUrlParams, 'lang') && storedLang) {
    mergedExtraUrlParams.lang = storedLang
  }
  localStorage.setItem(MODAL_TYPE_LOCAL_STORAGE_KEY, message)
  window.parent.postMessage(
    {
      type: message,
      accountId,
      oauthConnectedAccount,
      extraUrlParams: mergedExtraUrlParams
    },
    '*'
  )
}

export const handleClose = (endResult) => {
  window.parent.postMessage({ type: 'close', endResult }, '*')
}

export const handleRedirect = (targetUrl, inNewTab = false) => {
  window.parent.postMessage({ type: 'redirect', targetUrl, inNewTab }, '*')
}

export const handleInit = () => {
  window.parent.postMessage({ type: 'init' }, '*')
}

export const createLinkModal = ({
  jwt,
  url = 'https://link.blockmate.io/',
  cleanupActions = {},
  additionalUrlParams = null,
  pollingTimeoutMs = 1000
}) => {
  // For oauth
  const startOauthSuccessPolling = () => {
    const oauthPollingInterval = setInterval(() => {
      const params = new URLSearchParams(window.location.search)
      const maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM)
      if (maybeOauthConnectedAccount) {
        params.delete(OAUTH_QUERY_PARAM)
        localStorage.setItem(
          OAUTH_LOCAL_STORAGE_KEY,
          maybeOauthConnectedAccount
        )
        // // This will redirect the user to the same page without the query param, but with state in localStorage
        // location.replace(
        //   `${window.location.origin}${
        //     window.location.pathname
        //   }?${params.toString()}`
        // )
        window.close();
      }
    }, pollingTimeoutMs)
  }

  const startDepositSuccessPolling = () => {
    const depositSuccessPollingInterval = setInterval(() => {
      const params = new URLSearchParams(window.location.search)
      const maybeDepositIdParam = params.get(DEPOSIT_ID_PARAM)
      const maybeSuccessParam = String(
        params.get(DEPOSIT_SUCCESS_PARAM)
      ).toLowerCase()
      if (
        !maybeDepositIdParam ||
        !['true', 'false'].includes(maybeSuccessParam)
      ) {
        return
      }
      if (maybeSuccessParam === 'true') {
        localStorage.setItem(DEPOSIT_ERROR_STORAGE_KEY, 'success')
      } else if (maybeSuccessParam === 'false') {
        const detailParam = params.get('detail')
        localStorage.setItem(DEPOSIT_ERROR_STORAGE_KEY, detailParam)
      }
      params.delete(DEPOSIT_SUCCESS_PARAM)
      params.delete('detail')
      params.set(DEPOSIT_SUCCESS_PARAM_FOR_MERCHANT, maybeSuccessParam)
      location.replace(
        `${window.location.origin}${
          window.location.pathname
        }?${params.toString()}`
      )
    }, pollingTimeoutMs)
  }

  // For oauth
  const startLocalStoragePolling = () => {
    const localStoragePollingInterval = setInterval(() => {
      const oauthConnectedAccount = localStorage.getItem(
        OAUTH_LOCAL_STORAGE_KEY
      )
      const currentUrl = new URL(window.location.href)
      const oauthQueryParamDeletedAlready =
        !currentUrl.searchParams.has(OAUTH_QUERY_PARAM)
      const depositError = localStorage.getItem(DEPOSIT_ERROR_STORAGE_KEY)
      const depositErrorParamDeletedAlready = !currentUrl.searchParams.has(
        DEPOSIT_SUCCESS_PARAM
      )
      const modalType = localStorage.getItem(MODAL_TYPE_LOCAL_STORAGE_KEY)
      if (depositErrorParamDeletedAlready && typeof depositError === 'string') {
        createIframe(
          new URL(EVENT_MESSAGES?.[modalType] ?? '', url).href,
          undefined,
          undefined,
          undefined,
          depositError
        )
        localStorage.removeItem(DEPOSIT_ERROR_STORAGE_KEY)
      } else if (oauthConnectedAccount && oauthQueryParamDeletedAlready) {
        let path = EVENT_MESSAGES.linkConnect
        let step
        if (localStorage.getItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY)) {
          if (modalType === 'deposit') {
            path = EVENT_MESSAGES.deposit
            step = DEPOSIT_OAUTH_SUCCESS_STEP
          } else if (modalType === 'withdrawal') {
            path = EVENT_MESSAGES.withdrawal
            step = DEPOSIT_OAUTH_SUCCESS_STEP
          }
        }
        createIframe(
          new URL(path, url).href,
          undefined,
          oauthConnectedAccount,
          step,
          undefined
        )
        // Delete from localStorage, but from the original tab, not the new tab used from oauth
        const params = new URLSearchParams(window.location.search)
        const maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM)
        if (!maybeOauthConnectedAccount) {
          localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY)
        }
      }
    }, pollingTimeoutMs)
  }

  const body = document.querySelector('body')

  const spinnerId = 'iframe-loading-spinner'

  const createSpinner = () => {
    const spinnerWrapper = document.createElement('div')
    spinnerWrapper.setAttribute('id', spinnerId)
    spinnerWrapper.setAttribute(
      'style',
      `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 101;
      `
    )

    const spinner = document.createElement('div')
    spinner.setAttribute(
      'style',
      `
        width: 48px;
        height: 48px;
        border: 6px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `
    )

    spinnerWrapper.appendChild(spinner)
    body.appendChild(spinnerWrapper)

    const style = document.createElement('style')
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
    document.head.appendChild(style)
  }

  const iframeStyle =
    'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0; background-color: rgba(0, 0, 0, 0.55);'

  const createIframe = (
    url,
    accountId,
    oauthConnectedAccount,
    step,
    depositError,
    includeDefaultJwt = true
  ) => {
    const iframeId = 'link-iframe'
    const existingIframe = document.getElementById(iframeId)
    if (!existingIframe) {
      createSpinner();
      const iframeUrl = new URL(url)
      const parentUrlEncoded = Buffer.from(window.location.href).toString(
        'base64'
      )
      const token =
        includeDefaultJwt &&
        (jwt || localStorage.getItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY))
      const storedLang = localStorage.getItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY)
      const mergedAdditionalUrlParams = {
        ...(additionalUrlParams ?? {})
      }
      if (iframeUrl.searchParams.has('lang')) {
        delete mergedAdditionalUrlParams.lang
      } else if (!Object.hasOwn(mergedAdditionalUrlParams, 'lang') && storedLang) {
        mergedAdditionalUrlParams.lang = storedLang
      }
      const params = new URLSearchParams(window.location.search)
      const providerNameParam = params.get('providerName')
      const urlParamsArray = [
        ['jwt', token],
        ['accountId', accountId],
        ['step', step],
        ['depositError', depositError],
        ['providerName', providerNameParam],
        ['parentUrlEncoded', parentUrlEncoded],
        ...Object.entries(mergedAdditionalUrlParams)
      ].filter(([_, value]) => value)
      let urlParams = urlParamsArray
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      if (url.includes('?')) {
        urlParams = `&${urlParams}`
      } else if (urlParams.length > 0) {
        urlParams = `?${urlParams}`
      }
      let urlWithParams = `${url}${urlParams}`
      if (oauthConnectedAccount) {
        urlWithParams += `&${OAUTH_QUERY_PARAM}=${oauthConnectedAccount}`
      }

      const iframe = document.createElement('iframe')
      iframe.setAttribute('src', urlWithParams)
      iframe.setAttribute('style', iframeStyle)
      iframe.setAttribute('id', iframeId)
      iframe.setAttribute('allow', 'camera') // For QR-code scanning

      iframe.addEventListener('load', () => {
        const spinner = document.getElementById(spinnerId)
        if (spinner) spinner.remove()
      })

      body.appendChild(iframe)
    }
  }

  const removeIframe = (event) => {
    const iframe = document.querySelector('#link-iframe')
    if (iframe) {
      body.removeChild(iframe)
    }
    if (event.data.url) {
      window.location = event.data.url
    }

    const endResult = event?.data?.endResult
    if (endResult && cleanupActions[endResult]) {
      cleanupActions[endResult]()
    }
  }

  startDepositSuccessPolling()
  startOauthSuccessPolling()
  startLocalStoragePolling()

  window.onmessage = function (event) {
    if (!Object.hasOwn(EVENT_MESSAGES, event.data.type)) {
      return null
    }

    // These actions can only be called from within the iframe, check origin as they can perform redirects of the parent
    if (['close', 'redirect'].includes(event?.data?.type)) {
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        return null
      }
    }

    if (event?.data?.type === 'init') {
      localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
    } else if (event?.data?.type === 'close') {
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt)
      }
      removeIframe(event)
    } else if (event?.data?.type === 'redirect') {
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt)
      }
      const opened = window.open(event.data.targetUrl, event.data.inNewTab ? '_blank' : '_self');
      if (!opened) {
        console.error('Redirect BLOCKED');
      }
    } else {
      let urlParams = Object.entries(event?.data?.extraUrlParams ?? {})
        .map(([key, value]) => `${key}=${value}`)
        .join('&')
      if (urlParams.length > 0) {
        urlParams = `?${urlParams}`
      }
      const includeDefaultJwt = !event.data.extraUrlParams?.jwt
      createIframe(
        new URL(`${EVENT_MESSAGES[event.data.type]}${urlParams}`, url).href,
        event.data?.accountId,
        event.data?.oauthConnectedAccount,
        undefined,
        undefined,
        includeDefaultJwt
      )
    }
  }
}

// React component
export const LinkModal = ({
  jwt,
  url = 'https://link.blockmate.io/',
  cleanupActions = {},
  additionalUrlParams = null
}) => {
  createLinkModal({ jwt, url, cleanupActions, additionalUrlParams })
  return null
}

if (typeof window !== 'undefined') {
  window.BlockmateLink = {
    handleOpen,
    handleClose,
    handleRedirect,
    createLinkModal,
    handleInit
  }
}
