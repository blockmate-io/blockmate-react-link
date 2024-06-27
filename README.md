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

### Deposits
If you want to use this library for Blockmate deposit capabilities, you will only need to
include the `LinkModal` component in your application for accommodating an iframe.
To open the modal for deposits, use the `handleOpen` function as shown in the following
example:

```jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { handleClose, handleOpen, LinkModal } from 'blockmate-react-link'

const YourConnectComponent = ({user_jwt_token}) => {
    return (
      <>
        <LinkModal url="https://link.blockmate.io" />
        <div>Test APP</div>
        <button onClick={handleOpen("deposit", undefined, undefined, depositId)}>Open</button>
      </>
    )
}


export default YourConnectComponent
```

### General use
For other use-cases, you might need to handle tokens the following way:
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
