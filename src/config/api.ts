/**
 * Central API base — LAN IP (no localhost).
 * Keep this aligned with the backend folder hosted by PHP/Apache.
 */
export const API_BASE_URL = 'http://192.168.1.19/smart-ledger-backend-main/api';

export const apiUrl = (path: string) =>
  `${API_BASE_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
