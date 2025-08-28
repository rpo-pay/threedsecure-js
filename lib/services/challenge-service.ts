import { v4 } from 'uuid'
import type { Authentication, IFrameEvents, Logger } from '../types'
import assert from './assert'
import { Base64Encoder } from './base64-encoder'

export enum ChallengeWindowSize {
  H400xW250 = '01',
  H400xW390 = '02',
  H600xW500 = '03',
  H400xW600 = '04',
  Fullscreen = '05',
}

export class ChallengeService {
  private iFrame!: HTMLIFrameElement
  private form!: HTMLFormElement

  constructor(
    private readonly logger: Logger,
    private readonly base64Encoder: Base64Encoder,
    private readonly iframeEvents?: IFrameEvents,
  ) {}

  private getChallengeWindowSize(container: HTMLElement) {
    return (
      (container.clientWidth <= 250 && ChallengeWindowSize.H400xW250) ||
      (container.clientWidth <= 390 && ChallengeWindowSize.H400xW390) ||
      (container.clientWidth <= 500 && ChallengeWindowSize.H600xW500) ||
      (container.clientWidth <= 600 && ChallengeWindowSize.H400xW600) ||
      ChallengeWindowSize.Fullscreen
    )
  }

  async executeChallenge(authentication: Authentication, container: HTMLElement) {
    try {
      assert(authentication.acsUrl, 'acsUrl is required')

      if (this.form?.hasAttribute('data-submitted')) {
        this.logger('ChallengeService.executeChallenge', 'form already submitted')
        return
      }

      container.style.position = 'relative'

      this.iFrame = document.createElement('iframe')
      this.iFrame.name = v4()
      this.iFrame.style.width = '100%'
      this.iFrame.style.height = '100%'
      this.iFrame.style.position = 'absolute'
      this.iFrame.style.top = '0'
      this.iFrame.style.left = '0'
      this.iframeEvents?.onCreate?.(this.iFrame)

      this.form = document.createElement('form')
      this.form.style.visibility = 'hidden'
      this.form.name = v4()
      this.form.target = this.iFrame.name
      this.form.action = authentication.acsUrl
      this.form.method = 'POST'

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'creq'

      const data = {
        threeDSServerTransID: authentication.transactionId,
        acsTransID: authentication.acsTransId,
        messageVersion: authentication.acsProtocolVersion,
        messageType: 'CReq',
        challengeWindowSize: this.getChallengeWindowSize(container),
      }

      input.value = this.base64Encoder.encode(data)

      this.form.appendChild(input)
      container.appendChild(this.form)
      container.appendChild(this.iFrame)
      this.iframeEvents?.onAppend?.(this.iFrame)

      const submitForm = new Promise<void>((resolve, reject) => {
        this.iFrame.onload = () => {
          this.logger('ChallengeService.executeChallenge', 'iframe loaded', this.iFrame)
          this.iframeEvents?.onLoad?.(this.iFrame)
          resolve()
        }

        this.iFrame.onerror = () => {
          this.logger('ChallengeService.executeChallenge', 'iframe error', this.iFrame)
          this.iframeEvents?.onError?.(this.iFrame)
          reject(new Error('Failed to execute challenge'))
        }

        this.form.submit()
        // Execute challenge only once, be resilient to PENDING_CHALLENGE event
        // being sent more than once, just do a no-op afterwards
        this.form.setAttribute('data-submitted', 'true')
      })

      await submitForm
    } catch (error) {
      this.logger('ChallengeService.executeChallenge', 'error', error)
      throw error
    }
  }

  clean() {
    this.logger('ChallengeService.clean', 'cleaning')
    try {
      this.iFrame?.remove()
      this.iframeEvents?.onRemove?.(this.iFrame)
      this.form?.remove()
    } catch (error) {
      this.logger('ChallengeService.clean', 'cleaning - error', error)
    }
  }
}
