const prisma = require('../db');

// A user's primary family membership (the app currently assumes one family per user,
// same convention used by the family avatars in the sidebar and the dashboard family picker).
async function getPrimaryFamily(userId) {
  const membership = await prisma.familyMember.findFirst({ where: { userId } });
  if (!membership) return null;
  return { familyId: membership.familyId, role: membership.role };
}

function isAdmin(membership) {
  return membership?.role === 'ADMIN';
}

// Can this user modify a record created by `recordUserId` within their family?
// Admins can modify anyone's; everyone else can only modify their own.
function canModify(membership, recordUserId, userId) {
  return isAdmin(membership) || recordUserId === userId;
}

module.exports = { getPrimaryFamily, isAdmin, canModify };
