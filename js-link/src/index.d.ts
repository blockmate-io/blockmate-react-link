type LinkQueryValue = string | number | boolean;
export interface LinkExtraUrlParams extends Record<string, LinkQueryValue | null | undefined> {
    depositId?: string;
    jwt?: string;
    lang?: string;
}
export interface LinkClosePayload {
    endResult?: string;
    operationId?: string | number;
}
export interface BlockmateCloseEventDetail {
    endResult?: string;
    url?: string;
    origin?: string;
    operation_id?: string | number;
}
export type LinkCleanupAction = () => void;
export type LinkCleanupActions = Partial<Record<string, LinkCleanupAction>>;
export interface CreateLinkModalOptions {
    jwt?: string;
    url?: string;
    cleanupActions?: LinkCleanupActions;
    additionalUrlParams?: LinkExtraUrlParams | null;
    pollingTimeoutMs?: number;
}
declare const EVENT_MESSAGES: {
    readonly linkConnect: "";
    readonly verifyPhone: "verify-phone";
    readonly changePhone: "change-phone";
    readonly enableTransfer: "enable-transfer";
    readonly transferAssets: "transfer-assets";
    readonly cryptoSavings: "crypto-savings";
    readonly withdrawAssets: "withdraw-assets";
    readonly close: "blockmate-iframe-close";
    readonly redirect: "redirect";
    readonly redirectClose: "redirect-close";
    readonly deposit: "deposit-exchange";
    readonly directDeposit: "deposit-wallet-connect";
    readonly withdrawal: "withdrawal-exchange";
};
export type LinkMessageType = keyof typeof EVENT_MESSAGES;
export interface BlockmateLinkGlobal {
    handleOpen: typeof handleOpen;
    handleClose: typeof handleClose;
    handleRedirect: typeof handleRedirect;
    handleCloseRedirect: typeof handleCloseRedirect;
    createLinkModal: typeof createLinkModal;
    destroyLinkModal: typeof destroyLinkModal;
    handleInit: typeof handleInit;
    BLOCKMATE_CLOSE_EVENT_NAME: typeof BLOCKMATE_CLOSE_EVENT_NAME;
}
declare global {
    interface Window {
        BlockmateLink?: BlockmateLinkGlobal;
    }
}
export declare const BLOCKMATE_CLOSE_EVENT_NAME = "blockmate:close";
export declare const destroyLinkModal: () => void;
export declare const handleOpen: (message?: LinkMessageType | string, accountId?: string, oauthConnectedAccount?: string, extraUrlParams?: LinkExtraUrlParams | null) => void;
export declare const handleClose: (closePayload?: LinkClosePayload | string) => void;
export declare const handleRedirect: (targetUrl: string, inNewTab?: boolean) => void;
export declare const handleCloseRedirect: () => void;
export declare const handleInit: () => void;
export declare const createLinkModal: ({ jwt, url, cleanupActions, additionalUrlParams, pollingTimeoutMs }: CreateLinkModalOptions) => void;
export {};
//# sourceMappingURL=index.d.ts.map