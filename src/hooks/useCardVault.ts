import { useState } from 'react'

export type UseCardVaultOptions = {
  baseUrl?: string
  publicKey: string
}

export type CardVault = {
  token: string
  threeDSecureId: string
}

export type CardVaultRequest = {
  number: string
  expYear: number
  expMonth: number
  holderName: string
  cvv: string
  threeDSecure: {
    value: number
  }
}

export const useCardVault = ({ baseUrl = 'https://api.sqala.tech/core/v1', publicKey }: UseCardVaultOptions) => {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [cardVault, setCardVault] = useState<CardVault | null>(null)

  const create = async (request: CardVaultRequest) => {
    if (isLoading) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${baseUrl}/card-vaults?publicKey=${publicKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      })
      const data = await response.json()
      setCardVault(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create card vault')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    error,
    isLoading,
    cardVault,
    create
  }
}