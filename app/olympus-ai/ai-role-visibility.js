/* =====================================================================
   OLYMPUS AI 4.1.2 — MAINUI ROLE VISIBILITY GUARD
   ---------------------------------------------------------------------
   Reads the role classes that MainUI itself applies after authentication.
   This module does not set roles, alter permissions, or replace RLS.

   Student view: excludes controls explicitly designated admin-only and
   navigation entries MainUI hides from students.
   Admin view: excludes explicitly student-only controls.
   Unknown role: fail closed for both restricted groups until MainUI sets
   either admin-view or student-view on <body>.
   ===================================================================== */

const ADMIN_ONLY_SELECTORS = [
  '[data-role="admin-only"]',
  '.admin-only',
  '.admin-only-class-schedule',
  '#adminTab',
  '#attemptsTab',
  '#assignmentStatusTab',
  '#createAssignmentForm',
  '#adminContent',
  '#pgnLibraryCard',
  '#drawToolbox',
  '#drawCanvas',
  '#previewCanvas',
  '#studyAutoCommentBtn',
  '#lpLiveAnnoToolbar',
  '#lpStudentsContainer',
  '#lpWhiteboard',
  '#lpWhiteboardCanvas',
  '#assignStudentsRow',
  '.nav-btn[data-tab="scoreboard"]',
  '.nav-btn[data-tab="attendance"]'
].join(',');

const STUDENT_ONLY_SELECTORS = [
  '[data-role="student-only"]',
  '.student-only',
  '#myAttendanceNavBtn',
  '#studentBadgePanel',
  '#studentProgressCard',
  '#lpStudentStatusBtn',
  '#lpStudentStatusPopup',
  '#lpRoomCodeInput',
  '#lpJoinRoomBtn',
  '#lpDrawHelpWrapper'
].join(',');

export function getMainUIViewerRole() {
  if (typeof document === 'undefined' || !document.body) return 'unknown';
  if (document.body.classList.contains('admin-view')) return 'admin';
  if (document.body.classList.contains('student-view')) return 'student';
  return 'unknown';
}

export function isRoleRestrictedElement(element, role = getMainUIViewerRole()) {
  if (!element || typeof element.closest !== 'function') return false;

  const isAdminOnly = Boolean(element.closest(ADMIN_ONLY_SELECTORS));
  const isStudentOnly = Boolean(element.closest(STUDENT_ONLY_SELECTORS));

  if (role === 'admin') return isStudentOnly;
  if (role === 'student') return isAdminOnly;

  // No verified MainUI role yet: do not expose role-restricted interface items.
  return isAdminOnly || isStudentOnly;
}

export function canCurrentViewerSeeElement(element) {
  return !isRoleRestrictedElement(element);
}
