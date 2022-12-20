# react-blockmate-link

> Application to link external service to Blockmate Link app

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
add to your package.json
"react-blockmate-link": "https://github.com/blockmate-io/blockmate-react-link"

run npm i react-blockmate-link
```

## Token

Application requires correct jwt token in order to connect. You can create a token here: https://link-dev.blockmate.io/docs#/default/create_link_token_v1_link_link_token_post

## Usage

```jsx
import React from 'react'

import { handleClose, handleOpen, LinkModal } from 'react-blockmate-link'

const App = () => (
    <>
      <LinkModal jwt={'jwt'}/>
      <div>Test APP</div>
      <button onClick={handleOpen}>Open</button>
    </>
  )

export default App
```

## License

MIT © [blockmate-io](https://github.com/blockmate-io)
