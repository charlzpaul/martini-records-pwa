/**
 * Base64 encoded PNGs for currency symbols.
 * Used in PDF generation to ensure consistent rendering across different PDF viewers
 * when fonts might not support specific Unicode characters like ₹.
 */
export const CURRENCY_ICONS: Record<string, string> = {
  USD: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRIieWVwQqCQBRFDyXu/J5o1aL0i0p/LnJhO/2AaFW/4M4gbDGvNHXMyRGCLjwGHnjv9d03CmZIpCZDKTUYs4mM/IaAA0RABhS8j6ZslDYXp6e/B1YGZo0QoZxdgA3gSt84ZB0yIVo3+tYEciHyxgroQj7LuTDzNRwhyukVCJggAweIaa9jvQpUViH6bfwoEgIp1T3QVfytSBP1EbmAjxpjKWasCjzhSy+dSsCTXt71gI2P3VLOkwWuVgYBVQZbE6KE/q1p1gGYdxGNGdENFewO9Sb3EVwv/OEv0/R6H00FHu/zV/UtsvrLAAAAAElFTkSuQmCC',
  EUR: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAA/0lEQVRIie3UO0oEQRCA4W+MfAQGHsHEMVBPYGCwYLIeRq9gZiYmgiCsnmQRwQcaa6aBkSA+EBRdgx5xELedHmcx2R86aviruqq6GNIQGdrYwwWecYczbCD/i3wBx+hFzhu2MZ4qX8ZjIbnCGmYxhkksYkt4UQ+HKfL5knynkPYjF8rVrSrPcFqSN07bV1lGmxR3xZv504mWZaTJ7FJ4ErJLHrvv9HvB+y/3tanag8rj+G89aAmZ3mBiUEEOiiCdQQXIcV8E2RWfqDmcS+jNJy08FEGusYoZ4XdPYUlYJS9qLLtydkfiU/WKTfGFGCXDCvZxKaznW5xgHdN1xUN8AM9bWZSzmAynAAAAAElFTkSuQmCC',
  GBP: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAlUlEQVRIie2TMQqEMBREn6u11e6lvIPY7qW8iVYuHsbO2ApuMxbCV4wBEfRBSMgkM0UycDcyoAI6jVp7wURACUwro9SZwxQycsAXeAMfrXtpRUhAK5Pc0HJpbUjAKJPU0FJpg3Ux2RkQa3aG5oDfTp9V5sf05hWafN+AhmWRZqySNUcCTuf5RU+Af4BPDzb7cJkeXJc/Og40uj5o+uMAAAAASUVORK5CYII=',
  JPY: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAArElEQVRIie2UMQ4CMQwER4gu4iUUfOn4WSo+EgrKayh4yIkSGiNFkWzsEARCTJlsdi07CfwqBTgByaFNoi2RgBm4AdmhzaKdIwFbYJGDk6Hbi+YK7CIBnsPeIkyyGFyATbWegLPsHXrNLSMtuIu2FS/1XWMS04UBfdfIYuy9vmFSFeB5gF08AtysjL1SGbbG7br6TVgBH2Foi4YwagbqTP4zeMo6qD++pYqv5g7d/EjuQyAOrwAAAABJRU5ErkJggg==',
  INR: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAAyElEQVRIie3TMUoDQRQG4C9LIIUE4j3sAqnsbIKpAp7A3jZVENJ6BCtPoAdIGbASIh4inWICFkJILPZVq8Ku7kgI/jDFwMz/PRiGfc0M24pr9lVR9gfD/udn2b9H7uAET/JpL1NBwwDuyl5oljzXQReT2M+rzfU5S98/5iPavwVWhdIXPGBURzkc4j7KFziqo7SYA0wDeUYvBdLCbSCvOE6BNHETyBv6KZAM14G84ywF0sBVIGucp0BgHMgGg1TIhfyvnKYCdicf4RJE8tzL0ZUAAAAASUVORK5IIpC',
  CAD: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRIieWVwQqCQBRFDyXu/J5o1aL0i0p/LnJhO/2AaFW/4M4gbDGvNHXMyRGCLjwGHnjv9d03CmZIpCZDKTUYs4mM/IaAA0RABhS8j6ZslDYXp6e/B1YGZo0QoZxdgA3gSt84ZB0yIVo3+tYEciHyxgroQj7LuTDzNRwhyukVCJggAweIaa9jvQpUViH6bfwoEgIp1T3QVfytSBP1EbmAjxpjKWasCjzhSy+dSsCTXt71gI2P3VLOkwWuVgYBVQZbE6KE/q1p1gGYdxGNGdENFewO9Sb3EVwv/OEv0/R6H00FHu/zV/UtsvrLAAAAAElFTkSuQmCC',
  AUD: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABmJLR0QA/wD/AP+gvaeTAAAA5ElEQVRIieWVwQqCQBRFDyXu/J5o1aL0i0p/LnJhO/2AaFW/4M4gbDGvNHXMyRGCLjwGHnjv9d03CmZIpCZDKTUYs4mM/IaAA0RABhS8j6ZslDYXp6e/B1YGZo0QoZxdgA3gSt84ZB0yIVo3+tYEciHyxgroQj7LuTDzNRwhyukVCJggAweIaa9jvQpUViH6bfwoEgIp1T3QVfytSBP1EbmAjxpjKWasCjzhSy+dSsCTXt71gI2P3VLOkwWuVgYBVQZbE6KE/q1p1gGYdxGNGdENFewO9Sb3EVwv/OEv0/R6H00FHu/zV/UtsvrLAAAAAElFTkSuQmCC',
};

/**
 * Mapping of common currency characters to their ISO codes.
 */
export const SYMBOL_TO_ISO: Record<string, string> = {
  '$': 'USD',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
  '₹': 'INR',
  'C$': 'CAD',
  'A$': 'AUD',
};

/**
 * Helper to get the Base64 icon for a currency symbol or ISO code.
 */
export const getCurrencyIcon = (symbolOrCode: string): string | null => {
  if (CURRENCY_ICONS[symbolOrCode]) return CURRENCY_ICONS[symbolOrCode];
  const isoCode = SYMBOL_TO_ISO[symbolOrCode];
  return isoCode ? CURRENCY_ICONS[isoCode] : null;
};
