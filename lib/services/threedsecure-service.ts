import {
  type Authentication,
  AuthenticationState,
  type ThreeDSecureParameters,
  type ThreeDSecureResult,
} from '../types'
import { ApiService } from './api-service'
import { DsMethodService } from './dsmethod-service'
import { ChallengeService } from './challenge-service'
import { Base64Encoder } from './base64-encoder'

export type ThreeDSecureOptions = {
  baseUrl?: string
  publicKey: string
  container: HTMLElement
}

export class ThreeDSecureService {
  private readonly container: HTMLElement
  private readonly apiService: ApiService
  private readonly dsMethodService: DsMethodService
  private readonly challengeService: ChallengeService

  constructor(options: ThreeDSecureOptions) {
    console.log('ThreeDSecureService: constructor', options)
    this.container = options.container
    this.apiService = new ApiService(options.publicKey, options.baseUrl)
    this.dsMethodService = new DsMethodService(new Base64Encoder())
    this.challengeService = new ChallengeService(new Base64Encoder())
  }

  async execute(
    parameters: ThreeDSecureParameters,
    abortController: AbortController = new AbortController(),
  ): Promise<ThreeDSecureResult> {
    console.log('ThreeDSecureService: execute')
    try {
      console.log('ThreeDSecureService: setBrowserData', parameters)
      await this.apiService.setBrowserData(parameters)

      const actionMapping = new Map([
        [AuthenticationState.PendingDirectoryServer, this.handleDsMethod.bind(this)],
        [AuthenticationState.PendingChallenge, this.handleChallenge.bind(this)],
        [AuthenticationState.Failed, this.handleResult.bind(this)],
        [AuthenticationState.Completed, this.handleResult.bind(this)],
        [AuthenticationState.AuthorizedToAttempt, this.handleResult.bind(this)],
      ])

      let authentication!: Authentication
      for await (authentication of this.apiService.executeAuthentication(parameters, abortController.signal)) {
        console.log('ThreeDSecureService: flowStep', authentication)
        const action = actionMapping.get(authentication.state)
        await action?.(authentication, abortController)
        console.log('ThreeDSecureService: flowStep - end')
      }

      return {
        id: authentication.id,
        transStatus: authentication.transStatus,
        transStatusReason: authentication.transStatusReason,
        authenticationValue: authentication.authenticationValue,
        eci: authentication.eci,
        dsTransId: authentication.dsTransId,
      }
    } catch (error) {
      console.log('ThreeDSecureService: error', error)
      abortController.abort()
      throw error
    } finally {
      console.log('ThreeDSecureService: finally')
    }
  }

  private handleResult(_: Authentication, abortController: AbortController) {
    console.log('ThreeDSecureService: handleResult')
    abortController.abort()
    return Promise.resolve()
  }

  private handleDsMethod(authentication: Authentication, _: AbortController) {
    console.log('ThreeDSecureService: handleDsMethod', authentication)
    return this.dsMethodService.executeDsMethod(authentication, this.container)
  }

  private handleChallenge(authentication: Authentication, _: AbortController) {
    console.log('ThreeDSecureService: handleChallenge', authentication)
    return this.challengeService.executeChallenge(authentication, this.container)
  }
}
