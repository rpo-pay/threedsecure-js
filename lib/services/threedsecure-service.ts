import {
  type Authentication,
  AuthenticationState,
  type ThreeDSecureParameters,
  type ThreeDSecureResult,
} from '../types'
import type { ApiService } from './api-service'
import type { DsMethodService } from './dsmethod-service'
import type { ChallengeService } from './challenge-service'

export type ThreeDSecureOptions = {
  baseUrl?: string
  publicKey: string
  container: HTMLElement
}

export class ThreeDSecureService {
  constructor(
    private readonly container: HTMLElement,
    private readonly apiService: ApiService,
    private readonly dsMethodService: DsMethodService,
    private readonly challengeService: ChallengeService,
  ) {}

  async execute(
    parameters: ThreeDSecureParameters,
    abortController: AbortController = new AbortController(),
  ): Promise<ThreeDSecureResult> {
    console.log('useThreeDSecure: execute')
    try {
      console.log('useThreeDSecure: setBrowserData', parameters)
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
        console.log('useThreeDSecure: flowStep', authentication)
        const action = actionMapping.get(authentication.state)
        await action?.(authentication, abortController)
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
      console.log('useThreeDSecure: error', error)
      abortController.abort()
      throw error
    } finally {
      console.log('useThreeDSecure: finally')
    }
  }

  private handleResult(_: Authentication, abortController: AbortController) {
    abortController.abort()
    return Promise.resolve()
  }

  private handleDsMethod(authentication: Authentication, _: AbortController) {
    return this.dsMethodService.executeDsMethod(authentication, this.container)
  }

  private handleChallenge(authentication: Authentication, _: AbortController) {
    return this.challengeService.executeChallenge(authentication, this.container)
  }
}
