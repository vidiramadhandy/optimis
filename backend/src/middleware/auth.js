// backend/src/middleware/auth.js - KODE LENGKAP DIPERBAIKI
const jwt = require('jsonwebtoken');
const config = require('../config');

// PERBAIKAN: Helper function untuk cookie options yang konsisten
function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const options = {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  };
  
  // PERBAIKAN: Set domain untuk production
  if (isProduction) {
    options.domain = '.my.id';
  }
  
  return options;
}

// PERBAIKAN: Enhanced logging function
const logAuthAttempt = (req, success, message, userId = null) => {
  const logData = {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    origin: req.get('origin'),
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection.remoteAddress,
    success,
    message,
    userId,
    cookies: Object.keys(req.cookies || {}),
    headers: {
      'x-access-token': !!req.headers['x-access-token'],
      'authorization': !!req.headers['authorization']
    }
  };
  
  if (success) {
    console.log('✅ Auth Middleware Success:', JSON.stringify(logData, null, 2));
  } else {
    console.log('❌ Auth Middleware Failed:', JSON.stringify(logData, null, 2));
  }
};

// PERBAIKAN: Main verifyToken middleware dengan token refresh
const verifyToken = (req, res, next) => {
  try {
    // Cek token dari berbagai sumber
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    console.log('🔍 Token verification for:', req.path);
    console.log('Request origin:', req.get('origin'));
    console.log('Token exists:', !!token);
    console.log('Cookies received:', Object.keys(req.cookies || {}));
    
    if (!token) {
      console.log('❌ No token found for protected route');
      logAuthAttempt(req, false, 'Token tidak ditemukan');
      
      return res.status(401).json({ 
        success: false,
        authenticated: false, 
        message: 'Token tidak ditemukan - akses ditolak' 
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log('✅ Token verified for user:', decoded.id);
      
      // PERBAIKAN: Token refresh mechanism untuk mencegah session loss
      const tokenExp = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = tokenExp - now;
      const oneHour = 60 * 60 * 1000;
      
      // Refresh token jika mendekati expired (kurang dari 1 jam)
      if (timeUntilExpiry < oneHour) {
        const newToken = jwt.sign(
          { 
            id: decoded.id,
            email: decoded.email 
          }, 
          config.jwtSecret, 
          {
            expiresIn: config.jwtExpire || '24h'
          }
        );
        
        // Set new cookie dengan konfigurasi domain yang tepat
        const cookieOptions = getCookieOptions();
        res.cookie('token', newToken, cookieOptions);
        
        console.log('🔄 Token refreshed for user:', decoded.id);
        console.log('🍪 New cookie set with options:', cookieOptions);
        
        // Update token untuk response headers jika diperlukan
        res.setHeader('x-new-token', newToken);
      }
      
      req.userId = decoded.id;
      req.user = decoded;
      
      logAuthAttempt(req, true, 'Token verified successfully', decoded.id);
      next();
      
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.message);
      
      // PERBAIKAN: Clear invalid cookie untuk domain custom
      const cookieOptions = getCookieOptions();
      delete cookieOptions.maxAge;
      cookieOptions.expires = new Date(0);
      res.clearCookie('token', cookieOptions);
      
      console.log('🗑️ Invalid cookie cleared with options:', cookieOptions);
      logAuthAttempt(req, false, `JWT verification failed: ${jwtError.message}`);
      
      return res.status(401).json({ 
        success: false,
        authenticated: false, 
        message: 'Token tidak valid atau expired' 
      });
    }
    
  } catch (error) {
    console.error('❌ Error in token verification:', error);
    logAuthAttempt(req, false, `Internal error: ${error.message}`);
    
    res.status(500).json({ 
      success: false,
      authenticated: false, 
      message: 'Error internal server dalam verifikasi token' 
    });
  }
};

// PERBAIKAN: Optional auth middleware untuk routes yang fleksibel
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers['x-access-token'] || 
                  req.cookies.token || 
                  (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    
    console.log('ℹ️ Optional auth check for:', req.path);
    console.log('Token exists:', !!token);
    
    if (!token) {
      console.log('ℹ️ No token found for optional auth route:', req.path);
      req.userId = null;
      req.user = null;
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      console.log('✅ Optional auth verified for user:', decoded.id);
      
      // PERBAIKAN: Token refresh juga untuk optional auth
      const tokenExp = decoded.exp * 1000;
      const now = Date.now();
      const timeUntilExpiry = tokenExp - now;
      const oneHour = 60 * 60 * 1000;
      
      if (timeUntilExpiry < oneHour) {
        const newToken = jwt.sign(
          { 
            id: decoded.id,
            email: decoded.email 
          }, 
          config.jwtSecret, 
          {
            expiresIn: config.jwtExpire || '24h'
          }
        );
        
        const cookieOptions = getCookieOptions();
        res.cookie('token', newToken, cookieOptions);
        console.log('🔄 Token refreshed in optional auth for user:', decoded.id);
      }
      
      req.userId = decoded.id;
      req.user = decoded;
      next();
      
    } catch (jwtError) {
      console.log('⚠️ Invalid token in optional auth, continuing without auth');
      req.userId = null;
      req.user = null;
      next();
    }
    
  } catch (error) {
    console.error('❌ Error in optional auth:', error);
    req.userId = null;
    req.user = null;
    next();
  }
};

