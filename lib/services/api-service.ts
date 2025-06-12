import { AuthenticationState, type Authentication, type Logger, type ThreeDSecureParameters } from '../types'
import { Bucket } from '../models'

export type UseApiOptions = {
  baseUrl?: string
  publicKey: string
}

export class ApiService {
  constructor(
    private readonly logger: Logger,
    private readonly publicKey: string,
    private readonly baseUrl: string = 'https://api.sqala.tech/core/v1/threedsecure'
  ) {}

  executeAuthentication(
    parameters: ThreeDSecureParameters,
    abortSignal: AbortSignal,
  ): AsyncIterableIterator<Authentication> {
    const eventSource = new EventSource(`${this.baseUrl}/${parameters.id}/listen?publicKey=${this.publicKey}`)
    const bucket = new Bucket<Authentication>()

    const logger = this.logger.bind(this)

    const close = () => {
      try {
        bucket.close()
        eventSource.close()
      } catch (error) {
        logger('ApiService: executeAuthentication - close - error', error)
      }
    }

    eventSource.addEventListener('message', (event) => {
      try {
        const parsedEvent = JSON.parse(event.data) as Authentication
        logger('ApiService: executeAuthentication - onmessage', parsedEvent)
        bucket.push(parsedEvent)

        if (
          parsedEvent.state === AuthenticationState.Failed ||
          parsedEvent.state === AuthenticationState.AuthorizedToAttempt ||
          parsedEvent.state === AuthenticationState.Completed ||
          abortSignal.aborted
        ) {
          close()
        }
      } catch (error) {
        logger('ApiService: executeAuthentication - onmessage - error', error)
      }
    })

    eventSource.addEventListener('close', () => {
      logger('ApiService: executeAuthentication - onclose')
      close()
    })

    eventSource.addEventListener('error', (error) => {
      logger('ApiService: executeAuthentication - onerror', error)
      close()
    })
    
    abortSignal.addEventListener('abort', () => {
      logger('ApiService: executeAuthentication - abort')
      close()
    })

    return bucket.iterator
  }

  async setBrowserData(parameters: ThreeDSecureParameters) {
    this.logger('ApiService: setBrowserData', parameters)

    const allowedBrowserColorDepth = [48, 32, 24, 16, 15, 8, 4, 1]
    const colorDepth = allowedBrowserColorDepth.find((x) => x <= screen.colorDepth) ?? 48
    const browser = {
      javaEnabled: true,
      javascriptEnabled: true,
      language: navigator.language,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timeZoneOffset: new Date().getTimezoneOffset(),
      colorDepth,
      acceptHeader:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    }
    this.logger('ApiService: setBrowserData - browser', browser)

    const response = await fetch(`${this.baseUrl}/${parameters.id}/browser?publicKey=${this.publicKey}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(browser),
    })
    this.logger('ApiService: setBrowserData - response', response)
    if (!response.ok) {
      throw new Error('Failed to set browser data')
    }
  }
}
