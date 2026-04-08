import { useEffect } from 'react'
import {
  type CreateLinkModalOptions,
  createLinkModal,
  destroyLinkModal,
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
  destroyLinkModal,
  handleInit,
  BLOCKMATE_CLOSE_EVENT_NAME
}

export type LinkModalProps = CreateLinkModalOptions

export const LinkModal = ({
  jwt,
  url = 'https://link.blockmate.io/',
  cleanupActions = {},
  additionalUrlParams = null,
  pollingTimeoutMs = 1000
}: LinkModalProps): null => {
  useEffect(() => {
    createLinkModal({
      jwt,
      url,
      cleanupActions,
      additionalUrlParams,
      pollingTimeoutMs
    })

    return () => {
      destroyLinkModal()
    }
  }, [jwt, url, cleanupActions, additionalUrlParams, pollingTimeoutMs])

  return null
}
