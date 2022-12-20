import React from 'react'

import { handleClose, handleOpen, LinkModal } from 'react-blockmate-link'
import 'react-blockmate-link/dist/index.css'

const App = () => (
    <>
      <LinkModal jwt={'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJyZWRpcmVjdF91cmkiOiJodHRwOi8vMTI3LjAuMC4xOjkwMDAiLCJleHAiOjM0NjkyODYwMTUuOTkzNDk2LCJqd3QiOiJleUpoYkdjaU9pSkZaRVJUUVNJc0luUjVjQ0k2SWtwWFZDSjkuZXlKbGVIQWlPakUzTURBNE1qRTBNelVzSW1saGRDSTZNVFkyT1RJNE5qQXhOU3dpYm1KbUlqb3hOalk1TWpnMk1ERTFMQ0p3Y205cVpXTjBYMmxrSWpveE9ETXNJblI1Y0dVaU9pSjFjMlZ5SWl3aWRYTmxjbDkxZFdsa0lqb2laVGhqWlRJeFpXWXRZV00yTVMwMFlqSTNMV0ppTlRjdFpHVTRZV05sWlRBNE0yVm1JbjAub0xYdVdPMHlqaFBkLVV4d1pGYkt2ZWdUdDJ4QWo2Wk5pR0dQeEgyNXExWElEbTY5S2x1aXpZS1FybHM0Y3dLdXgwSUVtdE5RdFFIVm9WbEkybXJLQlEifQ.E3MczuHCIDMTnNiI75agyvZXQg7z4X609SzPagCh6u3rWZTNYZIfWX2OF-xc7GqjoOzjqcB1DJJrZycgCuvGAw'}/>
      <div>Test APP</div>
      <button onClick={handleOpen}>Open</button>
    </>
  )

export default App
