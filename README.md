# blockmate-react-link

> Application to link external service to Blockmate Link app

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
1/Add to your package.json in depencencies:
"blockmate-react-link": "https://github.com/blockmate-io/blockmate-react-link"

2/ run
npm i blockmate-react-link
```

## Token

Application requires correct jwt token in order to connect. You can create a token here: https://link-dev.blockmate.io/docs#/default/create_link_token_v1_link_link_token_post

## Usage

```jsx
import React from 'react'

import { handleClose, handleOpen, LinkModal } from 'blockmate-react-link'

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
