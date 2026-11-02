const ActivityService = require('../services/activityService');

/**
 * Express middleware that intercepts and monitors API operations
 */
function activityLoggerInterceptor(options = {}) {
  const { eventType = 'PAGE_ACCESS', action = 'READ' } = options;

  return async (req, res, next) => {
    // Only monitor authenticated requests or explicit auth routes
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;

      // Extract details asynchronously after response is sent
      const statusCode = res.statusCode;
      const isSuccess = statusCode >= 200 && statusCode < 400;
      const effectiveEventType = statusCode === 401 || statusCode === 403 ? 'ACCESS_DENIED' : eventType;
      const effectiveStatus = isSuccess ? 'SUCCESS' : 'FAILURE';

      if (req.user) {
        ActivityService.recordEvent({
          userId: req.user.id,
          userEmail: req.user.email,
          eventType: effectiveEventType,
          resourceId: req.originalUrl || req.url,
          action: req.method || action,
          status: effectiveStatus,
          ipAddress: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
          sessionId: req.headers['x-session-id'] || 'web_session_' + req.user.id.slice(0, 8),
          metadata: {
            method: req.method,
            status_code: statusCode,
            user_agent: req.headers['user-agent']
          }
        }).catch(err => console.error('Activity interceptor error:', err.message));
      }

      return res.send(body);
    };

    next();
  };
}

module.exports = activityLoggerInterceptor;
