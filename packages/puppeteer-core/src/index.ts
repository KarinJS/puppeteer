/**
 * @license
 * Copyright 2017 Google Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as puppeteer from 'puppeteer-core'

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
  /**
   * @public
   */
  launch,
} = puppeteer

export default puppeteer
export * from 'puppeteer-core'
