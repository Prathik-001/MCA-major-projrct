function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. Role '${req.user.role}' does not possess required authorization. Requires: [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

async function canAccessUserData(req, targetUserId, db) {
  if (!req.user) return false;
  // Administrator has global oversight
  if (req.user.role === 'Administrator') return true;

  // Employee can only access their own data
  if (req.user.role === 'Employee') {
    return req.user.id === targetUserId;
  }

  // Manager can access their own or department members
  if (req.user.role === 'Manager') {
    if (req.user.id === targetUserId) return true;
    const targetProfile = await db.findOne('profiles', p => p.id === targetUserId);
    return targetProfile && targetProfile.department === req.user.department;
  }

  return false;
}

module.exports = {
  requireRole,
  canAccessUserData
};
