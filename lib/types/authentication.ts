import type { Nullable } from './nullable'

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

export enum ThreeDSChallengeOptions {
  NoPreference = '01',
  NoChallengeRequested = '02',
  ChallengeRequestedPreference = '03',
  ChallengeRequestedMandated = '04',
  ChallengeNotRequestedAntifraudApproved = '05',
  ChallengeNotRequestedDataShareOnly = '06',
  ChallengeNotRequestedAuthenticationAlreadyCompleted = '07',
  ChallengeNotRequestedWhitelistExemptionIfNotRequired = '08',
  ChallengeRequestedWhitelistPromptRequested = '09',
}

export type Address = {
  street: string
  number: Nullable<string>
  complement: Nullable<string>
  neighborhood: string
  city: string
  state: string
  country: string
  postalCode: string
}

export type Browser = {
  ip: string
  javaEnabled: boolean
  javascriptEnabled: boolean
  language: string
  userAgent: string
  screenWidth: number
  screenHeight: number
  timeZoneOffset: number
  colorDepth: number
  acceptHeader: string
}

export type Payer = {
  email: string
  mobile: string
}

export type Card = {
  brand: string
  acquirerBin: string
  number: string
  expirationYear: number
  expirationMonth: number
  holderName: string
}

export type AuthenticationError = {
  code: string
  message: string
  data: unknown
}

export type Authentication = {
  id: string
  accountId: string
  transactionId: string
  amount: number
  installments: number
  currency: string
  state: AuthenticationState
  transStatus: string
  transStatusReason: string
  dsProtocolVersion: Nullable<string>
  acsProtocolVersion: Nullable<string>
  dsTransId: Nullable<string>
  dsMethodUrl: Nullable<string>
  dsMethodCallbackUrl: Nullable<string>
  authenticationValue: Nullable<string>
  eci: string
  acsTransId: Nullable<string>
  acsUrl: Nullable<string>
  protocolVersion: Nullable<string>
  payer: Nullable<Payer>
  billingAddress: Nullable<Address>
  shippingAddress: Nullable<Address>
  browser: Nullable<Browser>
  card: Nullable<Card>
  error: Nullable<AuthenticationError>
  failReason: Nullable<string>
  challengeOptions: ThreeDSChallengeOptions
}
