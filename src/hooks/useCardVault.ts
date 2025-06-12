import { useState } from 'react'
import type { ThreeDSChallengeOptions } from '@sqala/threedsecure-js'

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
    amount: number
    installments?: number
    currency?: string
    challengeOptions?: ThreeDSChallengeOptions
    billingAddress?: {
      street: string
      number?: string
      complement?: string
      neighborhood: string
      city: string
      state: string
      country: string
      postalCode: string
    }
    shippingAddress?: {
      street: string
      number?: string
      complement?: string
      neighborhood: string
      city: string
      state: string
      country: string
      postalCode: string
    }
    payer?: {
      email: string
      mobile: string
    }
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
        body: JSON.stringify(request),
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
    create,
  }
}
