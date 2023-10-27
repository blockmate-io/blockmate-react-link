var handleOpen = function handleOpen(message, accountId) {
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
  linkConnect: 'http://localhost:3000',
  close: 'blockmate-iframe-close',
  verifyPhone: 'http://localhost:3000/verify-phone',
  changePhone: 'http://localhost:3000/change-phone',
  enableTransfer: 'http://localhost:3000/enable-transfer',
  transferAssets: 'http://localhost:3000/transfer-assets',
  cryptoSavings: 'http://localhost:3000/crypto-savings'
};
var LinkModal = function LinkModal(_ref) {
  var jwt = _ref.jwt;
  if (!jwt) return null;
  var body = document.querySelector('body');
  var iframeStyle = 'display:block; position:fixed; width:100%; height:100%; z-index:100; border:none; top:0; right:0';
  var createIframe = function createIframe(url, accountId) {
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', url + "/?jwt=" + jwt + "&accountId=" + accountId);
    iframe.setAttribute('style', iframeStyle);
    iframe.setAttribute('id', 'link-iframe');
    body.appendChild(iframe);
  };
  var removeIframe = function removeIframe(event) {
    var iframe = document.querySelector('#link-iframe');
    body.removeChild(iframe);
    if (event.data.url) {
      window.location = event.data.url;
    }
  };
  window.onmessage = function (event) {
    var _event$data;
    if (!Object.values(EVENT_MESSAGES).includes(event.data.type)) {
      return null;
    }
    if ((event === null || event === void 0 ? void 0 : (_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.type) === EVENT_MESSAGES.close) {
      removeIframe(event);
    } else {
      createIframe(event.data.type, event.data.accountId);
    }
  };
  return null;
};

exports.LinkModal = LinkModal;
exports.handleClose = handleClose;
exports.handleOpen = handleOpen;
//# sourceMappingURL=index.js.map
