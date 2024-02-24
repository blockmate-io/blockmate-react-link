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

export const handleOpen = (message = '', accountId, oauthConnectedAccount) => {
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect'
  }

  window.parent.postMessage({ type: message, accountId, oauthConnectedAccount }, '*')
}

export const handleClose = (endResult) => {
  window.parent.postMessage({ type: 'close', endResult }, '*')
}

export const LinkModal = ({
  jwt,
  url = 'https://link.blockmate.io/',
  cleanupActions = {},
  additionalUrlParams= null
}) => {
  const OAUTH_QUERY_PARAM = 'oauthConnectedAccount';
  const OAUTH_LOCAL_STORAGE_KEY = 'oauthConnectedAccount';
  let oauthPollingInterval;

  const startOauthSuccessPolling = () => {
    oauthPollingInterval = setInterval(() => {
      const params = new URLSearchParams(window.location.search);
      const maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
      if (maybeOauthConnectedAccount) {
        params.delete(OAUTH_QUERY_PARAM);
        localStorage.setItem(OAUTH_LOCAL_STORAGE_KEY, maybeOauthConnectedAccount);
        // This will redirect the user to the same page without the query param, but with state in localStorage
        window.location.href = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
      }
    }, 3000);
  };

  const startLocalStoragePolling = () => {
    const localStoragePollingInterval = setInterval(() => {
      const oauthConnectedAccount = localStorage.getItem(OAUTH_LOCAL_STORAGE_KEY);
      if (oauthConnectedAccount && createIframe) {
        createIframe(
          new URL(EVENT_MESSAGES.linkConnect, url).href,
          undefined,
          oauthConnectedAccount
        );
        localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
      }
    }, 3000);
  };

  startOauthSuccessPolling();
  startLocalStoragePolling();

  if (!jwt) return null

  const body = document.querySelector('body')
  const iframeStyle =
    'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0'

  const createIframe = (url, accountId, oauthConnectedAccount) => {
    const iframeId = 'link-iframe'
    const existingIframe = document.getElementById(iframeId)
    if (!existingIframe) {
      let additionalParamsStr = '';
      if (additionalUrlParams) {
        additionalParamsStr = Object.keys(additionalUrlParams).map(key =>
          `&${key}=${additionalUrlParams[key]}
        `).join('');
      }
      let urlWithParams = `${url}?jwt=${jwt}&accountId=${accountId}${additionalParamsStr}`;
      if (oauthConnectedAccount) {
        urlWithParams += `&${OAUTH_QUERY_PARAM}=${oauthConnectedAccount}`;
      }

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
      removeIframe(event);
    } else {
      createIframe(
        new URL(EVENT_MESSAGES[event.data.type], url).href,
        event.data.accountId,
        event.data.oauthConnectedAccount
      );
    }
  }

  return null
}
