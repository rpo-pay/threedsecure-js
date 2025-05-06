export enum AuthenticationState {
  Created = 'CREATED',
  PendingDirectoryServer = 'PENDING_DIRECTORY_SERVER',
  PendingAuthorization = 'PENDING_AUTHORIZATION',
  PendingChallenge = 'PENDING_CHALLENGE',
  ChallengeCompleted = 'CHALLENGE_COMPLETED',
  Completed = 'AUTHORIZED',
  AuthorizedToAttempt = 'AUTHORIZED_TO_ATTEMPT',
  Failed = 'FAILED',
}

export type Authentication = {
  id: string
  state: AuthenticationState
  dsMethodUrl: string
  transactionId: string
  dsMethodCallbackUrl: string
  acsUrl: string
  acsTransId: string
  acsProtocolVersion: string
  transStatus: string
  transStatusReason: string
  authenticationValue: string
  eci: string
  dsTransId: string
}
