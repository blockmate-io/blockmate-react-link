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
  directDeposit: 'deposit-wallet-connect'
};
var TRUSTED_ORIGINS = ['https://link.blockmate.io', 'https://link-dev-ovh.blockmate.io', 'https://link-cs.blockmate.io', 'http://localhost:3000'];
var OAUTH_QUERY_PARAM = 'oauthConnectedAccount';
var OAUTH_LOCAL_STORAGE_KEY = 'oauth_connected_account';
var DEPOSIT_OAUTH_SUCCESS_STEP = 'oauth_success';
var DEPOSIT_ID_PARAM = 'deposit_id';
var DEPOSIT_SUCCESS_PARAM = 'success';
var DEPOSIT_ERROR_STORAGE_KEY = 'deposit_error';
var DEPOSIT_JWT_LOCAL_STORAGE_KEY = 'deposit_jwt';
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
var handleRedirect = function handleRedirect(targetUrl) {
  window.parent.postMessage({
    type: 'redirect',
    targetUrl: targetUrl
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
    _ref$merchantInfo = _ref.merchantInfo,
    merchantInfo = _ref$merchantInfo === void 0 ? {
      description: 'ExampleMerchant',
      icon: 'https://api.blockmate.io/v1/onchain/static/bitcoin.png'
    } : _ref$merchantInfo;
  var startOauthSuccessPolling = function startOauthSuccessPolling() {
    var oauthPollingInterval = setInterval(function () {
      var params = new URLSearchParams(window.location.search);
      var maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
      if (maybeOauthConnectedAccount) {
        params["delete"](OAUTH_QUERY_PARAM);
        localStorage.setItem(OAUTH_LOCAL_STORAGE_KEY, maybeOauthConnectedAccount);
        location.replace("" + window.location.origin + window.location.pathname + "?" + params.toString());
      }
    }, 1000);
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
      location.replace("" + window.location.origin + window.location.pathname + "?" + params.toString());
    }, 1000);
  };
  var startLocalStoragePolling = function startLocalStoragePolling() {
    var localStoragePollingInterval = setInterval(function () {
      var oauthConnectedAccount = localStorage.getItem(OAUTH_LOCAL_STORAGE_KEY);
      var currentUrl = new URL(window.location.href);
      var oauthQueryParamDeletedAlready = !currentUrl.searchParams.has(OAUTH_QUERY_PARAM);
      var depositError = localStorage.getItem(DEPOSIT_ERROR_STORAGE_KEY);
      var depositErrorParamDeletedAlready = !currentUrl.searchParams.has(DEPOSIT_SUCCESS_PARAM);
      if (depositErrorParamDeletedAlready && typeof depositError === 'string') {
        createIframe(new URL(EVENT_MESSAGES.deposit, url).href, undefined, undefined, undefined, depositError);
        localStorage.removeItem(DEPOSIT_ERROR_STORAGE_KEY);
      } else if (oauthConnectedAccount && oauthQueryParamDeletedAlready) {
        var path = EVENT_MESSAGES.linkConnect;
        var step;
        if (currentUrl.searchParams.has(DEPOSIT_ID_PARAM)) {
          path = EVENT_MESSAGES.deposit;
          step = DEPOSIT_OAUTH_SUCCESS_STEP;
        }
        createIframe(new URL(path, url).href, undefined, oauthConnectedAccount, step);
        localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
      }
    }, 1000);
  };
  var body = document.querySelector('body');
  var iframeStyle = 'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0';
  var createIframe = function createIframe(url, accountId, oauthConnectedAccount, step, depositError, includeDefaultJwt) {
    if (includeDefaultJwt === void 0) {
      includeDefaultJwt = true;
    }
    var iframeId = 'link-iframe';
    var existingIframe = document.getElementById(iframeId);
    if (!existingIframe) {
      var parentUrlEncoded = encodeURIComponent(window.location.href);
      var merchantUrlParams = [['merchantDescription', merchantInfo.description], ['merchantIcon', encodeURIComponent(merchantInfo.icon)]].filter(function (_ref2) {
        var value = _ref2[1];
        return value;
      });
      var token = includeDefaultJwt && (jwt || localStorage.getItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY));
      var params = new URLSearchParams(window.location.search);
      var providerNameParam = params.get('providerName');
      var urlParamsArray = [['jwt', token], ['accountId', accountId], ['parentUrlEncoded', parentUrlEncoded], ['step', step], ['depositError', depositError], ['providerName', providerNameParam]].concat(merchantUrlParams, Object.entries(additionalUrlParams != null ? additionalUrlParams : {})).filter(function (_ref3) {
        var value = _ref3[1];
        return value;
      });
      var urlParams = urlParamsArray.map(function (_ref4) {
        var key = _ref4[0],
          value = _ref4[1];
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
    var _event$data2, _event$data3, _event$data4;
    if (!Object.hasOwn(EVENT_MESSAGES, event.data.type)) {
      return null;
    }
    if (['close', 'redirect'].includes(event === null || event === void 0 ? void 0 : (_event$data2 = event.data) === null || _event$data2 === void 0 ? void 0 : _event$data2.type)) {
      if (!TRUSTED_ORIGINS.includes(event.origin)) {
        return null;
      }
    }
    if ((event === null || event === void 0 ? void 0 : (_event$data3 = event.data) === null || _event$data3 === void 0 ? void 0 : _event$data3.type) === 'close') {
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt);
      }
      removeIframe(event);
    } else if ((event === null || event === void 0 ? void 0 : (_event$data4 = event.data) === null || _event$data4 === void 0 ? void 0 : _event$data4.type) === 'redirect') {
      if (jwt) {
        localStorage.setItem(DEPOSIT_JWT_LOCAL_STORAGE_KEY, jwt);
      }
      window.location.replace(event.data.targetUrl);
    } else {
      var _event$data$extraUrlP, _event$data$extraUrlP2, _event$data5, _event$data6;
      var urlParams = Object.entries((_event$data$extraUrlP = event.data.extraUrlParams) != null ? _event$data$extraUrlP : {}).map(function (_ref5) {
        var key = _ref5[0],
          value = _ref5[1];
        return key + "=" + value;
      }).join('&');
      if (urlParams.length > 0) {
        urlParams = "?" + urlParams;
      }
      var includeDefaultJwt = !((_event$data$extraUrlP2 = event.data.extraUrlParams) !== null && _event$data$extraUrlP2 !== void 0 && _event$data$extraUrlP2.jwt);
      createIframe(new URL("" + EVENT_MESSAGES[event.data.type] + urlParams, url).href, (_event$data5 = event.data) === null || _event$data5 === void 0 ? void 0 : _event$data5.accountId, (_event$data6 = event.data) === null || _event$data6 === void 0 ? void 0 : _event$data6.oauthConnectedAccount, undefined, undefined, includeDefaultJwt);
    }
  };
};
var LinkModal = function LinkModal(_ref6) {
  var jwt = _ref6.jwt,
    _ref6$url = _ref6.url,
    url = _ref6$url === void 0 ? 'https://link.blockmate.io/' : _ref6$url,
    _ref6$cleanupActions = _ref6.cleanupActions,
    cleanupActions = _ref6$cleanupActions === void 0 ? {} : _ref6$cleanupActions,
    _ref6$additionalUrlPa = _ref6.additionalUrlParams,
    additionalUrlParams = _ref6$additionalUrlPa === void 0 ? null : _ref6$additionalUrlPa,
    _ref6$merchantInfo = _ref6.merchantInfo,
    merchantInfo = _ref6$merchantInfo === void 0 ? {
      description: 'ExampleMerchant',
      icon: 'https://api.blockmate.io/v1/onchain/static/bitcoin.png'
    } : _ref6$merchantInfo;
  createLinkModal({
    jwt: jwt,
    url: url,
    cleanupActions: cleanupActions,
    additionalUrlParams: additionalUrlParams,
    merchantInfo: merchantInfo
  });
  return null;
};
if (typeof window !== 'undefined') {
  window.BlockmateLink = {
    handleOpen: handleOpen,
    handleClose: handleClose,
    handleRedirect: handleRedirect,
    createLinkModal: createLinkModal
  };
}

exports.LinkModal = LinkModal;
exports.createLinkModal = createLinkModal;
exports.handleClose = handleClose;
exports.handleOpen = handleOpen;
exports.handleRedirect = handleRedirect;
//# sourceMappingURL=index.js.map
