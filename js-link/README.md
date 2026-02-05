# @blockmate.io/blockmate-js-link

Vanilla JS core package for Blockmate Link.

## Install

```bash
npm i @blockmate.io/blockmate-js-link
```

## Usage

### Script (CDN) usage
If you want to use this library without a bundler, include the IIFE build from a CDN and use the global.
```html
<script src="https://cdn.jsdelivr.net/npm/@blockmate.io/blockmate-js-link@1.0.3/dist/index.iife.js"></script>
<script>
  BlockmateJSLink.createLinkModal({
    url: "https://link.blockmate.io",
    jwt: "USER_JWT_TOKEN",
    additionalUrlParams: {
    merchantDescription: 'YourCompanyName',
    merchantIcon: 'https://your-company-name.com/logo.png'
  }
  });

document.getElementById("open-button").addEventListener("click", () => {
  BlockmateJSLink.handleOpen(
      "deposit", // Use "deposit" for deposits or "withdrawal" for withdrawals
      undefined,
      undefined,
      {
        depositId: "...",
        jwt: "...", // Optional, overrides jwt provided in createLinkModal
      }
  );
});

window.addEventListener(BlockmateJSLink.BLOCKMATE_CLOSE_EVENT_NAME, (event) => {
  const { endResult } = event.detail || {};
  console.log("Blockmate modal closed", endResult); // "success", "error" or undefined
});
</script>
```

You can also use a literal event name if needed: `blockmate:close`.

### Deposits and withdrawals
If you want to use this library for Blockmate deposit / withdrawal capabilities, follow this guide. For
instructions on non-deposit capabilities, please jump to the next section.

#### Obtaining JWT
To perform deposits, you will need to provide a jwt token, a link to your logo and a name of your company
that you wish to have displayed in modals.

The jwt token can be obtained using your API key by the following script:
```js
const API_KEY = "PASTE-YOUR-API-KEY-HERE";
fetch("https://api.blockmate.io/v1/auth/developer", {
    headers: {
      "X-API-KEY": API_KEY
    }
  }
).then(res =>
  res.json()
).then(data =>
  console.log(data.token)
);
```

#### Initializing a deposit
A deposit process has to be initialized on your backend first. You provide deposit parameters
to `https://api.blockmate.io/v1/exchange/deposit/initialize` and receive a `depositId` in return.
You will need this `depositId` in the next steps.

#### Initializing a withdrawal
A withdrawal process has to be initialized on your backend first. You provide withdrawal parameters
to `https://api.blockmate.io/v1/exchange/withdrawal/initialize` and receive a `withdrawalId` in return.
You will need this `withdrawalId` in the next steps.

#### Vanilla JS
To perform deposits in your application using vanilla JS, you first have to initialize the modal
by calling `createLinkModal` function. An example of this approach is shown next:
```javascript
import { createLinkModal, handleOpen } from "@blockmate.io/blockmate-js-link";

createLinkModal({
  url: "https://link.blockmate.io",
  jwt: "OBTAINED_JWT",  // Optional, can be provided in handleOpen instead
  additionalUrlParams: {
    merchantDescription: 'YourCompanyName',
    merchantIcon: 'https://your-company-name.com/logo.png'
  }
});

document.getElementById("open-button").addEventListener("click", () => {
  handleOpen(
    "deposit", // Use "deposit" for deposits or "withdrawal" for withdrawals
    undefined,
    undefined,
    {
      depositId: "...",
      jwt: "...", // Optional, overrides jwt provided in createLinkModal
    }
  );
});
```

### Non-deposit capabilities

#### JWT Token

For non-deposit capabilities, the application requires correct jwt token in order to be used.
1. Get a `User JWT token` by Authentication of End-user from https://docs.blockmate.io/docs/quickstart
2. In your Link component you can get a `linkToken` using `user_jwt_token` from the previous point.

For non-deposit use, the integration can be done the following way:
```javascript
import { createLinkModal, handleOpen } from "@blockmate.io/blockmate-js-link";

createLinkModal({
  url: "https://link.blockmate.io",
  jwt: "USER_JWT_TOKEN"
});

document.getElementById("open-button").addEventListener("click", () => {
  handleOpen("linkConnect");
});
```

## For maintainers
Releasing js-link package:
`npm version patch -w js-link`
`npm publish -w js-link --access public`

Releasing react-wrapper package:
`npm version patch -w react-wrapper`
`npm publish -w react-wrapper --access public`

## License

MIT © blockmate-io
