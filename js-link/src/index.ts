import { Buffer } from 'buffer'

type LinkQueryValue = string | number | boolean

export interface LinkExtraUrlParams
  extends Record<string, LinkQueryValue | null | undefined> {
  depositId?: string
  jwt?: string
  lang?: string
}

export interface LinkClosePayload {
  endResult?: string
  operationId?: string | number
}

export interface BlockmateCloseEventDetail {
  endResult?: string
  url?: string
  origin?: string
  operation_id?: string | number
}

export type LinkCleanupAction = () => void
export type LinkCleanupActions = Partial<Record<string, LinkCleanupAction>>

export interface CreateLinkModalOptions {
  jwt?: string
  url?: string
  cleanupActions?: LinkCleanupActions
  additionalUrlParams?: LinkExtraUrlParams | null
  pollingTimeoutMs?: number
}

type BlockmateMessageData = {
  type?: string
  accountId?: string
  oauthConnectedAccount?: string
  extraUrlParams?: LinkExtraUrlParams
  endResult?: string
  operationId?: string | number
  inNewTab?: boolean
  targetUrl?: string
  url?: string
}

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
} as const

export type LinkMessageType = keyof typeof EVENT_MESSAGES
type IncomingMessageType = LinkMessageType | 'init'

export interface BlockmateLinkGlobal {
  handleOpen: typeof handleOpen
  handleClose: typeof handleClose
  handleRedirect: typeof handleRedirect
  handleCloseRedirect: typeof handleCloseRedirect
  createLinkModal: typeof createLinkModal
  destroyLinkModal: typeof destroyLinkModal
  handleInit: typeof handleInit
  BLOCKMATE_CLOSE_EVENT_NAME: typeof BLOCKMATE_CLOSE_EVENT_NAME
}

interface BlockmateLinkRuntime {
  depositSuccessIntervalId: number | null
  localStorageIntervalId: number | null
  oauthSuccessIntervalId: number | null
}

type RuntimeWindow = Window &
  typeof globalThis & {
    Buffer?: typeof Buffer
    __blockmateLinkRuntime?: BlockmateLinkRuntime
  }

declare global {
  interface Window {
    BlockmateLink?: BlockmateLinkGlobal
  }
}

const runtimeWindow = window as RuntimeWindow
runtimeWindow.Buffer = runtimeWindow.Buffer || Buffer

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
export const BLOCKMATE_CLOSE_EVENT_NAME = 'blockmate:close'
const LINK_IFRAME_ID = 'link-iframe'
const SPINNER_ID = 'iframe-loading-spinner'

const hasOwn = <T extends object>(
  object: T,
  key: PropertyKey
): key is keyof T => Object.prototype.hasOwnProperty.call(object, key)

const isLinkMessageType = (value: unknown): value is LinkMessageType =>
  typeof value === 'string' && hasOwn(EVENT_MESSAGES, value)

const isIncomingMessageType = (value: unknown): value is IncomingMessageType =>
  value === 'init' || isLinkMessageType(value)

