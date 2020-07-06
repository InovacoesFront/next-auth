import jwt from 'jsonwebtoken'
import CryptoJS from 'crypto-js'

const encode = async ({ secret, key = secret, token = {}, maxAge }) => {
  // If maxAge is set remove any existing created/expiry dates and replace them
  if (maxAge) {
    if (token.iat) { delete token.iat }
    if (token.exp) { delete token.exp }
  }
  const signedToken = jwt.sign(token, secret, { expiresIn: maxAge })
  const encryptedToken = CryptoJS.AES.encrypt(signedToken, key).toString()
  return encryptedToken
}

const decode = async ({ secret, key = secret, token, maxAge }) => {
  if (!token) return null
  const decryptedBytes = CryptoJS.AES.decrypt(token, key)
  const decryptedToken = decryptedBytes.toString(CryptoJS.enc.Utf8)
  const verifiedToken = jwt.verify(decryptedToken, secret, { maxAge })
  return verifiedToken
}

// This is a simple helper method to make it easier to use JWT from an API route
const getJwt = async ({ req, secret, cookieName, maxAge }) => {
  if (!req || !secret) throw new Error('Must pass { req, secret } to getJWT()')

  const secureCookieName = '__Secure-next-auth.session-token'
  const insecureCookieName = 'next-auth.session-token'
  let token = cookieName ? req.cookies[cookieName] : req.cookies[secureCookieName] || req.cookies[insecureCookieName]

  if (!token) {
    // Check authorization header if no cookie is present
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      const urlEncodedToken = req.headers.authorization.split(' ')[1]
      token = decodeURIComponent(urlEncodedToken)
    }
  }

  if (!token) { return null }

  try {
    return await decode({ secret, token, maxAge })
  } catch (error) {
    return null
  }
}

export default {
  encode,
  decode,
  getJwt
}
