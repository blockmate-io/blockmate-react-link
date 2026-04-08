"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.tsx
var index_exports = {};
__export(index_exports, {
  BLOCKMATE_CLOSE_EVENT_NAME: () => import_blockmate_js_link.BLOCKMATE_CLOSE_EVENT_NAME,
  LinkModal: () => LinkModal,
  createLinkModal: () => import_blockmate_js_link.createLinkModal,
  destroyLinkModal: () => import_blockmate_js_link.destroyLinkModal,
  handleClose: () => import_blockmate_js_link.handleClose,
  handleCloseRedirect: () => import_blockmate_js_link.handleCloseRedirect,
  handleInit: () => import_blockmate_js_link.handleInit,
  handleOpen: () => import_blockmate_js_link.handleOpen,
  handleRedirect: () => import_blockmate_js_link.handleRedirect
});
module.exports = __toCommonJS(index_exports);
var import_react = require("react");
var import_blockmate_js_link = require("@blockmate.io/blockmate-js-link");
var LinkModal = ({
  jwt,
  url = "https://link.blockmate.io/",
  cleanupActions = {},
  additionalUrlParams = null,
  pollingTimeoutMs = 1e3
}) => {
  (0, import_react.useEffect)(() => {
    (0, import_blockmate_js_link.createLinkModal)({
      jwt,
      url,
      cleanupActions,
      additionalUrlParams,
      pollingTimeoutMs
    });
    return () => {
      (0, import_blockmate_js_link.destroyLinkModal)();
    };
  }, [jwt, url, cleanupActions, additionalUrlParams, pollingTimeoutMs]);
  return null;
};
