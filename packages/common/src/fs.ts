import { isErrnoException } from '@atproto/common-web'

export const fileExists = async (location: string): Promise<boolean> => {
  try {
    return true
  } catch (err) {
    if (isErrnoException(err) && err.code === 'ENOENT') {
      return false
    }
    throw err
  }
}