// PERBAIKAN: Rate limiting untuk security
const rateLimitMap = new Map();

const authRateLimit = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.get('x-forwarded-for');
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 10;
  
  console.log('🔒 Rate limit check for IP:', clientIP);
  
  if (!rateLimitMap.has(clientIP)) {
    rateLimitMap.set(clientIP, { attempts: 1, resetTime: now + windowMs });
    console.log('✅ First attempt for IP:', clientIP);
    return next();
  }
  
  const clientData = rateLimitMap.get(clientIP);
  
  if (now > clientData.resetTime) {
    // Reset window
    rateLimitMap.set(clientIP, { attempts: 1, resetTime: now + windowMs });
    console.log('🔄 Rate limit window reset for IP:', clientIP);
    return next();
  }
  
  if (clientData.attempts >= maxAttempts) {
    console.log('🚫 Rate limit exceeded for IP:', clientIP);
    logAuthAttempt(req, false, `Rate limit exceeded: ${clientData.attempts} attempts`);
    
    return res.status(429).json({
      success: false,
      message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.attempts++;
  console.log(`⚠️ Rate limit attempt ${clientData.attempts}/${maxAttempts} for IP:`, clientIP);
  next();
};

// PERBAIKAN: Middleware untuk admin-only routes
const requireAdmin = async (req, res, next) => {
  try {
    // Pastikan user sudah terverifikasi
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Cek role admin dari database (implementasi sesuai kebutuhan)
    // Untuk sementara, asumsi semua authenticated user adalah admin
    console.log('👑 Admin access granted for user:', req.userId);
    next();
  } catch (error) {
    console.error('❌ Error in admin check:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking admin privileges'
    });
  }
};

// PERBAIKAN: Middleware untuk cleanup expired rate limit entries
const cleanupRateLimit = () => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} expired rate limit entries`);
  }
};

// Jalankan cleanup setiap 30 menit
setInterval(cleanupRateLimit, 30 * 60 * 1000);

// PERBAIKAN: Debug middleware untuk development
const debugAuth = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🐛 DEBUG AUTH INFO:');
    console.log('Path:', req.path);
    console.log('Method:', req.method);
    console.log('Origin:', req.get('origin'));
    console.log('Host:', req.get('host'));
    console.log('User-Agent:', req.get('user-agent'));
    console.log('Cookies:', req.cookies);
    console.log('Headers:', {
      'x-access-token': req.headers['x-access-token'],
      'authorization': req.headers['authorization']
    });
    console.log('========================');
  }
  next();
};

// PERBAIKAN: Middleware untuk CORS preflight handling dalam auth context
const handleAuthCors = (req, res, next) => {
  // Set headers untuk auth-specific CORS
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-access-token');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    
    const origin = req.get('origin');
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? ['https://optipredict.my.id', 'https://www.optipredict.my.id']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'];
    
    if (allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    return res.status(200).end();
  }
  next();
};

module.exports = { 
  verifyToken,
  optionalAuth,
  authRateLimit,
  requireAdmin,
  debugAuth,
  handleAuthCors,
  getCookieOptions // Export helper function
};
