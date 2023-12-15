var linkUrl = 'https://link-dev-ovh.blockmate.io/';
var handleOpen = function handleOpen(message, accountId) {
  if (message === void 0) {
    message = '';
  }
  if (!Object.keys(EVENT_MESSAGES).includes(message)) {
    message = 'linkConnect';
  }
  window.parent.postMessage({
    type: EVENT_MESSAGES[message],
    accountId: accountId
  }, '*');
};
var handleClose = function handleClose(url) {
  window.parent.postMessage({
    type: EVENT_MESSAGES.close,
    url: url
  }, '*');
};
var EVENT_MESSAGES = {
  linkConnect: "" + linkUrl,
  close: 'blockmate-iframe-close',
  verifyPhone: linkUrl + "verify-phone",
  changePhone: linkUrl + "change-phone",
  enableTransfer: linkUrl + "enable-transfer",
  transferAssets: linkUrl + "transfer-assets",
  cryptoSavings: linkUrl + "crypto-savings"
};
var LinkModal = function LinkModal(_ref) {
  var jwt = _ref.jwt,
    _ref$cleanupActions = _ref.cleanupActions,
    cleanupActions = _ref$cleanupActions === void 0 ? {} : _ref$cleanupActions;
  if (!jwt) return null;
  var body = document.querySelector('body');
  var iframeStyle = 'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0';
  var createIframe = function createIframe(url, accountId) {
    var iframeId = 'link-iframe';
    var existingIframe = document.getElementById(iframeId);
    if (!existingIframe) {
      var iframe = document.createElement('iframe');
      iframe.setAttribute('src', url + "?jwt=" + jwt + "&accountId=" + accountId);
      iframe.setAttribute('style', iframeStyle);
      iframe.setAttribute('id', iframeId);
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
    if (!Object.values(EVENT_MESSAGES).includes(event.data.type)) {
      return null;
    }
    if ((event === null || event === void 0 ? void 0 : (_event$data2 = event.data) === null || _event$data2 === void 0 ? void 0 : _event$data2.type) === EVENT_MESSAGES.close) {
      removeIframe(event);
    } else {
      createIframe(event.data.type, event.data.accountId);
    }
  };
  return null;
};

export { LinkModal, handleClose, handleOpen };
//# sourceMappingURL=index.modern.js.map
