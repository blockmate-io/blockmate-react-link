/* eslint-disable */
import { Buffer } from 'buffer'

window.Buffer = window.Buffer || Buffer

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
  redirectClose: 'redirect-close',
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

const TAB_ID_SESSION_KEY = 'bm_deposit_id'
const TAB_ID_PREFIX = 'blockmate'
const KEY_TIMESTAMP_SUFFIX = '__ts'
const MAX_STORED_DEPOSITS = 4

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

const getTabId = () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const depositId = params.get(DEPOSIT_ID_PARAM)
    if (depositId) {
      return depositId
    }
    return sessionStorage.getItem(TAB_ID_SESSION_KEY) || null
  } catch (error) {
    return null
  }
}

const getNamespacedKey = (key, tabId) => {
  return tabId ? `${TAB_ID_PREFIX}:${tabId}:${key}` : key
}

const getLocalStorageItem = (key) => {
  const tabId = getTabId()
  const storageKey = getNamespacedKey(key, tabId)
  return localStorage.getItem(storageKey)
}

const setLocalStorageItem = (key, value) => {
  const tabId = getTabId()
  const storageKey = getNamespacedKey(key, tabId)
  localStorage.setItem(storageKey, value)
  if (tabId) {
    localStorage.setItem(
      `${storageKey}${KEY_TIMESTAMP_SUFFIX}`,
      String(Date.now())
    )
  }
}

const removeLocalStorageItem = (key) => {
  const tabId = getTabId()
  const storageKey = getNamespacedKey(key, tabId)
  localStorage.removeItem(storageKey)
  if (tabId) {
    localStorage.removeItem(`${storageKey}${KEY_TIMESTAMP_SUFFIX}`)
  }
}

const cleanupOldDepositStorageKeys = () => {
  try {
    const namespacedPrefix = `${TAB_ID_PREFIX}:`
    const depositTimestamps = {}

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key) {
        continue
      }
      if (
        key.startsWith(namespacedPrefix) &&
        key.endsWith(KEY_TIMESTAMP_SUFFIX)
      ) {
        const depositId = key.slice(namespacedPrefix.length).split(':')[0]
        const timestampValue = Number(localStorage.getItem(key))
        if (Number.isFinite(timestampValue)) {
          depositTimestamps[depositId] = Math.max(
            depositTimestamps[depositId] || 0,
            timestampValue
          )
        }
      }
    }

    const newestDepositIds = Object.entries(depositTimestamps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_STORED_DEPOSITS)
      .map(([depositId]) => depositId)
    const newestDepositSet = new Set(newestDepositIds)

    for (let i = localStorage.length - 1; i >= 0; i -= 1) {
      const key = localStorage.key(i)
      if (!key || !key.startsWith(namespacedPrefix)) {
        continue
      }
      const depositId = key.slice(namespacedPrefix.length).split(':')[0]
      if (!newestDepositSet.has(depositId)) {
        localStorage.removeItem(key)
      }
    }
  } catch (error) {
    // no-op
  }
}

export const handleOpen = (
  message = '',
  accountId,
  oauthConnectedAccount,
  extraUrlParams
) => {
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect'
  }
  cleanupOldDepositStorageKeys()
  if (extraUrlParams?.depositId) {
    sessionStorage.setItem(TAB_ID_SESSION_KEY, extraUrlParams.depositId)
  }
  if (extraUrlParams?.jwt) {
    setLocalStorageItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, extraUrlParams.jwt)
  }
  if (extraUrlParams?.lang) {
    setLocalStorageItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY, extraUrlParams.lang)
  }
  const storedLang = getLocalStorageItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY)
  const mergedExtraUrlParams = {
    ...(extraUrlParams ?? {})
  }
  if (!Object.hasOwn(mergedExtraUrlParams, 'lang') && storedLang) {
    mergedExtraUrlParams.lang = storedLang
  }
  setLocalStorageItem(MODAL_TYPE_LOCAL_STORAGE_KEY, message)
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

