# blockmate-react-link

> Application to link external service to Blockmate Link app

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

Run ```npm i blockmate-react-link```


## JWT Token

Application requires correct jwt token in order to be used.

1. Get a `User JWT token` by Authentication of End-user from https://docs.blockmate.io/docs/quickstart

2. In your Link component you can get a `linkToken` using `user_jwt_token` from the previous point.

## Usage

### General use
If you only want to use this library for deposit capabilities, you can skip to the next section.
For a general use the integration can be done the following way:
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

### Deposits
If you want to use this library for Blockmate deposit capabilities, you will only need to
include the `LinkModal` component in your application for accommodating an iframe.
You will need to provide a jwt token, a link to your logo and a name of your company
that you wish to have displayed in modals.

The jwt token can be obtained using your API key using the following script:
```js
const API_KEY = "PASTE-YOUR-API-KEY-HERE";
fetch("https://api.blockmate.io/v1/auth/developer", {
    headers: {
      "X-API-KEY": FAKE_API_KEY
    }
  }
).then(res =>
  res.json()
).then(data =>
  console.log(data.token)
);
```

To open the modal for deposits, use the `handleOpen` function as shown in the following
example:

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { handleClose, handleOpen, LinkModal } from 'blockmate-react-link'

const YourConnectComponent = () => {
    return (
      <>
        <LinkModal
          url="https://link.blockmate.io"
          jwt="JWT-OBTAINED-IN-PREVIOUS-STEP" // Replace with your jwt token
          merchantInfo={{
            description: 'YourCompanyName',
            icon: 'https://your-company-name.com/logo.png'
          }}
        />
        <div>Test APP</div>
        <button onClick={{
          depositId,
          fiatAmount: "100", // Replace with fiat amount
          fiatCurrency: "USD", // Specify currency ("USD" / "EUR" / "CZK")
        }}>
          Open
        </button>
      </>
    )
}


export default YourConnectComponent
```
**Note:** The `depositId` in this snippet comes from the call to `https://api.blockmate.io/v1/exchange/deposit/initialize`.

## License

MIT © [blockmate-io](https://github.com/blockmate-io)
