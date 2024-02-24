var EVENT_MESSAGES = {
  linkConnect: "",
  verifyPhone: "verify-phone",
  changePhone: "change-phone",
  enableTransfer: "enable-transfer",
  transferAssets: "transfer-assets",
  cryptoSavings: "crypto-savings",
  withdrawAssets: "withdraw-assets",
  close: 'blockmate-iframe-close'
};
var handleOpen = function handleOpen(message, accountId, oauthConnectedAccount) {
  if (message === void 0) {
    message = '';
  }
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect';
  }
  window.parent.postMessage({
    type: message,
    accountId: accountId,
    oauthConnectedAccount: oauthConnectedAccount
  }, '*');
};
var handleClose = function handleClose(endResult) {
  window.parent.postMessage({
    type: 'close',
    endResult: endResult
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
  var OAUTH_LOCAL_STORAGE_KEY = 'oauthConnectedAccount';
  var oauthPollingInterval;
  var startOauthSuccessPolling = function startOauthSuccessPolling() {
    oauthPollingInterval = setInterval(function () {
      var params = new URLSearchParams(window.location.search);
      var maybeOauthConnectedAccount = params.get(OAUTH_QUERY_PARAM);
      if (maybeOauthConnectedAccount) {
        params["delete"](OAUTH_QUERY_PARAM);
        localStorage.setItem(OAUTH_LOCAL_STORAGE_KEY, maybeOauthConnectedAccount);
        window.location.href = "" + window.location.origin + window.location.pathname + "?" + params.toString();
      }
    }, 3000);
  };
  var startLocalStoragePolling = function startLocalStoragePolling() {
    var localStoragePollingInterval = setInterval(function () {
      var oauthConnectedAccount = localStorage.getItem(OAUTH_LOCAL_STORAGE_KEY);
      if (oauthConnectedAccount && createIframe) {
        createIframe(new URL(EVENT_MESSAGES.linkConnect, url).href, undefined, oauthConnectedAccount);
        localStorage.removeItem(OAUTH_LOCAL_STORAGE_KEY);
      }
    }, 3000);
  };
  startOauthSuccessPolling();
  startLocalStoragePolling();
  if (!jwt) return null;
  var body = document.querySelector('body');
  var iframeStyle = 'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0';
  var createIframe = function createIframe(url, accountId, oauthConnectedAccount) {
    var iframeId = 'link-iframe';
    var existingIframe = document.getElementById(iframeId);
    if (!existingIframe) {
      var additionalParamsStr = '';
      if (additionalUrlParams) {
        additionalParamsStr = Object.keys(additionalUrlParams).map(function (key) {
          return "&" + key + "=" + additionalUrlParams[key] + "\n        ";
        }).join('');
      }
      var urlWithParams = url + "?jwt=" + jwt + "&accountId=" + accountId + additionalParamsStr;
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
  window.onmessage = function (event) {
    var _event$data2;
    if (!Object.hasOwn(EVENT_MESSAGES, event.data.type)) {
      return null;
    }
    if ((event === null || event === void 0 ? void 0 : (_event$data2 = event.data) === null || _event$data2 === void 0 ? void 0 : _event$data2.type) === 'close') {
      removeIframe(event);
    } else {
      createIframe(new URL(EVENT_MESSAGES[event.data.type], url).href, event.data.accountId, event.data.oauthConnectedAccount);
    }
  };
  return null;
};

export { LinkModal, handleClose, handleOpen };
//# sourceMappingURL=index.modern.js.map
