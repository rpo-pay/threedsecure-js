import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { useCardVault } from './hooks'
import { useThreeDSecure } from './hooks/useThreeDSecure'
import { ThreeDSChallengeOptions } from '@sqala/threedsecure-js'

function App() {
  const container = useRef<HTMLDivElement>(null)
  const [number, setNumber] = useState('5162921079038030')
  const [expYear, setExpYear] = useState(33)
  const [expMonth, setExpMonth] = useState(2)
  const [holderName, setHolderName] = useState('TIAGO C RESENDE')
  const [cvv, setCvv] = useState('002')
  const [amount, setAmount] = useState(100)
  const [installments, setInstallments] = useState(1)

  const {
    isLoading,
    error: cardVaultError,
    cardVault,
    create,
  } = useCardVault({
    publicKey: '5aa364f4-deed-456f-b3a5-f2570181d6f1',
  })

  const {
    result,
    execute,
    error: threeDSecureError,
  } = useThreeDSecure({
    publicKey: '5aa364f4-deed-456f-b3a5-f2570181d6f1',
    container: container as RefObject<HTMLDivElement>,
  })

  const execute3DSecure = useCallback(async (threeDSecureId: string, abortController: AbortController) => {
    await execute({
      id: threeDSecureId,
    }, abortController)
  }, [execute])

  useEffect(() => {
    if (!cardVault) {
      return
    }

    const abortController = new AbortController()

    execute3DSecure(cardVault.threeDSecureId, abortController)

    return () => abortController.abort()
  }, [cardVault, execute3DSecure])

  const handleExecute = async () => {
    await create({
      number,
      expYear,
      expMonth,
      holderName,
      cvv,
      threeDSecure: {
        amount,
        installments,
        challengeOptions: ThreeDSChallengeOptions.ChallengeNotRequestedDataShareOnly,
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
          value={amount}
          onChange={(e) => setAmount(Number.parseInt(e.target.value))}
          placeholder="Enter card amount"
        />
        <input
          className="input"
          type="number"
          value={installments}
          onChange={(e) => setInstallments(Number.parseInt(e.target.value))}
          placeholder="Enter card installments"
        />
        <button className="button" type="button" onClick={handleExecute} disabled={isLoading}>
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
