import { useCallback, useState, type RefObject } from 'react'
import type { ThreeDSecureParameters, ThreeDSecureResult } from '@sqala/threedsecure-js'
import { ThreeDSecureService } from '@sqala/threedsecure-js'

export type UseThreeDSecureOptions = {
  publicKey: string
  container: RefObject<HTMLElement>
}

export const useThreeDSecure = ({ publicKey, container }: UseThreeDSecureOptions) => {
  const [result, setResult] = useState<ThreeDSecureResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async (request: ThreeDSecureParameters, abortController: AbortController) => {
    try {
      const threeDSecure = new ThreeDSecureService({
        publicKey,
        container: container.current,
      })

      const response = await threeDSecure.execute(request, abortController)
      setResult(response)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to execute three-d-secure')
    }
  }, [publicKey, container])

  return {
    result,
    error,
    execute,
  }
}
