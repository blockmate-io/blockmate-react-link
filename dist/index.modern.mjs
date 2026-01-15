function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}

/* eslint-disable */

window.Buffer = window.Buffer || require('buffer').Buffer;
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
  withdrawal: 'withdrawal-exchange'
};
const TRUSTED_ORIGINS = ['https://link.blockmate.io', 'https://link-dev-ovh.blockmate.io', 'https://link-cs.blockmate.io', 'http://localhost:3000'];
const OAUTH_QUERY_PARAM = 'oauthConnectedAccount';
const OAUTH_LOCAL_STORAGE_KEY = 'oauth_connected_account';
const DEPOSIT_OAUTH_SUCCESS_STEP = 'oauth_success';
const DEPOSIT_ID_PARAM = 'deposit_id';
const DEPOSIT_SUCCESS_PARAM = 'success';
const DEPOSIT_SUCCESS_PARAM_FOR_MERCHANT = 'payment_success';
const DEPOSIT_ERROR_STORAGE_KEY = 'deposit_error';
const DEPOSIT_JWT_LOCAL_STORAGE_KEY = 'deposit_jwt';
const DEPOSIT_LANG_LOCAL_STORAGE_KEY = 'deposit_lang';
const MODAL_TYPE_LOCAL_STORAGE_KEY = 'modal_type';
const handleOpen = (message = '', accountId, oauthConnectedAccount, extraUrlParams) => {
  console.log('[BlockmateLink] handleOpen called', {
    message,
    accountId,
    oauthConnectedAccount,
    extraUrlParams
  });
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect';
  }
  if (extraUrlParams != null && extraUrlParams.jwt) {
    localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, extraUrlParams.jwt);
  }
  if (extraUrlParams != null && extraUrlParams.lang) {
    localStorage.setItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY, extraUrlParams.lang);
  }
  const storedLang = localStorage.getItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY);
  const mergedExtraUrlParams = _extends({}, extraUrlParams != null ? extraUrlParams : {});
  if (!Object.hasOwn(mergedExtraUrlParams, 'lang') && storedLang) {
    mergedExtraUrlParams.lang = storedLang;
  }
  console.log('[BlockmateLink] handleOpen merged params', {
    message,
    mergedExtraUrlParams
  });
  localStorage.setItem(MODAL_TYPE_LOCAL_STORAGE_KEY, message);
  window.parent.postMessage({
    type: message,
    accountId,
    oauthConnectedAccount,
    extraUrlParams: mergedExtraUrlParams
  }, '*');
};
const handleClose = endResult => {
  window.parent.postMessage({
    type: 'close',
    endResult
  }, '*');
};
const handleRedirect = (targetUrl, inNewTab = false) => {
  window.parent.postMessage({
    type: 'redirect',
    targetUrl,
    inNewTab
  }, '*');
};
const handleCloseRedirect = () => {
  console.log('[BlockmateLink] handleCloseRedirect called');
  window.parent.postMessage({
    type: 'redirectClose'
  }, '*');
};
const handleInit = () => {
  window.parent.postMessage({
    type: 'init'
  }, '*');
};
const createLinkModal = ({
  jwt,
  url: _url = 'https://link.blockmate.io/',
  cleanupActions: _cleanupActions = {},
  additionalUrlParams: _additionalUrlParams = null,
  pollingTimeoutMs: _pollingTimeoutMs = 1000
}) => {
  // For oauth
  const startOauthSuccessPolling = () => {
    setInterval(() => {
      const params = new URLSearchParams(window.location.search);
      const maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
      if (maybeOauthConnectedAccount) {
        params.delete(OAUTH_QUERY_PARAM);
        localStorage.setItem(OAUTH_LOCAL_STORAGE_KEY, maybeOauthConnectedAccount);
        // // This will redirect the user to the same page without the query param, but with state in localStorage
        // location.replace(
        //   `${window.location.origin}${
        //     window.location.pathname
        //   }?${params.toString()}`
        // )
        window.close();
      }
    }, _pollingTimeoutMs);
  };
  const startDepositSuccessPolling = () => {
    setInterval(() => {
      const params = new URLSearchParams(window.location.search);
      const maybeDepositIdParam = params.get(DEPOSIT_ID_PARAM);
      const maybeSuccessParam = String(params.get(DEPOSIT_SUCCESS_PARAM)).toLowerCase();
      if (!maybeDepositIdParam || !['true', 'false'].includes(maybeSuccessParam)) {
        return;
      }
      if (maybeSuccessParam === 'true') {
        localStorage.setItem(DEPOSIT_ERROR_STORAGE_KEY, 'success');
      } else if (maybeSuccessParam === 'false') {
        const detailParam = params.get('detail');
        localStorage.setItem(DEPOSIT_ERROR_STORAGE_KEY, detailParam);
      }
      params.delete(DEPOSIT_SUCCESS_PARAM);
      params.delete('detail');
      params.set(DEPOSIT_SUCCESS_PARAM_FOR_MERCHANT, maybeSuccessParam);
      location.replace(`${window.location.origin}${window.location.pathname}?${params.toString()}`);
    }, _pollingTimeoutMs);
  };

  // For oauth
  const startLocalStoragePolling = () => {
    setInterval(() => {
      const oauthConnectedAccount = localStorage.getItem(OAUTH_LOCAL_STORAGE_KEY);
      const currentUrl = new URL(window.location.href);
      const oauthQueryParamDeletedAlready = !currentUrl.searchParams.has(OAUTH_QUERY_PARAM);
      const depositError = localStorage.getItem(DEPOSIT_ERROR_STORAGE_KEY);
      const depositErrorParamDeletedAlready = !currentUrl.searchParams.has(DEPOSIT_SUCCESS_PARAM);
      const modalType = localStorage.getItem(MODAL_TYPE_LOCAL_STORAGE_KEY);
      if (depositErrorParamDeletedAlready && typeof depositError === 'string') {
        var _EVENT_MESSAGES$modal;
        createIframe(new URL((_EVENT_MESSAGES$modal = EVENT_MESSAGES == null ? void 0 : EVENT_MESSAGES[modalType]) != null ? _EVENT_MESSAGES$modal : '', _url).href, undefined, undefined, undefined, depositError);
        localStorage.removeItem(DEPOSIT_ERROR_STORAGE_KEY);
      } else if (oauthConnectedAccount && oauthQueryParamDeletedAlready) {
        let path = EVENT_MESSAGES.linkConnect;
        let step;
        if (localStorage.getItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY)) {
          if (modalType === 'deposit') {
            path = EVENT_MESSAGES.deposit;
            step = DEPOSIT_OAUTH_SUCCESS_STEP;
          } else if (modalType === 'withdrawal') {
            path = EVENT_MESSAGES.withdrawal;
            step = DEPOSIT_OAUTH_SUCCESS_STEP;
          }
        }
        createIframe(new URL(path, _url).href, undefined, oauthConnectedAccount, step, undefined);
        // Delete from localStorage, but from the original tab, not the new tab used from oauth
        const params = new URLSearchParams(window.location.search);
        const maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
        if (!maybeOauthConnectedAccount) {
          localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
        }
      }
    }, _pollingTimeoutMs);
  };
  const body = document.querySelector('body');
  const spinnerId = 'iframe-loading-spinner';
  const createSpinner = () => {
    const spinnerWrapper = document.createElement('div');
    spinnerWrapper.setAttribute('id', spinnerId);
    spinnerWrapper.setAttribute('style', `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 101;
      `);
    const spinner = document.createElement('div');
    spinner.setAttribute('style', `
        width: 48px;
        height: 48px;
        border: 6px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      `);
    spinnerWrapper.appendChild(spinner);
    body.appendChild(spinnerWrapper);
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  };
  const iframeStyle = 'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0; background-color: rgba(0, 0, 0, 0.55);';
  const createIframe = (url, accountId, oauthConnectedAccount, step, depositError, includeDefaultJwt = true) => {
    const iframeId = 'link-iframe';
    const existingIframe = document.getElementById(iframeId);
    if (!existingIframe) {
      createSpinner();
      const iframeUrl = new URL(url);
      const parentUrlEncoded = Buffer.from(window.location.href).toString('base64');
      const token = includeDefaultJwt && (jwt || localStorage.getItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY));
      const storedLang = localStorage.getItem(DEPOSIT_LANG_LOCAL_STORAGE_KEY);
      const mergedAdditionalUrlParams = _extends({}, _additionalUrlParams != null ? _additionalUrlParams : {});
      if (iframeUrl.searchParams.has('lang')) {
        delete mergedAdditionalUrlParams.lang;
      } else if (!Object.hasOwn(mergedAdditionalUrlParams, 'lang') && storedLang) {
        mergedAdditionalUrlParams.lang = storedLang;
      }
      const params = new URLSearchParams(window.location.search);
      const providerNameParam = params.get('providerName');
      const urlParamsArray = [['jwt', token], ['accountId', accountId], ['step', step], ['depositError', depositError], ['providerName', providerNameParam], ['parentUrlEncoded', parentUrlEncoded], ...Object.entries(mergedAdditionalUrlParams)].filter(([_, value]) => value);
      let urlParams = urlParamsArray.map(([key, value]) => `${key}=${value}`).join('&');
      if (url.includes('?')) {
        urlParams = `&${urlParams}`;
      } else if (urlParams.length > 0) {
        urlParams = `?${urlParams}`;
      }
      let urlWithParams = `${url}${urlParams}`;
      if (oauthConnectedAccount) {
        urlWithParams += `&${OAUTH_QUERY_PARAM}=${oauthConnectedAccount}`;
      }
      const iframe = document.createElement('iframe');
      iframe.setAttribute('src', urlWithParams);
      iframe.setAttribute('style', iframeStyle);
      iframe.setAttribute('id', iframeId);
      iframe.setAttribute('allow', 'camera'); // For QR-code scanning

      iframe.addEventListener('load', () => {
        const spinner = document.getElementById(spinnerId);
        if (spinner) spinner.remove();
      });
      body.appendChild(iframe);
    }
  };
  const removeIframe = event => {
    var _event$data;
    const iframe = document.querySelector('#link-iframe');
    if (iframe) {
      body.removeChild(iframe);
    }
    if (event.data.url) {
      window.location = event.data.url;
    }
    const endResult = event == null || (_event$data = event.data) == null ? void 0 : _event$data.endResult;
    if (endResult && _cleanupActions[endResult]) {
      _cleanupActions[endResult]();
    }
  };
  startDepositSuccessPolling();
  startOauthSuccessPolling();
  startLocalStoragePolling();
  let redirectWindow = null;
  window.onmessage = function (event) {
    var _event$data2, _event$data4, _event$data6, _event$data7, _event$data9, _event$data10;
    console.log('[BlockmateLink] window.onmessage received', {
      origin: event.origin,
      type: event == null || (_event$data2 = event.data) == null ? void 0 : _event$data2.type,
      data: event == null ? void 0 : event.data
    });
    if (!Object.hasOwn(EVENT_MESSAGES, event.data.type)) {
      var _event$data3;
      console.log('[BlockmateLink] window.onmessage ignored (unknown type)', {
        type: event == null || (_event$data3 = event.data) == null ? void 0 : _event$data3.type
      });
      return null;
    }

    // These actions can only be called from within the iframe, check origin as they can perform redirects of the parent
    if (['close', 'redirect', 'redirect-close'].includes(event == null || (_event$data4 = event.data) == null ? void 0 : _event$data4.type)) {
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        var _event$data5;
        console.log('[BlockmateLink] window.onmessage ignored (untrusted origin)', {
          origin: event.origin,
          type: event == null || (_event$data5 = event.data) == null ? void 0 : _event$data5.type
        });
        return null;
      }
    }
    if ((event == null || (_event$data6 = event.data) == null ? void 0 : _event$data6.type) === 'init') {
      console.log('[BlockmateLink] window.onmessage init');
      localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
    } else if ((event == null || (_event$data7 = event.data) == null ? void 0 : _event$data7.type) === 'close') {
      var _event$data8;
      console.log('[BlockmateLink] window.onmessage close', {
        endResult: event == null || (_event$data8 = event.data) == null ? void 0 : _event$data8.endResult
      });
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt);
      }
      removeIframe(event);
    } else if ((event == null || (_event$data9 = event.data) == null ? void 0 : _event$data9.type) === 'redirect') {
      var _event$data0, _event$data1;
      console.log('[BlockmateLink] window.onmessage redirect', {
        targetUrl: event == null || (_event$data0 = event.data) == null ? void 0 : _event$data0.targetUrl,
        inNewTab: event == null || (_event$data1 = event.data) == null ? void 0 : _event$data1.inNewTab
      });
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt);
      }
      if (event.data.inNewTab) {
        redirectWindow = window.open(event.data.targetUrl, '_blank');
        if (!redirectWindow) {
          console.error('Redirect blocked by browser popup blocker', {
            targetUrl: event.data.targetUrl,
            inNewTab: true,
            origin: event.origin
          });
        }
      } else {
        redirectWindow = null;
        window.location.assign(event.data.targetUrl);
      }
    } else if ((event == null || (_event$data10 = event.data) == null ? void 0 : _event$data10.type) === 'redirect-close') {
      console.log('[BlockmateLink] window.onmessage redirect-close', {
        redirectWindow
      });
      if (redirectWindow && !redirectWindow.closed) {
        console.log('[BlockmateLink] window.onmessage closing redirectWindow');
        redirectWindow.close();
      }
      console.log('[BlockmateLink] window.onmessage resetting redirectWindow');
      redirectWindow = null;
    } else {
      var _event$data11, _event$data12, _event$data$extraUrlP, _event$data13, _event$data$extraUrlP2, _event$data14, _event$data15;
      console.log('[BlockmateLink] window.onmessage open iframe', {
        type: event == null || (_event$data11 = event.data) == null ? void 0 : _event$data11.type,
        extraUrlParams: event == null || (_event$data12 = event.data) == null ? void 0 : _event$data12.extraUrlParams
      });
      let urlParams = Object.entries((_event$data$extraUrlP = event == null || (_event$data13 = event.data) == null ? void 0 : _event$data13.extraUrlParams) != null ? _event$data$extraUrlP : {}).map(([key, value]) => `${key}=${value}`).join('&');
      if (urlParams.length > 0) {
        urlParams = `?${urlParams}`;
      }
      const includeDefaultJwt = !((_event$data$extraUrlP2 = event.data.extraUrlParams) != null && _event$data$extraUrlP2.jwt);
      createIframe(new URL(`${EVENT_MESSAGES[event.data.type]}${urlParams}`, _url).href, (_event$data14 = event.data) == null ? void 0 : _event$data14.accountId, (_event$data15 = event.data) == null ? void 0 : _event$data15.oauthConnectedAccount, undefined, undefined, includeDefaultJwt);
    }
  };
};

// React component
const LinkModal = ({
  jwt,
  url: _url2 = 'https://link.blockmate.io/',
  cleanupActions: _cleanupActions2 = {},
  additionalUrlParams: _additionalUrlParams2 = null
}) => {
  createLinkModal({
    jwt,
    url: _url2,
    cleanupActions: _cleanupActions2,
    additionalUrlParams: _additionalUrlParams2
  });
  return null;
};
if (typeof window !== 'undefined') {
  window.BlockmateLink = {
    handleOpen,
    handleClose,
    handleRedirect,
    handleCloseRedirect,
    createLinkModal,
    handleInit
  };
}

export { LinkModal, createLinkModal, handleClose, handleCloseRedirect, handleInit, handleOpen, handleRedirect };
//# sourceMappingURL=index.modern.mjs.map
