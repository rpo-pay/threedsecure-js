import { v4 } from 'uuid'
import type { Authentication, IFrameEvents, Logger } from '../types'
import assert from './assert'
import type { Base64Encoder } from './base64-encoder'

export class DsMethodService {
  private iFrame!: HTMLIFrameElement
  private form!: HTMLFormElement

  constructor(
    private readonly logger: Logger,
    private readonly base64Encoder: Base64Encoder,
    private readonly iframeEvents?: IFrameEvents,
  ) {}

  async executeDsMethod(authentication: Authentication, container: HTMLElement) {
    try {
      assert(authentication.dsMethodUrl, 'dsMethodUrl is required')
      assert(authentication.dsMethodCallbackUrl, 'dsMethodCallbackUrl is required')

      if (this.form?.hasAttribute('data-submitted')) {
        this.logger('DsMethodService.executeDsMethod', 'form already submitted')
        return
      }

      this.iFrame = document.createElement('iframe')
      this.iFrame.name = v4()
      this.iFrame.style.visibility = 'hidden'
      this.iFrame.style.position = 'absolute'
      this.iFrame.style.top = '0'
      this.iFrame.style.left = '0'
      this.iFrame.width = '0'
      this.iFrame.height = '0'
      this.iframeEvents?.onCreate?.(this.iFrame)

      this.form = document.createElement('form')
      this.form.style.visibility = 'hidden'
      this.form.name = v4()
      this.form.target = this.iFrame.name
      this.form.action = authentication.dsMethodUrl
      this.form.method = 'POST'

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'threeDSMethodData'

      input.value = this.base64Encoder.encode({
        threeDSServerTransID: authentication.transactionId,
        threeDSMethodNotificationURL: authentication.dsMethodCallbackUrl,
      })

      this.form.appendChild(input)
      container.appendChild(this.form)
      container.appendChild(this.iFrame)
      this.iframeEvents?.onAppend?.(this.iFrame)

      const submitForm = new Promise<void>((resolve, reject) => {
        this.iFrame.onload = () => {
          this.logger('DSMethodService.executeDsMethod', 'iframe loaded', this.iFrame)
          this.iframeEvents?.onLoad?.(this.iFrame)
          resolve()
        }

        this.iFrame.onerror = () => {
          this.logger('DSMethodService.executeDsMethod', 'iframe error', this.iFrame)
          this.iframeEvents?.onError?.(this.iFrame)
          reject(new Error('Failed to execute dsMethod'))
        }

        this.form.submit()
        // Execute challenge only once, be resilient to PENDING_CHALLENGE event
        // being sent more than once, just do a no-op afterwards
        this.form.setAttribute('data-submitted', 'true')
      })

      await submitForm
    } catch (error) {
      this.logger('DSMethodService.executeDsMethod', 'error', error)
      throw error
    }
  }

  clean() {
    this.logger('DSMethodService.clean', 'cleaning')
    try {
      this.iFrame?.remove()
      this.iframeEvents?.onRemove?.(this.iFrame)
      this.form?.remove()
    } catch (error) {
      this.logger('DSMethodService.clean', 'cleaning - error', error)
    }
  }
}
