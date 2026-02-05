// src/index.js
import {
  createLinkModal,
  handleOpen,
  handleClose,
  handleRedirect,
  handleCloseRedirect,
  handleInit,
  BLOCKMATE_CLOSE_EVENT_NAME
} from "@blockmate.io/blockmate-js-link";
var LinkModal = ({
  jwt,
  url = "https://link.blockmate.io/",
  cleanupActions = {},
  additionalUrlParams = null,
  pollingTimeoutMs = 1e3
}) => {
  createLinkModal({ jwt, url, cleanupActions, additionalUrlParams, pollingTimeoutMs });
  return null;
};
export {
  BLOCKMATE_CLOSE_EVENT_NAME,
  LinkModal,
  createLinkModal,
  handleClose,
  handleCloseRedirect,
  handleInit,
  handleOpen,
  handleRedirect
};
