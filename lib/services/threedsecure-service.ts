import {
  type Authentication,
  AuthenticationState,
  IFrameEvents,
  type Logger,
  type ThreeDSecureParameters,
  type ThreeDSecureResult,
} from '../types'
import { ApiService } from './api-service'
import { Base64Encoder } from './base64-encoder'
import { ChallengeService } from './challenge-service'
import { DsMethodService } from './dsmethod-service'

export type ThreeDSecureOptions = {
  baseUrl?: string
  publicKey: string
  container: HTMLElement
  logger?: Logger
  iframeEvents?: IFrameEvents
}

export class ThreeDSecureService {
  private readonly container: HTMLElement
  private readonly logger: Logger
  private readonly apiService: ApiService
  private readonly dsMethodService: DsMethodService
  private readonly challengeService: ChallengeService
  private readonly actionMapping = new Map([
    [AuthenticationState.PendingDirectoryServer, this.handleDsMethod.bind(this)],
    [AuthenticationState.PendingChallenge, this.handleChallenge.bind(this)],
    [AuthenticationState.Failed, this.handleResult.bind(this)],
    [AuthenticationState.Completed, this.handleResult.bind(this)],
    [AuthenticationState.AuthorizedToAttempt, this.handleResult.bind(this)],
  ])

  constructor(
    options: ThreeDSecureOptions,
  ) {
    this.logger = ThreeDSecureService.logger(options.logger)
    this.logger('ThreeDSecureService.constructor', 'initializing', options)
    this.container = options.container
    this.apiService = new ApiService(this.logger, options.publicKey, options.baseUrl)
    const base64Encoder = new Base64Encoder()
    this.dsMethodService = new DsMethodService(this.logger, base64Encoder, options.iframeEvents)
    this.challengeService = new ChallengeService(this.logger, base64Encoder, options.iframeEvents)
  }

  async execute(
    parameters: ThreeDSecureParameters,
    abortController: AbortController = new AbortController(),
  ): Promise<ThreeDSecureResult> {
    this.logger('ThreeDSecureService.execute', 'starting')

    const tenMinutes = 10 * 60 * 1000

    this.logger('ThreeDSecureService.execute', 'configuring timeout')
    const timeoutId = setTimeout(() => {
      abortController.abort('timeout')
    }, tenMinutes)

    try {
      this.logger('ThreeDSecureService.execute', 'setBrowserData', parameters)
      await this.apiService.setBrowserData(parameters)

      let authentication!: Authentication
      for await (authentication of this.apiService.executeAuthentication(parameters, abortController.signal)) {
        this.logger('ThreeDSecureService.execute', 'flowStep', authentication)
        const action = this.actionMapping.get(authentication.state)
        await action?.(authentication, abortController)
        this.logger('ThreeDSecureService.execute', 'flowStep - end')
      }

      abortController.abort('completed')

      return {
        id: authentication.id,
        transStatus: authentication.transStatus,
        transStatusReason: authentication.transStatusReason,
        authenticationValue: authentication.authenticationValue,
        eci: authentication.eci,
        dsTransId: authentication.dsTransId,
        protocolVersion: authentication.protocolVersion,
        failReason: authentication.failReason,
        isSuccess: () =>
          authentication.state === AuthenticationState.Completed ||
          authentication.state === AuthenticationState.AuthorizedToAttempt,
      }
    } catch (error) {
      this.logger('ThreeDSecureService.execute', 'error', error)
      abortController.abort('error')
      throw error
    } finally {
      clearTimeout(timeoutId)
      this.challengeService.clean()
      this.dsMethodService.clean()
      this.logger('ThreeDSec5ureService.execute', 'finally')
    }
  }

  private handleResult(authentication: Authentication, abortController: AbortController) {
    this.logger('ThreeDSecureService.execute', 'handleResult', authentication)
    abortController.abort('completed')
    return Promise.resolve()
  }

  private handleDsMethod(authentication: Authentication, _: AbortController) {
    this.logger('ThreeDSecureService.execute', 'handleDsMethod', authentication)
    return this.dsMethodService.executeDsMethod(authentication, this.container)
  }

  private handleChallenge(authentication: Authentication, _: AbortController) {
    this.logger('ThreeDSecureService.execute', 'handleChallenge', authentication)
    return this.challengeService.executeChallenge(authentication, this.container)
  }

  private static logger(logger?: Logger) {
    return (entrypoint: string, message: string, ...rest: unknown[]) => {
      console.log(`[${entrypoint}]: ${message}`, ...rest)
      try {
        logger?.(entrypoint, message, ...rest)
      } catch (error) {
        console.log(`[${entrypoint}]: error logging`, error)
      }
    }
  }
}
