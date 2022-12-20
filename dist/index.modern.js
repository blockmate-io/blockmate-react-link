var handleOpen = function handleOpen() {
  window.parent.postMessage({
    type: EVENT_MESSAGES.open
  }, '*');
};
var handleClose = function handleClose(url) {
  window.parent.postMessage({
    type: EVENT_MESSAGES.close,
    url: url
  }, '*');
};
var EVENT_MESSAGES = {
  open: 'blockmate-iframe-open',
  close: 'blockmate-iframe-close'
};
var LinkModal = function LinkModal(_ref) {
  var jwt = _ref.jwt,
    _ref$url = _ref.url,
    url = _ref$url === void 0 ? 'https://link-dev.blockmate.io' : _ref$url;
  if (!jwt) return null;
  var body = document.querySelector('body');
  var iframeStyle = 'display:block; position:absolute; width:100%; height:100%; zIndex:100; border:none; top:0; right:0';
  var createIframe = function createIframe() {
    var iframe = document.createElement('iframe');
    iframe.setAttribute('src', url + "/?jwt=" + jwt);
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
    var _event$data, _event$data2;
    if ((event === null || event === void 0 ? void 0 : (_event$data = event.data) === null || _event$data === void 0 ? void 0 : _event$data.type) === EVENT_MESSAGES.close) {
      removeIframe(event);
    }
    if ((event === null || event === void 0 ? void 0 : (_event$data2 = event.data) === null || _event$data2 === void 0 ? void 0 : _event$data2.type) === EVENT_MESSAGES.open) {
      createIframe();
    }
  };
  return null;
};

export { LinkModal, handleClose, handleOpen };
//# sourceMappingURL=index.modern.js.map
