import {
  createLinkModal,
  handleOpen,
  handleClose,
  handleRedirect,
  handleCloseRedirect,
  handleInit,
  BLOCKMATE_CLOSE_EVENT_NAME
} from '@blockmate.io/blockmate-js-link'

export {
  createLinkModal,
  handleOpen,
  handleClose,
  handleRedirect,
  handleCloseRedirect,
  handleInit,
  BLOCKMATE_CLOSE_EVENT_NAME
}

export const LinkModal = ({
  jwt,
  url = 'https://link.blockmate.io/',
  cleanupActions = {},
  additionalUrlParams = null,
  pollingTimeoutMs = 1000
}) => {
  createLinkModal({ jwt, url, cleanupActions, additionalUrlParams, pollingTimeoutMs })
  return null
}