export const handleCloseRedirect = () => {
  window.parent.postMessage({ type: 'redirectClose' }, '*')
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
        setLocalStorageItem(OAUTH_LOCAL_STORAGE_KEY, maybeOauthConnectedAccount)
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
        setLocalStorageItem(DEPOSIT_ERROR_STORAGE_KEY, 'success')
      } else if (maybeSuccessParam === 'false') {
        const detailParam = params.get('detail')
        setLocalStorageItem(DEPOSIT_ERROR_STORAGE_KEY, detailParam)
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
      const oauthConnectedAccount = getLocalStorageItem(
        OAUTH_LOCAL_STORAGE_KEY
      )
      const currentUrl = new URL(window.location.href)
      const oauthQueryParamDeletedAlready =
        !currentUrl.searchParams.has(OAUTH_QUERY_PARAM)
      const depositError = getLocalStorageItem(DEPOSIT_ERROR_STORAGE_KEY)
      const depositErrorParamDeletedAlready = !currentUrl.searchParams.has(
        DEPOSIT_SUCCESS_PARAM
      )
      const modalType = getLocalStorageItem(MODAL_TYPE_LOCAL_STORAGE_KEY)
      if (depositErrorParamDeletedAlready && typeof depositError === 'string') {
        createIframe(
          new URL(EVENT_MESSAGES?.[modalType] ?? '', url).href,
          undefined,
          undefined,
          undefined,
          depositError
        )
        removeLocalStorageItem(DEPOSIT_ERROR_STORAGE_KEY)
      } else if (oauthConnectedAccount && oauthQueryParamDeletedAlready) {
        let path = EVENT_MESSAGES.linkConnect
        let step
        if (getLocalStorageItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY)) {
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
          removeLocalStorageItem(OAUTH_LOCAL_STORAGE_KEY)
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
      const parentUrl = new URL(window.location.href)
      const tabId = getTabId()
      if (tabId && !parentUrl.searchParams.has(DEPOSIT_ID_PARAM)) {
        parentUrl.searchParams.set(DEPOSIT_ID_PARAM, tabId)
      }
      const parentUrlEncoded = Buffer.from(parentUrl.toString()).toString(
        'base64'
      )
      const token =
        includeDefaultJwt &&
        (jwt || getLocalStorageItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY))
      const storedLang = getLocalStorageItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY)
      const mergedAdditionalUrlParams = {
        ...(additionalUrlParams ?? {})
      }
      if (iframeUrl.searchParams.has('lang')) {
        delete mergedAdditionalUrlParams.lang
      } else if (
        !Object.hasOwn(mergedAdditionalUrlParams, 'lang') &&
        storedLang
      ) {
        mergedAdditionalUrlParams.lang = storedLang
      }
      const params = new URLSearchParams(window.location.search)
      const providerNameParam = params.get('providerName')
      if (tabId && !iframeUrl.searchParams.has(DEPOSIT_ID_PARAM)) {
        mergedAdditionalUrlParams[DEPOSIT_ID_PARAM] = tabId
      }
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

  let redirectWindow = null

  window.onmessage = function (event) {
    if (!Object.hasOwn(EVENT_MESSAGES, event.data.type)) {
      return null
    }

    // These actions can only be called from within the iframe, check origin as they can perform redirects of the parent
    if (['close', 'redirect', 'redirectClose'].includes(event?.data?.type)) {
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        return null
      }
    }

    if (event?.data?.type === 'init') {
      removeLocalStorageItem(OAUTH_LOCAL_STORAGE_KEY);
    } else if (event?.data?.type === 'close') {
      if (jwt) {
        setLocalStorageItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt)
      }
      removeIframe(event)
    } else if (event?.data?.type === 'redirect') {
      if (jwt) {
        setLocalStorageItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt)
      }
      if (event.data.inNewTab) {
        redirectWindow = window.open(event.data.targetUrl, '_blank')
        if (!redirectWindow) {
          console.error('Redirect blocked by browser popup blocker', {
            targetUrl: event.data.targetUrl,
            inNewTab: true,
            origin: event.origin
          })
        }
      } else {
        redirectWindow = null
        window.location.assign(event.data.targetUrl)
      }
    } else if (event?.data?.type === 'redirectClose') {
      if (redirectWindow && !redirectWindow.closed) {
        redirectWindow.close()
      }
      redirectWindow = null
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

if (typeof window !== 'undefined') {
  window.BlockmateLink = {
    handleOpen,
    handleClose,
    handleRedirect,
    handleCloseRedirect,
    createLinkModal,
    handleInit
  }
}
