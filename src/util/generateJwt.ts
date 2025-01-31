import type {SanityClient} from '@sanity/client'
import {suspend} from 'suspend-react'

import {readSecrets} from './readSecrets'
import type {AnimatedThumbnailOptions, ThumbnailOptions} from './types'

export type Audience = 'g' | 's' | 't' | 'v'

export type Payload<T extends Audience> = T extends 'g'
  ? AnimatedThumbnailOptions
  : T extends 's'
  ? never
  : T extends 't'
  ? ThumbnailOptions
  : T extends 'v'
  ? never
  : never

export function generateJwt<T extends Audience>(
  client: SanityClient,
  playbackId: string,
  aud: T,
  payload?: Payload<T>
): string {
  const {signingKeyId, signingKeyPrivate} = readSecrets(client)
  if (!signingKeyId) {
    throw new TypeError('Missing signingKeyId')
  }
  if (!signingKeyPrivate) {
    throw new TypeError('Missing signingKeyPrivate')
  }

  // /*
  const {default: sign}: {default: typeof import('jsonwebtoken-esm/sign')['default']} =
    suspend(() => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      // This whole skypack thing is an extreme, temporary, measure to get around Parcel bugs with code splitting, dynamic import, and CJS + ESM interop
      // Otherwise known as the unholy trinity of reasons I might consider going back to doing only design work
      // const {default: sign} = await import('jsonwebtoken-esm/sign')
      // eslint-disable-next-line @typescript-eslint/no-shadow
      return import(
        /* webpackIgnore: true */
        /* @vite-ignore */
        new URL(
          'https://cdn.skypack.dev/pin/jsonwebtoken-esm@v1.0.3-p8N0qksX2r9oYz3jfz0a/mode=imports,min/optimized/jsonwebtoken-esm/sign.js'
        ).toString()
      )
    }, ['sanity-plugin-mux-input', 'jsonwebtoken-esm/sign'])
  // */

  return sign(
    payload ? JSON.parse(JSON.stringify(payload, (_, v) => v ?? undefined)) : {},
    atob(signingKeyPrivate),
    {
      algorithm: 'RS256',
      keyid: signingKeyId,
      audience: aud,
      subject: playbackId,
      noTimestamp: true,
      expiresIn: '12h',
    }
  )
}
