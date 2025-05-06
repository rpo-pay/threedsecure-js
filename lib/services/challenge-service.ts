import type { Authentication } from '../types'
import { Base64Encoder } from './base64-encoder'
import { v4 } from 'uuid'

export enum ChallengeWindowSize {
  H400xW250 = '01',
  H400xW390 = '02',
  H600xW500 = '03',
  H400xW600 = '04',
  Fullscreen = '05',
}

export class ChallengeService {
  constructor(private readonly base64Encoder = new Base64Encoder()) {}

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
      container.style.position = 'relative'

      const iFrame = document.createElement('iframe')
      iFrame.name = v4()
      iFrame.style.width = '100%'
      iFrame.style.height = '100%'
      iFrame.style.position = 'absolute'
      iFrame.style.top = '0'
      iFrame.style.left = '0'

      const form = document.createElement('form')
      form.style.visibility = 'hidden'
      form.name = v4()
      form.target = iFrame.name
      form.action = authentication.acsUrl
      form.method = 'POST'

      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = 'creq'
      form.appendChild(input)

      const data = {
        threeDSServerTransID: authentication.transactionId,
        acsTransID: authentication.acsTransId,
        messageVersion: authentication.acsProtocolVersion,
        messageType: 'CReq',
        challengeWindowSize: this.getChallengeWindowSize(container),
      }

      input.value = this.base64Encoder.encode(data)

      container.appendChild(form)
      container.appendChild(iFrame)

      const submitForm = new Promise<void>((resolve, reject) => {
        iFrame.onload = () => {
          resolve()
        }

        iFrame.onerror = () => {
          reject(new Error('Failed to execute challenge'))
        }

        form.submit()
      })

      await submitForm
    } catch (error) {
      console.log('ChallengeService: error', error)
      throw error
    }
  }
}
