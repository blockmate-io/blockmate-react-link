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
  deposit: 'deposit'
};
var TRUSTED_ORIGINS = ['https://link.blockmate.io', 'https://link-dev-ovh.blockmate.io', 'https://link-cs.blockmate.io', 'http://localhost:3000'];
var handleOpen = function handleOpen(message, accountId, oauthConnectedAccount, extraUrlParams) {
  if (message === void 0) {
    message = '';
  }
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect';
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
var LinkModal = function LinkModal(_ref) {
  var jwt = _ref.jwt,
    _ref$url = _ref.url,
    url = _ref$url === void 0 ? 'https://link.blockmate.io/' : _ref$url,
    _ref$cleanupActions = _ref.cleanupActions,
    cleanupActions = _ref$cleanupActions === void 0 ? {} : _ref$cleanupActions,
    _ref$additionalUrlPar = _ref.additionalUrlParams,
    additionalUrlParams = _ref$additionalUrlPar === void 0 ? null : _ref$additionalUrlPar;
  var OAUTH_QUERY_PARAM = 'oauthConnectedAccount';
  var OAUTH_LOCAL_STORAGE_KEY = 'oauth_connected_account';
  var oauthPollingInterval;
  var startOauthSuccessPolling = function startOauthSuccessPolling() {
    oauthPollingInterval = setInterval(function () {
      var params = new URLSearchParams(window.location.search);
      var maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
      if (maybeOauthConnectedAccount) {
        params["delete"](OAUTH_QUERY_PARAM);
        localStorage.setItem(OAUTH_LOCAL_STORAGE_KEY, maybeOauthConnectedAccount);
        location.replace("" + window.location.origin + window.location.pathname + "?" + params.toString());
      }
    }, 500);
  };
  var startLocalStoragePolling = function startLocalStoragePolling() {
    var localStoragePollingInterval = setInterval(function () {
      var oauthConnectedAccount = localStorage.getItem(OAUTH_LOCAL_STORAGE_KEY);
      var currentUrl = new URL(window.location.href);
      var oauthQueryParamDeletedAlready = !currentUrl.searchParams.has(OAUTH_QUERY_PARAM);
      if (oauthConnectedAccount && oauthQueryParamDeletedAlready) {
        createIframe(new URL(EVENT_MESSAGES.linkConnect, url).href, undefined, oauthConnectedAccount);
        localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
      }
    }, 500);
  };
  var body = document.querySelector('body');
  var iframeStyle = 'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0';
  var createIframe = function createIframe(url, accountId, oauthConnectedAccount) {
    var iframeId = 'link-iframe';
    var existingIframe = document.getElementById(iframeId);
    if (!existingIframe) {
      var parentUrlEncoded = encodeURIComponent(window.location.href);
      var urlParamsArray = [['jwt', jwt], ['accountId', accountId], ['parentUrlEncoded', parentUrlEncoded]].concat(Object.entries(additionalUrlParams != null ? additionalUrlParams : {})).filter(function (_ref2) {
        var value = _ref2[1];
        return value;
      });
      var urlParams = urlParamsArray.join('&');
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
    body.removeChild(iframe);
    if (event.data.url) {
      window.location = event.data.url;
    }
    var endResult = event === null || event === void 0 ? void 0 : (_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.endResult;
    if (endResult && cleanupActions[endResult]) {
      cleanupActions[endResult]();
    }
  };
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
      removeIframe(event);
    } else if ((event === null || event === void 0 ? void 0 : (_event$data4 = event.data) === null || _event$data4 === void 0 ? void 0 : _event$data4.type) === 'redirect') {
      window.location.replace(event.data.targetUrl);
    } else {
      var _event$data$extraUrlP;
      var urlParams = Object.entries((_event$data$extraUrlP = event.data.extraUrlParams) != null ? _event$data$extraUrlP : {}).map(function (_ref3) {
        var key = _ref3[0],
          value = _ref3[1];
        return key + "=" + value;
      }).join('&');
      if (urlParams.length > 0) {
        urlParams = "?" + urlParams;
      }
      console.log('got these extra params: ');
      console.log(event.data.extraUrlParams);
      console.log("built url using them: " + new URL("" + EVENT_MESSAGES[event.data.type] + urlParams, url).href);
      createIframe(new URL("" + EVENT_MESSAGES[event.data.type] + urlParams, url).href, event.data.accountId, event.data.oauthConnectedAccount);
    }
  };
  return null;
};

export { LinkModal, handleClose, handleOpen, handleRedirect };
//# sourceMappingURL=index.modern.js.map
