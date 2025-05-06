import type { Authentication } from '../types'
import type { Base64Encoder } from './base64-encoder'
import { v4 } from 'uuid'

export class DsMethodService {
  constructor(private readonly base64Encoder: Base64Encoder) {}

  async executeDsMethod(authentication: Authentication, container: HTMLElement) {
    try {
      const iFrame = document.createElement('iframe')
      iFrame.name = v4()
      iFrame.style.visibility = 'hidden'
      iFrame.style.position = 'absolute'
      iFrame.style.top = '0'
      iFrame.style.left = '0'
      iFrame.width = '0'
      iFrame.height = '0'

      const form = document.createElement('form')
      form.style.visibility = 'hidden'
      form.name = v4()
      form.target = iFrame.name
      form.action = authentication.dsMethodUrl
      form.method = 'POST'

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'threeDSMethodData'

      input.value = this.base64Encoder.encode({
        threeDSServerTransID: authentication.transactionId,
        threeDSMethodNotificationURL: authentication.dsMethodCallbackUrl,
      })

      form.appendChild(input)

      container.appendChild(form)
      container.appendChild(iFrame)

      const submitForm = new Promise<void>((resolve, reject) => {
        form.onload = () => {
          resolve()
        }

        form.onerror = () => {
          reject(new Error('Failed to execute dsMethod'))
        }

        form.submit()
      })

      await submitForm
    } catch (error) {
      console.log('DSMethodService: error', error)
      throw error
    }
  }
}
