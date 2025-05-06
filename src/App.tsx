import { type RefObject, useEffect, useRef, useState } from 'react'
import './App.css'
import { useCardVault } from './hooks'
import { useThreeDSecure } from './hooks/useThreeDSecure'

function App() {
  const container = useRef<HTMLDivElement>(null)
  const [number, setNumber] = useState('')
  const [expYear, setExpYear] = useState(0)
  const [expMonth, setExpMonth] = useState(0)
  const [holderName, setHolderName] = useState('')
  const [cvv, setCvv] = useState('')
  const [value, setValue] = useState(0)

  const {
    isLoading,
    error: cardVaultError,
    cardVault,
    create,
  } = useCardVault({
    publicKey: 'your-public-key',
  })

  const {
    isExecuting,
    result,
    execute,
    error: threeDSecureError,
  } = useThreeDSecure({
    baseUrl: 'https://api.sqala.tech/core/v1/threedsecure',
    publicKey: 'your-public-key',
    container: container as RefObject<HTMLDivElement>,
  })

  useEffect(() => {
    if (!cardVault || isExecuting) {
      return
    }

    execute({
      id: cardVault.threeDSecureId,
    })
  }, [cardVault, execute, isExecuting])

  const handleExecute = async () => {
    await create({
      number,
      expYear,
      expMonth,
      holderName,
      cvv,
      threeDSecure: {
        value,
      },
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
        <input
          className="input"
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Enter card number"
        />
        <input
          className="input"
          type="text"
          value={expYear}
          onChange={(e) => setExpYear(Number.parseInt(e.target.value))}
          placeholder="Enter card expiry year"
        />
        <input
          className="input"
          type="text"
          value={expMonth}
          onChange={(e) => setExpMonth(Number.parseInt(e.target.value))}
          placeholder="Enter card expiry month"
        />
        <input
          className="input"
          type="text"
          value={holderName}
          onChange={(e) => setHolderName(e.target.value)}
          placeholder="Enter card holder name"
        />
        <input
          className="input"
          type="text"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          placeholder="Enter card CVV"
        />
        <input
          className="input"
          type="number"
          value={value}
          onChange={(e) => setValue(Number.parseInt(e.target.value))}
          placeholder="Enter card value"
        />
        <button className="button" type="button" onClick={handleExecute} disabled={isLoading || isExecuting}>
          Execute
        </button>
      </div>
      {cardVault && <p>3DS ID: {cardVault.threeDSecureId}</p>}
      {cardVaultError && <p>{cardVaultError}</p>}
      {threeDSecureError && <p>{threeDSecureError}</p>}
      {result && <pre style={{ flex: 1 }}>{JSON.stringify(result)}</pre>}
      {<div style={{ flex: 1 }} ref={container} />}
    </div>
  )
}

export default App
