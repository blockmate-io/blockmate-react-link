// src/index.tsx
import { useEffect } from "react";
import {
  createLinkModal,
  destroyLinkModal,
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
  useEffect(() => {
    createLinkModal({
      jwt,
      url,
      cleanupActions,
      additionalUrlParams,
      pollingTimeoutMs
    });
    return () => {
      destroyLinkModal();
    };
  }, [jwt, url, cleanupActions, additionalUrlParams, pollingTimeoutMs]);
  return null;
};
export {
  BLOCKMATE_CLOSE_EVENT_NAME,
  LinkModal,
  createLinkModal,
  destroyLinkModal,
  handleClose,
  handleCloseRedirect,
  handleInit,
  handleOpen,
  handleRedirect
};
