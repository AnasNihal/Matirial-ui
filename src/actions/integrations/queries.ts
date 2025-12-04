'use server'

import { client } from '@/lib/prisma'

export const updateIntegration = async (
  id: string,
  token: string,
  expire: Date,
  igId?: string,
  igUsername?: string,
  igProfilePhoto?: string
) => {
  return await client.integrations.update({
    where: { id },
    data: {
      token,
      expiresAt: expire,
      instagramId: igId,
      instagramUsername: igUsername,
      instagramProfilePicture: igProfilePhoto,
    },
  })
}

export const getIntegration = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      integrations: {
        where: {
          name: 'INSTAGRAM',
        },
      },
    },
  })
}

export const createIntegration = async (
  clerkId: string,
  token: string,
  expire: Date,
  igId?: string,
  igUsername?: string,
  igProfilePhoto?: string
) => {
  const result = await client.user.update({
    where: {
      clerkId,
    },
    data: {
      integrations: {
        create: {
          token,
          expiresAt: expire,
          instagramId: igId,
          instagramUsername: igUsername,
          instagramProfilePicture: igProfilePhoto,
        },
      },
    },
    select: {
      firstname: true,
      lastname: true,
      email: true,
    },
  })
  
  console.log('💾 [createIntegration] User data returned:', {
    firstname: result.firstname,
    lastname: result.lastname,
    email: result.email,
    hasFirstname: !!result.firstname,
    hasLastname: !!result.lastname,
  })
  
  return result
}
