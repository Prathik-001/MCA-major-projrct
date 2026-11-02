const API_BASE = 'http://localhost:5000/api';

class ApiClient {
  static getToken() {
    return localStorage.getItem('uba_auth_token') || '';
  }

  static setToken(token) {
    if (token) localStorage.setItem('uba_auth_token', token);
    else localStorage.removeItem('uba_auth_token');
  }

  static async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  }

  // Auth
  static login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  static register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static getMe() {
    return this.request('/auth/me');
  }

  static logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // Dashboard Overview & Reports
  static getDashboardSummary() {
    return this.request('/reports/summary');
  }

  static getAnalyticsReport() {
    return this.request('/reports/analytics');
  }

  // Users
  static getUsers() {
    return this.request('/users');
  }

  static createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  static getUserProfile(userId) {
    return this.request(`/users/${userId}`);
  }

  static suspendUser(userId, reason) {
    return this.request(`/users/${userId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  static reinstateUser(userId) {
    return this.request(`/users/${userId}/reinstate`, { method: 'POST' });
  }

  static revokeUserSessions(userId) {
    return this.request(`/users/${userId}/revoke-sessions`, { method: 'POST' });
  }

  // Activity
  static getActivity(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/activity?${qs}`);
  }

  static recordActivity(eventData) {
    return this.request('/activity/record', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  // Alerts
  static getAlerts(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/alerts?${qs}`);
  }

  static getAlert(alertId) {
    return this.request(`/alerts/${alertId}`);
  }

  static updateAlertStatus(alertId, statusData) {
    return this.request(`/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(statusData)
    });
  }

  // Incidents
  static getIncidents(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/incidents?${qs}`);
  }

  static getIncident(incidentId) {
    return this.request(`/incidents/${incidentId}`);
  }

  static addIncidentNote(incidentId, noteText) {
    return this.request(`/incidents/${incidentId}/notes`, {
      method: 'POST',
      body: JSON.stringify({ noteText })
    });
  }

  static updateIncidentStatus(incidentId, updates) {
    return this.request(`/incidents/${incidentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Baselines
  static getBaselines() {
    return this.request('/baselines');
  }

  static getUserBaseline(userId) {
    return this.request(`/baselines/${userId}`);
  }

  static recalculateBaseline(userId) {
    return this.request(`/baselines/${userId}/recalculate`, { method: 'POST' });
  }

  static lockBaseline(userId, isLocked) {
    return this.request(`/baselines/${userId}/lock`, {
      method: 'PATCH',
      body: JSON.stringify({ isLocked })
    });
  }

  // Rules
  static getRules() {
    return this.request('/rules');
  }

  static updateRule(ruleId, updates) {
    return this.request(`/rules/${ruleId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  // Audit
  static getAuditRecords(params = {}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/audit?${qs}`);
  }

  static verifyAuditChain() {
    return this.request('/audit/verify');
  }

  static simulateTamper(sequenceNumber, forgedAction) {
    return this.request('/audit/simulate-tamper', {
      method: 'POST',
      body: JSON.stringify({ sequenceNumber, forgedAction })
    });
  }

  // Research
  static getLiterature() {
    return this.request('/research/literature');
  }

  static runEvaluation(options = {}) {
    return this.request('/research/evaluate', {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }

  static getEvaluationRuns() {
    return this.request('/research/runs');
  }

  // Simulation
  static triggerScenario(scenarioKey, targetUserId) {
    return this.request('/simulation/trigger', {
      method: 'POST',
      body: JSON.stringify({ scenarioKey, targetUserId })
    });
  }

  static importCertData(targetUserId) {
    return this.request('/simulation/cert-import', {
      method: 'POST',
      body: JSON.stringify({ targetUserId })
    });
  }

  // =========================================================================
  // VIRTUAL COMPUTERS & DESKTOP ENVIRONMENT
  // =========================================================================
  static getVirtualComputers() {
    return this.request('/virtual-computers');
  }

  static getMyVirtualComputer() {
    return this.request('/virtual-computers/my');
  }

  static updateMyPreferences(prefs) {
    return this.request('/virtual-computers/my/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs)
    });
  }

  static sendHeartbeat(currentApp) {
    return this.request('/virtual-computers/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ current_app: currentApp })
    });
  }

  static lockVirtualComputer(id, reason) {
    return this.request(`/virtual-computers/${id}/lock`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  static unlockVirtualComputer(id, reason) {
    return this.request(`/virtual-computers/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  static adminUnlockLockScreen(adminEmail, adminPassword, employeeId, reason) {
    return this.request('/virtual-computers/admin-unlock', {
      method: 'POST',
      body: JSON.stringify({
        admin_email: adminEmail,
        admin_password: adminPassword,
        employee_id: employeeId,
        reason
      })
    });
  }

  static simulateSuspiciousActivity(scenario = 'UNAUTHORIZED_ACCESS_PROBE', details = '') {
    return this.request('/virtual-computers/simulate-suspicious', {
      method: 'POST',
      body: JSON.stringify({ scenario, details })
    });
  }

  static terminateSession(id, reason) {
    return this.request(`/virtual-computers/${id}/terminate-session`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  static suspendEmployee(id, reason) {
    return this.request(`/virtual-computers/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  static restoreEmployee(id, reason) {
    return this.request(`/virtual-computers/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  }

  static toggleApplicationAccess(id, appKey, isAllowed, reason) {
    return this.request(`/virtual-computers/${id}/app-toggle`, {
      method: 'POST',
      body: JSON.stringify({ app_key: appKey, is_allowed: isAllowed, reason })
    });
  }

  static executeBulkVirtualComputerAction(action, reason) {
    return this.request('/virtual-computers/bulk-action', {
      method: 'POST',
      body: JSON.stringify({ action, reason })
    });
  }

  // =========================================================================
  // COMPANY MAIL
  // =========================================================================
  static getMailContacts() {
    return this.request('/mail/contacts');
  }

  static getInbox() {
    return this.request('/mail/inbox');
  }

  static getSentMail() {
    return this.request('/mail/sent');
  }

  static getDrafts() {
    return this.request('/mail/drafts');
  }

  static getStarredMail() {
    return this.request('/mail/starred');
  }

  static getTrashMail() {
    return this.request('/mail/trash');
  }

  static sendMail(emailData) {
    return this.request('/mail/send', {
      method: 'POST',
      body: JSON.stringify(emailData)
    });
  }

  static saveDraft(draftData) {
    return this.request('/mail/draft', {
      method: 'POST',
      body: JSON.stringify(draftData)
    });
  }

  static toggleMailRead(id, isRead) {
    return this.request(`/mail/${id}/read`, {
      method: 'PUT',
      body: JSON.stringify({ is_read: isRead })
    });
  }

  static toggleMailStar(id) {
    return this.request(`/mail/${id}/star`, { method: 'PUT' });
  }

  static deleteMail(id) {
    return this.request(`/mail/${id}`, { method: 'DELETE' });
  }

  static restoreMail(id) {
    return this.request(`/mail/${id}/restore`, { method: 'POST' });
  }

  // =========================================================================
  // FINDER & COMPANY FILES
  // =========================================================================
  static getFiles(folderId, view) {
    const params = new URLSearchParams();
    if (folderId) params.append('folder_id', folderId);
    if (view) params.append('view', view);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/files${qs}`);
  }

  static getTrashFiles() {
    return this.request('/files/trash');
  }

  static createFolder(name, parentId) {
    return this.request('/files/folder', {
      method: 'POST',
      body: JSON.stringify({ name, parent_id: parentId })
    });
  }

  static uploadFile(fileData) {
    return this.request('/files/upload', {
      method: 'POST',
      body: JSON.stringify(fileData)
    });
  }

  static downloadFile(fileId) {
    return this.request(`/files/${fileId}/download`);
  }

  static renameFile(fileId, name) {
    return this.request(`/files/${fileId}/rename`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  static deleteFile(fileId) {
    return this.request(`/files/${fileId}`, { method: 'DELETE' });
  }

  static restoreFile(fileId) {
    return this.request(`/files/${fileId}/restore`, { method: 'POST' });
  }

  static emptyTrash() {
    return this.request('/files/trash/empty', { method: 'POST' });
  }

  // =========================================================================
  // TASK MANAGER
  // =========================================================================
  static getTasks() {
    return this.request('/tasks');
  }

  static createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  static updateTaskStatus(taskId, status, completionNotes) {
    return this.request(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, completion_notes: completionNotes })
    });
  }

  static addTaskComment(taskId, comment) {
    return this.request(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment })
    });
  }

  static deleteTask(taskId) {
    return this.request(`/tasks/${taskId}`, { method: 'DELETE' });
  }

  // =========================================================================
  // DOCUMENT EDITOR
  // =========================================================================
  static getDocuments() {
    return this.request('/documents');
  }

  static getDocument(id) {
    return this.request(`/documents/${id}`);
  }

  static createDocument(docData) {
    return this.request('/documents', {
      method: 'POST',
      body: JSON.stringify(docData)
    });
  }

  static saveDocument(id, docData) {
    return this.request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(docData)
    });
  }

  static revertDocumentVersion(id, versionNum) {
    return this.request(`/documents/${id}/revert`, {
      method: 'POST',
      body: JSON.stringify({ version_num: versionNum })
    });
  }

  static deleteDocument(id) {
    return this.request(`/documents/${id}`, { method: 'DELETE' });
  }

  // =========================================================================
  // TEAM CHAT
  // =========================================================================
  static getChatConversations() {
    return this.request('/chat/conversations');
  }

  static getChatMessages(conversationId) {
    return this.request(`/chat/conversations/${conversationId}/messages`);
  }

  static sendChatMessage(conversationId, message, attachments = []) {
    return this.request('/chat/send', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, message, attachments })
    });
  }

  static startDirectChat(employeeId) {
    return this.request('/chat/direct', {
      method: 'POST',
      body: JSON.stringify({ employee_id: employeeId })
    });
  }

  // =========================================================================
  // CALENDAR
  // =========================================================================
  static getCalendarEvents() {
    return this.request('/calendar/events');
  }

  static createCalendarEvent(eventData) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  }

  static deleteCalendarEvent(id) {
    return this.request(`/calendar/events/${id}`, { method: 'DELETE' });
  }

  // =========================================================================
  // SHARED DRIVE
  // =========================================================================
  static getSharedResources() {
    return this.request('/shared-drive/resources');
  }

  static probeSharedVault(resourceId) {
    return this.request('/shared-drive/probe-vault', {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId })
    });
  }

  static requestSharedAccess(resourceId, reason) {
    return this.request('/shared-drive/request-access', {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId, reason })
    });
  }
}

export default ApiClient;
