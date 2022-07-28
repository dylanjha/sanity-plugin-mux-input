import type {SanityClient} from '@sanity/client'
import {useCallback} from 'react'

import {createSigningKeys, haveValidSigningKeys, saveSecrets} from '../actions/secrets'
import type {Secrets} from '../util/types'

export const useSaveSecrets = (client: SanityClient, secrets: Secrets) => {
  return useCallback(
    async ({
      token,
      secretKey,
      enableSignedUrls,
    }: Pick<Secrets, 'token' | 'secretKey' | 'enableSignedUrls'>): Promise<Secrets> => {
      let {signingKeyId, signingKeyPrivate} = secrets

      try {
        await saveSecrets(
          client,
          token!,
          secretKey!,
          enableSignedUrls,
          signingKeyId!,
          signingKeyPrivate!
        )
      } catch (err) {
        console.error('Error while trying to save secrets:', err)
        throw err
      }

      if (enableSignedUrls) {
        const hasValidSigningKeys = await haveValidSigningKeys(
          client,
          signingKeyId!,
          signingKeyPrivate!
        )

        if (!hasValidSigningKeys) {
          try {
            const {data} = await createSigningKeys(client)
            signingKeyId = data.id
            signingKeyPrivate = data.private_key
            await saveSecrets(
              client,
              token!,
              secretKey!,
              enableSignedUrls,
              signingKeyId,
              signingKeyPrivate
            )
          } catch (err) {
            // eslint-disable-next-line no-console
            console.log('Error while creating and saving signing key:', err.message)
            throw err
          }
        }
      }
      return {token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate}
    },
    [client, secrets]
  )
}
