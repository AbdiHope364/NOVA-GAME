import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.js';
import { logger } from '@nova/logger';

export function geoBlockMiddleware(req: Request, res: Response, next: NextFunction) {
  // If no country restrictions configured, allow all traffic
  if (!config.geoAllowedCountries || config.geoAllowedCountries.length === 0) {
    return next();
  }

  // Allow loopback / internal private IPs
  const clientIp = req.ip || req.socket.remoteAddress || '';
  if (
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp.startsWith('10.') ||
    clientIp.startsWith('192.168.') ||
    clientIp.startsWith('172.16.')
  ) {
    return next();
  }

  // Extract country code from proxy headers
  const countryHeader =
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-country-code'] as string) ||
    (req.headers['x-geo-country'] as string);

  if (!countryHeader) {
    // In development or when header is not supplied by proxy, allow by default
    if (!config.isProduction) {
      return next();
    }
    // In production without geo header, allow or pass through with weak signal caveat
    return next();
  }

  const country = countryHeader.trim().toUpperCase();

  if (!config.geoAllowedCountries.includes(country)) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    logger.warn(
      `[GeoBlock] Access blocked for country code "${country}" from IP ${clientIp} [Request: ${requestId}] on ${req.method} ${req.originalUrl}`
    );
    return res.status(403).json({
      success: false,
      error: `Access restricted: NOVA Gaming is not permitted in your region (${country}).`,
      country,
    });
  }

  return next();
}

