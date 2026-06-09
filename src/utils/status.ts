/** Whether a backend status string represents an enabled/active row. */
export function isActiveStatus(status?: string): boolean {
  return (status || 'active') === 'active';
}

/** Map switch boolean to API status string. */
export function statusFromEnabled(enabled: boolean): 'active' | 'inactive' {
  return enabled ? 'active' : 'inactive';
}
