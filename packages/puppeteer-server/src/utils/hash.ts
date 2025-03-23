import crypto from 'node:crypto'

/**
 * 生成鉴权密钥
 * @param token 明文密钥
 * @returns Bearer sha256
 */
export const sha256 = (token: string) => {
  return `Bearer ${crypto.createHash('sha256').update(token).digest('hex')}`
}
