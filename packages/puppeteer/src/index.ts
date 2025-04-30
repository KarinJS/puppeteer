/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */
import * as PuppeteerCore from 'puppeteer-core/internal/puppeteer-core.js'

export const {
  /**
   * @public
   */
  connect,
  /**
   * @public
   */
  defaultArgs,
  /**
   * @public
   */
  executablePath,
} = PuppeteerCore

export * from './types'
export * from './puppeteer'
export { launch } from './puppeteer'
export { launch as default } from './puppeteer'
export * from 'puppeteer-core/internal/puppeteer-core.js'
export { PUPPETEER_REVISIONS } from 'puppeteer-core/internal/revisions.js'
export { browserOptions } from './puppeteer/browser/options'

export type { Protocol } from 'puppeteer-core'
export type { LaunchOptions, ScreenshotOptions } from './types'
