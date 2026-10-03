const LOCAL_IP_ADDRESSES = new Set(['127.0.0.1', '0.0.0.0', '::1', '::ffff:127.0.0.1', 'localhost']);

const isPublicIpAddress = (value) => {
  const ipAddress = String(value || '').trim();

  if (!ipAddress || LOCAL_IP_ADDRESSES.has(ipAddress.toLowerCase())) {
    return false;
  }

  if (!/^[0-9a-f:.]+$/i.test(ipAddress)) {
    return false;
  }

  const ipv4Segments = ipAddress.match(/^\d{1,3}(?:\.\d{1,3}){3}$/) ? ipAddress.split('.').map(Number) : null;
  if (ipv4Segments) {
    const [first, second] = ipv4Segments;
    if (ipv4Segments.some((segment) => segment > 255)) return false;

    return !(
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }

  return !/^(?:fc|fd|fe80:)/i.test(ipAddress);
};

const firstIpAddress = (value) =>
  String(Array.isArray(value) ? value[0] : value || '')
    .split(',')
    .map((entry) => entry.trim())
    .find(isPublicIpAddress) || null;

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).setHeader('Allow', 'GET').json({ error: 'Method not allowed.' });
  }

  // Hosting providers populate these from the connection before forwarding the request.
  // Do not use req.socket.remoteAddress: that is normally the server or reverse-proxy address.
  const ipAddress =
    firstIpAddress(req.headers['x-vercel-forwarded-for']) ||
    firstIpAddress(req.headers['cf-connecting-ip']) ||
    firstIpAddress(req.headers['true-client-ip']) ||
    firstIpAddress(req.headers['x-forwarded-for']);

  return res
    .status(200)
    .setHeader('Cache-Control', 'no-store, max-age=0')
    .json({ ip: ipAddress });
}
