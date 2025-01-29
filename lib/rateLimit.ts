// lib/rateLimit.ts

import LRU from 'lru-cache'
import type { NextApiRequest, NextApiResponse, NextApiHandler } from 'next'

type Options = {
  uniqueTokenPerInterval?: number
  interval?: number
}

export function rateLimit(options?: Options) {
  const tokenCache = new LRU({
    max: options?.uniqueTokenPerInterval || 500,
    ttl: options?.interval || 60000, // 1 menit
  })

  return (limit: number) => {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      try {
        const token = req.headers['x-forwarded-for'] || req.socket.remoteAddress
        if (!token) throw new Error('No token provided')

        const current = tokenCache.get(token as string) || 0

        if (current >= limit) {
          res.status(429).json({ message: 'Too many requests' })
          return
        }

        tokenCache.set(token as string, current + 1)
        next()
      } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' })
      }
    }
  }
}
