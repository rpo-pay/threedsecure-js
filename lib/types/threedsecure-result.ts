import type { Nullable } from './nullable'

export type ThreeDSecureResult = {
  id: string
  transStatus: string
  transStatusReason: Nullable<string>
  authenticationValue: Nullable<string>
  eci: Nullable<string>
  dsTransId: Nullable<string>
  protocolVersion: Nullable<string>
  failReason: Nullable<string>

  isSuccess(): boolean
}
