// Lightweight clean QR code generator helper for standard SVG/Canvas display
// Uses the standard QR Code matrix generation algorithm or fallback SVG pattern
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

// Simple direct Google Chart or SVG renderer for scannable QR codes
export function getQrCodeImageUrl(data: string, size = 260): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=10`;
}
