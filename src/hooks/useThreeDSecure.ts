import { useState, type RefObject } from 'react'
import type { ThreeDSecureParameters, ThreeDSecureResult } from '@sqala/threedsecure-js'
import { ThreeDSecureService } from '@sqala/threedsecure-js'

export type UseThreeDSecureOptions = {
  baseUrl: string
  publicKey: string
  container: RefObject<HTMLElement>
}

export const useThreeDSecure = ({ baseUrl, publicKey, container }: UseThreeDSecureOptions) => {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<ThreeDSecureResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const execute = async (request: ThreeDSecureParameters) => {
    if (isExecuting) {
      return
    }

    setIsExecuting(true)
    try {
      const threeDSecure = new ThreeDSecureService({
        baseUrl,
        publicKey,
        container: container.current,
      })
      const response = await threeDSecure.execute(request)
      setResult(response)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to execute three-d-secure')
    } finally {
      setIsExecuting(false)
    }
  }

  return {
    isExecuting,
    result,
    error,
    execute,
  }
}
