# blockmate-react-link

> Application to link external service to Blockmate Link app

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

Run ```npm i blockmate-react-link```


## Usage

### Deposits
If you want to use this library for Blockmate deposit capabilities, follow this guide. For
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


#### React
For usage in React, you will only need to include  the `LinkModal` component in
your application for accommodating an iframe.
To open the modal for deposits, use the `handleOpen` function as shown in the following
example:
```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { handleClose, handleOpen, LinkModal } from "blockmate-react-link";

const YourConnectComponent = () => {
    return (
      <>
        <LinkModal
          url="https://link.blockmate.io"
          jwt="OBTAINED_JWT" // Replace with your jwt token. Optional, jwt can be provided later in handleOpen.
          merchantInfo={{
            description: 'YourCompanyName',
            icon: 'https://your-company-name.com/logo.png'
          }}
        />
        <div>Test APP</div>
        <button onClick={() => handleOpen(
          "deposit", // Use "deposit" for deposits from exchange, or "directDeposit" for deposits using WalletConnect
          undefined,
          undefined,
          {
            depositId: "...",
            jwt: "...", // Optional, overrides jwt provided in <LinkModal /> component
          }
        )}>
          Open
        </button>
      </>
    )
}


export default YourConnectComponent
```

#### Vanilla JS
To perform deposits in your application using vanilla JS, you first have to initialize the modal
by calling `createLinkModal` function. An example of this approach is shown next:
```javascript
import { createLinkModal, handleOpen } from "blockmate-react-link";

createLinkModal({
  url: "https://link.blockmate.io",
  jwt: "OBTAINED_JWT",  // Optional, can be provided in handleOpen instead
});

document.getElementById("open-button").addEventListener("click", () => {
  handleOpen(
    "deposit", // Use "deposit" for deposits from exchange, or "directDeposit" for deposits using WalletConnect
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
```jsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import { handleClose, handleOpen, LinkModal } from 'blockmate-react-link'

const YourConnectComponent = ({user_jwt_token}) => {
    const [linkToken, setLinkToken] = useState(null);


    useEffect(() => {
        axios.post(
            "/v1/link/link/token",
            {
                "jwt": user_jwt_token,
                "redirect_uri": ""
            },
            {
                baseURL: "https://link.blockmate.io"
            }
        ).catch(e => {
            console.log(e)
        }).then(r => {
            setLinkToken(r.data.link_token)
        })
    }, [user_jwt_token])



    return (
      <>
        <LinkModal url="https://link.blockmate.io" jwt={linkToken} />
        <div>Test APP</div>
        <button onClick={handleOpen}>Open</button>
      </>
    )
}


export default YourConnectComponent
```

## License

MIT © [blockmate-io](https://github.com/blockmate-io)