const getTabId = (): string | null => {
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

const getNamespacedKey = (key: string, tabId: string | null): string => {
  return tabId ? `${TAB_ID_PREFIX}:${tabId}:${key}` : key
}

const getLocalStorageItem = (key: string): string | null => {
  const tabId = getTabId()
  const storageKey = getNamespacedKey(key, tabId)
  return localStorage.getItem(storageKey)
}

const setLocalStorageItem = (key: string, value: string): void => {
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

const removeLocalStorageItem = (key: string): void => {
  const tabId = getTabId()
  const storageKey = getNamespacedKey(key, tabId)
  localStorage.removeItem(storageKey)
  if (tabId) {
    localStorage.removeItem(`${storageKey}${KEY_TIMESTAMP_SUFFIX}`)
  }
}

const cleanupOldDepositStorageKeys = (): void => {
  try {
    const namespacedPrefix = `${TAB_ID_PREFIX}:`
    const depositTimestamps: Record<string, number> = {}

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

const getRuntime = (): BlockmateLinkRuntime => {
  if (!runtimeWindow.__blockmateLinkRuntime) {
    runtimeWindow.__blockmateLinkRuntime = {
      depositSuccessIntervalId: null,
      localStorageIntervalId: null,
      oauthSuccessIntervalId: null
    }
  }

  return runtimeWindow.__blockmateLinkRuntime
}

export const destroyLinkModal = (): void => {
  const runtime = getRuntime()

  if (runtime.depositSuccessIntervalId !== null) {
    window.clearInterval(runtime.depositSuccessIntervalId)
    runtime.depositSuccessIntervalId = null
  }
  if (runtime.oauthSuccessIntervalId !== null) {
    window.clearInterval(runtime.oauthSuccessIntervalId)
    runtime.oauthSuccessIntervalId = null
  }
  if (runtime.localStorageIntervalId !== null) {
    window.clearInterval(runtime.localStorageIntervalId)
    runtime.localStorageIntervalId = null
  }

  if (window.onmessage) {
    window.onmessage = null
  }

  const iframe = document.getElementById(LINK_IFRAME_ID)
  iframe?.remove()

  const spinner = document.getElementById(SPINNER_ID)
  spinner?.remove()
}

export const handleOpen = (
  message: LinkMessageType | string = 'linkConnect',
  accountId?: string,
  oauthConnectedAccount?: string,
  extraUrlParams?: LinkExtraUrlParams | null
): void => {
  if (!isLinkMessageType(message)) {
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
  if (!hasOwn(mergedExtraUrlParams, 'lang') && storedLang) {
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

export const handleClose = (
  closePayload?: LinkClosePayload | string
): void => {
  let endResult: string | undefined
  let operationId: string | number | undefined

  if (closePayload && typeof closePayload === 'object') {
    endResult = closePayload.endResult
    operationId = closePayload.operationId
  } else {
    endResult = closePayload
  }

  window.parent.postMessage({ type: 'close', endResult, operationId }, '*')
}

export const handleRedirect = (
  targetUrl: string,
  inNewTab = false
): void => {
  window.parent.postMessage({ type: 'redirect', targetUrl, inNewTab }, '*')
}

export const handleCloseRedirect = (): void => {
  window.parent.postMessage({ type: 'redirectClose' }, '*')
}

export const handleInit = (): void => {
  window.parent.postMessage({ type: 'init' }, '*')
}

export const createLinkModal = ({
  jwt,
  url = 'https://link.blockmate.io/',
  cleanupActions = {},
  additionalUrlParams = null,
  pollingTimeoutMs = 1000
}: CreateLinkModalOptions): void => {
  const body = document.body
  if (!body) {
    return
  }
  const runtime = getRuntime()

  destroyLinkModal()

  const emitCloseEvent = (event: MessageEvent<BlockmateMessageData>): void => {
    const operationId = event?.data?.operationId || undefined

    const detail: BlockmateCloseEventDetail = {
      endResult: event?.data?.endResult,
      url: event?.data?.url,
      origin: event?.origin,
      operation_id: operationId || undefined
    }

    try {
      window.dispatchEvent(
        new CustomEvent<BlockmateCloseEventDetail>(BLOCKMATE_CLOSE_EVENT_NAME, {
          detail
        })
      )
    } catch (error) {
      // Support older browsers that do not implement the CustomEvent constructor.
      const customEvent =
        document.createEvent('CustomEvent') as CustomEvent<BlockmateCloseEventDetail>
      customEvent.initCustomEvent(
        BLOCKMATE_CLOSE_EVENT_NAME,
        false,
        false,
        detail
      )
      window.dispatchEvent(customEvent)
    }
  }

  // For oauth
  const startOauthSuccessPolling = (): void => {
    runtime.oauthSuccessIntervalId = window.setInterval(() => {
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
        window.close()
      }
    }, pollingTimeoutMs)
  }

  const startDepositSuccessPolling = (): void => {
    runtime.depositSuccessIntervalId = window.setInterval(() => {
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
        setLocalStorageItem(DEPOSIT_ERROR_STORAGE_KEY, String(detailParam))
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
  const startLocalStoragePolling = (): void => {
    runtime.localStorageIntervalId = window.setInterval(() => {
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
        const eventPath = isLinkMessageType(modalType)
          ? EVENT_MESSAGES[modalType]
          : ''
        createIframe(
          new URL(eventPath, url).href,
          undefined,
          undefined,
          undefined,
          depositError
        )
        removeLocalStorageItem(DEPOSIT_ERROR_STORAGE_KEY)
      } else if (oauthConnectedAccount && oauthQueryParamDeletedAlready) {
        let path: string = EVENT_MESSAGES.linkConnect
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

  const createSpinner = (): void => {
    const spinnerWrapper = document.createElement('div')
    spinnerWrapper.setAttribute('id', SPINNER_ID)
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
    iframeUrl: string,
    accountId?: string,
    oauthConnectedAccount?: string,
    step?: string,
    depositError?: string,
    includeDefaultJwt = true
  ): void => {
    const existingIframe = document.getElementById(LINK_IFRAME_ID)
    if (!existingIframe) {
      createSpinner()
      const parsedIframeUrl = new URL(iframeUrl)
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
      const mergedAdditionalUrlParams: LinkExtraUrlParams = {
        ...(additionalUrlParams ?? {})
      }
      if (parsedIframeUrl.searchParams.has('lang')) {
        delete mergedAdditionalUrlParams.lang
      } else if (
        !hasOwn(mergedAdditionalUrlParams, 'lang') &&
        storedLang
      ) {
        mergedAdditionalUrlParams.lang = storedLang
      }
      const params = new URLSearchParams(window.location.search)
      const providerNameParam = params.get('providerName')
      if (tabId && !parsedIframeUrl.searchParams.has(DEPOSIT_ID_PARAM)) {
        mergedAdditionalUrlParams[DEPOSIT_ID_PARAM] = tabId
      }
      const urlParamsArray: Array<[string, LinkQueryValue | null | undefined]> = [
        ['jwt', token],
        ['accountId', accountId],
        ['step', step],
        ['depositError', depositError],
        ['providerName', providerNameParam],
        ['parentUrlEncoded', parentUrlEncoded],
        ...Object.entries(mergedAdditionalUrlParams)
      ]
      const filteredUrlParamsArray = urlParamsArray.filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
      let urlParams = urlParamsArray
        .map(([key, value]) => `${key}=${String(value)}`)
        .join('&')
      if (iframeUrl.includes('?')) {
        urlParams = `&${urlParams}`
      } else if (urlParams.length > 0) {
        urlParams = `?${urlParams}`
      }
      urlParams = filteredUrlParamsArray
        .map(([key, value]) => `${key}=${String(value)}`)
        .join('&')
      if (iframeUrl.includes('?')) {
        urlParams = urlParams.length > 0 ? `&${urlParams}` : ''
      } else if (urlParams.length > 0) {
        urlParams = `?${urlParams}`
      }
      let urlWithParams = `${iframeUrl}${urlParams}`
      if (oauthConnectedAccount) {
        urlWithParams += `&${OAUTH_QUERY_PARAM}=${oauthConnectedAccount}`
      }

      const iframe = document.createElement('iframe')
      iframe.setAttribute('src', urlWithParams)
      iframe.setAttribute('style', iframeStyle)
      iframe.setAttribute('id', LINK_IFRAME_ID)
      iframe.setAttribute('allow', 'camera') // For QR-code scanning

      iframe.addEventListener('load', () => {
        const spinner = document.getElementById(SPINNER_ID)
        if (spinner) spinner.remove()
      })

      body.appendChild(iframe)
    }
  }

  const removeIframe = (event: MessageEvent<BlockmateMessageData>): void => {
    const iframe = document.getElementById(LINK_IFRAME_ID)
    if (iframe) {
      iframe.remove()
    }
    if (event.data.url) {
      window.location.assign(event.data.url)
    }

    const endResult = event?.data?.endResult
    if (endResult && cleanupActions[endResult]) {
      cleanupActions[endResult]()
    }
    emitCloseEvent(event)
  }

  startDepositSuccessPolling()
  startOauthSuccessPolling()
  startLocalStoragePolling()

  let redirectWindow: Window | null = null

  window.onmessage = function (event: MessageEvent<BlockmateMessageData>) {
    const eventType = event.data?.type
    if (!isIncomingMessageType(eventType)) {
      return null
    }

    // These actions can only be called from within the iframe, check origin as they can perform redirects of the parent
    if (['close', 'redirect', 'redirectClose'].includes(eventType)) {
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        return null
      }
    }

    if (eventType === 'init') {
      removeLocalStorageItem(OAUTH_LOCAL_STORAGE_KEY)
    } else if (eventType === 'close') {
      if (jwt) {
        setLocalStorageItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt)
      }
      removeIframe(event)
    } else if (eventType === 'redirect') {
      const targetUrl = event.data.targetUrl
      if (!targetUrl) {
        return null
      }
      if (jwt) {
        setLocalStorageItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt)
      }
      if (event.data.inNewTab) {
        redirectWindow = window.open(targetUrl, '_blank')
        if (!redirectWindow) {
          console.error('Redirect blocked by browser popup blocker', {
            targetUrl,
            inNewTab: true,
            origin: event.origin
          })
        }
      } else {
        redirectWindow = null
        window.location.assign(targetUrl)
      }
    } else if (eventType === 'redirectClose') {
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
        new URL(`${EVENT_MESSAGES[eventType]}${urlParams}`, url).href,
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
    destroyLinkModal,
    handleInit,
    BLOCKMATE_CLOSE_EVENT_NAME
  }
}
