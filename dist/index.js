window.Buffer = window.Buffer || require('buffer').Buffer;
var EVENT_MESSAGES = {
  linkConnect: "",
  verifyPhone: "verify-phone",
  changePhone: "change-phone",
  enableTransfer: "enable-transfer",
  transferAssets: "transfer-assets",
  cryptoSavings: "crypto-savings",
  withdrawAssets: "withdraw-assets",
  close: 'blockmate-iframe-close',
  redirect: 'redirect',
  deposit: 'deposit-exchange',
  directDeposit: 'deposit-wallet-connect',
  withdrawal: 'withdrawal-exchange'
};
var TRUSTED_ORIGINS = ['https://link.blockmate.io', 'https://link-dev-ovh.blockmate.io', 'https://link-cs.blockmate.io', 'http://localhost:3000'];
var OAUTH_QUERY_PARAM = 'oauthConnectedAccount';
var OAUTH_LOCAL_STORAGE_KEY = 'oauth_connected_account';
var DEPOSIT_OAUTH_SUCCESS_STEP = 'oauth_success';
var DEPOSIT_ID_PARAM = 'deposit_id';
var DEPOSIT_SUCCESS_PARAM = 'success';
var DEPOSIT_SUCCESS_PARAM_FOR_MERCHANT = 'payment_success';
var DEPOSIT_ERROR_STORAGE_KEY = 'deposit_error';
var DEPOSIT_JWT_LOCAL_STORAGE_KEY = 'deposit_jwt';
var MODAL_TYPE_LOCAL_STORAGE_KEY = 'modal_type';
var handleOpen = function handleOpen(message, accountId, oauthConnectedAccount, extraUrlParams) {
  if (message === void 0) {
    message = '';
  }
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect';
  }
  if (extraUrlParams !== null && extraUrlParams !== void 0 && extraUrlParams.jwt) {
    localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, extraUrlParams.jwt);
  }
  localStorage.setItem(MODAL_TYPE_LOCAL_STORAGE_KEY, message);
  window.parent.postMessage({
    type: message,
    accountId: accountId,
    oauthConnectedAccount: oauthConnectedAccount,
    extraUrlParams: extraUrlParams
  }, '*');
};
var handleClose = function handleClose(endResult) {
  window.parent.postMessage({
    type: 'close',
    endResult: endResult
  }, '*');
};
var handleRedirect = function handleRedirect(targetUrl, inNewTab) {
  if (inNewTab === void 0) {
    inNewTab = false;
  }
  window.parent.postMessage({
    type: 'redirect',
    targetUrl: targetUrl,
    inNewTab: inNewTab
  }, '*');
};
var handleInit = function handleInit() {
  window.parent.postMessage({
    type: 'init'
  }, '*');
};
var createLinkModal = function createLinkModal(_ref) {
  var jwt = _ref.jwt,
    _ref$url = _ref.url,
    url = _ref$url === void 0 ? 'https://link.blockmate.io/' : _ref$url,
    _ref$cleanupActions = _ref.cleanupActions,
    cleanupActions = _ref$cleanupActions === void 0 ? {} : _ref$cleanupActions,
    _ref$additionalUrlPar = _ref.additionalUrlParams,
    additionalUrlParams = _ref$additionalUrlPar === void 0 ? null : _ref$additionalUrlPar,
    _ref$pollingTimeoutMs = _ref.pollingTimeoutMs,
    pollingTimeoutMs = _ref$pollingTimeoutMs === void 0 ? 1000 : _ref$pollingTimeoutMs;
  var startOauthSuccessPolling = function startOauthSuccessPolling() {
    var oauthPollingInterval = setInterval(function () {
      var params = new URLSearchParams(window.location.search);
      var maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
      if (maybeOauthConnectedAccount) {
        params["delete"](OAUTH_QUERY_PARAM);
        localStorage.setItem(OAUTH_LOCAL_STORAGE_KEY, maybeOauthConnectedAccount);
        window.close();
      }
    }, pollingTimeoutMs);
  };
  var startDepositSuccessPolling = function startDepositSuccessPolling() {
    var depositSuccessPollingInterval = setInterval(function () {
      var params = new URLSearchParams(window.location.search);
      var maybeDepositIdParam = params.get(DEPOSIT_ID_PARAM);
      var maybeSuccessParam = String(params.get(DEPOSIT_SUCCESS_PARAM)).toLowerCase();
      if (!maybeDepositIdParam || !['true', 'false'].includes(maybeSuccessParam)) {
        return;
      }
      if (maybeSuccessParam === 'true') {
        localStorage.setItem(DEPOSIT_ERROR_STORAGE_KEY, 'success');
      } else if (maybeSuccessParam === 'false') {
        var detailParam = params.get('detail');
        localStorage.setItem(DEPOSIT_ERROR_STORAGE_KEY, detailParam);
      }
      params["delete"](DEPOSIT_SUCCESS_PARAM);
      params["delete"]('detail');
      params.set(DEPOSIT_SUCCESS_PARAM_FOR_MERCHANT, maybeSuccessParam);
      location.replace("" + window.location.origin + window.location.pathname + "?" + params.toString());
    }, pollingTimeoutMs);
  };
  var startLocalStoragePolling = function startLocalStoragePolling() {
    var localStoragePollingInterval = setInterval(function () {
      var oauthConnectedAccount = localStorage.getItem(OAUTH_LOCAL_STORAGE_KEY);
      var currentUrl = new URL(window.location.href);
      var oauthQueryParamDeletedAlready = !currentUrl.searchParams.has(OAUTH_QUERY_PARAM);
      var depositError = localStorage.getItem(DEPOSIT_ERROR_STORAGE_KEY);
      var depositErrorParamDeletedAlready = !currentUrl.searchParams.has(DEPOSIT_SUCCESS_PARAM);
      var modalType = localStorage.getItem(MODAL_TYPE_LOCAL_STORAGE_KEY);
      console.log("modalType: " + modalType);
      if (depositErrorParamDeletedAlready && typeof depositError === 'string') {
        var _EVENT_MESSAGES$modal;
        console.log('Going to create iframe with error');
        createIframe(new URL((_EVENT_MESSAGES$modal = EVENT_MESSAGES === null || EVENT_MESSAGES === void 0 ? void 0 : EVENT_MESSAGES[modalType]) != null ? _EVENT_MESSAGES$modal : '', url).href, undefined, undefined, undefined, depositError);
        localStorage.removeItem(DEPOSIT_ERROR_STORAGE_KEY);
      } else if (oauthConnectedAccount && oauthQueryParamDeletedAlready) {
        console.log('oauthQueryParam deleted already');
        var path = EVENT_MESSAGES.linkConnect;
        var step;
        if (localStorage.getItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY)) {
          console.log('found deposit jwt in local storage');
          if (modalType === 'deposit') {
            path = EVENT_MESSAGES.deposit;
            step = DEPOSIT_OAUTH_SUCCESS_STEP;
          } else if (modalType === 'withdrawal') {
            path = EVENT_MESSAGES.withdrawal;
            step = DEPOSIT_OAUTH_SUCCESS_STEP;
          }
        }
        createIframe(new URL(path, url).href, undefined, oauthConnectedAccount, step, undefined);
        var params = new URLSearchParams(window.location.search);
        var maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
        if (!maybeOauthConnectedAccount) {
          localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
        }
      }
    }, pollingTimeoutMs);
  };
  var body = document.querySelector('body');
  var spinnerId = 'iframe-loading-spinner';
  var createSpinner = function createSpinner() {
    var spinnerWrapper = document.createElement('div');
    spinnerWrapper.setAttribute('id', spinnerId);
    spinnerWrapper.setAttribute('style', "\n        position: fixed;\n        top: 50%;\n        left: 50%;\n        transform: translate(-50%, -50%);\n        z-index: 101;\n      ");
    var spinner = document.createElement('div');
    spinner.setAttribute('style', "\n        width: 48px;\n        height: 48px;\n        border: 6px solid rgba(255, 255, 255, 0.3);\n        border-top-color: white;\n        border-radius: 50%;\n        animation: spin 1s linear infinite;\n      ");
    spinnerWrapper.appendChild(spinner);
    body.appendChild(spinnerWrapper);
    var style = document.createElement('style');
    style.innerHTML = "\n      @keyframes spin {\n        0% { transform: rotate(0deg); }\n        100% { transform: rotate(360deg); }\n      }\n    ";
    document.head.appendChild(style);
  };
  var iframeStyle = 'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0; background-color: rgba(0, 0, 0, 0.55);';
  var createIframe = function createIframe(url, accountId, oauthConnectedAccount, step, depositError, includeDefaultJwt) {
    if (includeDefaultJwt === void 0) {
      includeDefaultJwt = true;
    }
    var iframeId = 'link-iframe';
    var existingIframe = document.getElementById(iframeId);
    if (!existingIframe) {
      createSpinner();
      var parentUrlEncoded = Buffer.from(window.location.href).toString('base64');
      var token = includeDefaultJwt && (jwt || localStorage.getItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY));
      var params = new URLSearchParams(window.location.search);
      var providerNameParam = params.get('providerName');
      var urlParamsArray = [['jwt', token], ['accountId', accountId], ['step', step], ['depositError', depositError], ['providerName', providerNameParam], ['parentUrlEncoded', parentUrlEncoded]].concat(Object.entries(additionalUrlParams != null ? additionalUrlParams : {})).filter(function (_ref2) {
        var value = _ref2[1];
        return value;
      });
      var urlParams = urlParamsArray.map(function (_ref3) {
        var key = _ref3[0],
          value = _ref3[1];
        return key + "=" + value;
      }).join('&');
      if (url.includes('?')) {
        urlParams = "&" + urlParams;
      } else if (urlParams.length > 0) {
        urlParams = "?" + urlParams;
      }
      var urlWithParams = "" + url + urlParams;
      if (oauthConnectedAccount) {
        urlWithParams += "&" + OAUTH_QUERY_PARAM + "=" + oauthConnectedAccount;
      }
      var iframe = document.createElement('iframe');
      iframe.setAttribute('src', urlWithParams);
      iframe.setAttribute('style', iframeStyle);
      iframe.setAttribute('id', iframeId);
      iframe.setAttribute('allow', 'camera');
      iframe.addEventListener('load', function () {
        var spinner = document.getElementById(spinnerId);
        if (spinner) spinner.remove();
      });
      body.appendChild(iframe);
    }
  };
  var removeIframe = function removeIframe(event) {
    var _event$data;
    var iframe = document.querySelector('#link-iframe');
    if (iframe) {
      body.removeChild(iframe);
    }
    if (event.data.url) {
      window.location = event.data.url;
    }
    var endResult = event === null || event === void 0 ? void 0 : (_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.endResult;
    if (endResult && cleanupActions[endResult]) {
      cleanupActions[endResult]();
    }
  };
  startDepositSuccessPolling();
  startOauthSuccessPolling();
  startLocalStoragePolling();
  window.onmessage = function (event) {
    var _event$data2, _event$data3, _event$data4, _event$data5;
    if (!Object.hasOwn(EVENT_MESSAGES, event.data.type)) {
      return null;
    }
    if (['close', 'redirect'].includes(event === null || event === void 0 ? void 0 : (_event$data2 = event.data) === null || _event$data2 === void 0 ? void 0 : _event$data2.type)) {
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        return null;
      }
    }
    if ((event === null || event === void 0 ? void 0 : (_event$data3 = event.data) === null || _event$data3 === void 0 ? void 0 : _event$data3.type) === 'init') {
      localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
    } else if ((event === null || event === void 0 ? void 0 : (_event$data4 = event.data) === null || _event$data4 === void 0 ? void 0 : _event$data4.type) === 'close') {
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt);
      }
      removeIframe(event);
    } else if ((event === null || event === void 0 ? void 0 : (_event$data5 = event.data) === null || _event$data5 === void 0 ? void 0 : _event$data5.type) === 'redirect') {
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt);
      }
      var opened = window.open(event.data.targetUrl, event.data.inNewTab ? '_blank' : '_self');
      if (!opened) {
        console.error('Redirect BLOCKED');
      }
    } else {
      var _event$data$extraUrlP, _event$data6, _event$data$extraUrlP2, _event$data7, _event$data8;
      var urlParams = Object.entries((_event$data$extraUrlP = event === null || event === void 0 ? void 0 : (_event$data6 = event.data) === null || _event$data6 === void 0 ? void 0 : _event$data6.extraUrlParams) != null ? _event$data$extraUrlP : {}).map(function (_ref4) {
        var key = _ref4[0],
          value = _ref4[1];
        return key + "=" + value;
      }).join('&');
      if (urlParams.length > 0) {
        urlParams = "?" + urlParams;
      }
      var includeDefaultJwt = !((_event$data$extraUrlP2 = event.data.extraUrlParams) !== null && _event$data$extraUrlP2 !== void 0 && _event$data$extraUrlP2.jwt);
      createIframe(new URL("" + EVENT_MESSAGES[event.data.type] + urlParams, url).href, (_event$data7 = event.data) === null || _event$data7 === void 0 ? void 0 : _event$data7.accountId, (_event$data8 = event.data) === null || _event$data8 === void 0 ? void 0 : _event$data8.oauthConnectedAccount, undefined, undefined, includeDefaultJwt);
    }
  };
};
var LinkModal = function LinkModal(_ref5) {
  var jwt = _ref5.jwt,
    _ref5$url = _ref5.url,
    url = _ref5$url === void 0 ? 'https://link.blockmate.io/' : _ref5$url,
    _ref5$cleanupActions = _ref5.cleanupActions,
    cleanupActions = _ref5$cleanupActions === void 0 ? {} : _ref5$cleanupActions,
    _ref5$additionalUrlPa = _ref5.additionalUrlParams,
    additionalUrlParams = _ref5$additionalUrlPa === void 0 ? null : _ref5$additionalUrlPa;
  createLinkModal({
    jwt: jwt,
    url: url,
    cleanupActions: cleanupActions,
    additionalUrlParams: additionalUrlParams
  });
  return null;
};
if (typeof window !== 'undefined') {
  window.BlockmateLink = {
    handleOpen: handleOpen,
    handleClose: handleClose,
    handleRedirect: handleRedirect,
    createLinkModal: createLinkModal,
    handleInit: handleInit
  };
}

exports.LinkModal = LinkModal;
exports.createLinkModal = createLinkModal;
exports.handleClose = handleClose;
exports.handleInit = handleInit;
exports.handleOpen = handleOpen;
exports.handleRedirect = handleRedirect;
//# sourceMappingURL=index.js.map
