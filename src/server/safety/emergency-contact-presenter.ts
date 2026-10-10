export function emergencyContactSavedMessage(notifyOnAlert: boolean): string {
  return notifyOnAlert
    ? 'Emergency contact saved and consent to emergency alerts confirmed.'
    : 'Emergency contact saved; automatic alerts are off.';
}

export function emergencyContactUpdatedMessage(notifyOnAlert: boolean): string {
  return notifyOnAlert
    ? 'Emergency alerts enabled for this contact.'
    : 'Emergency contact updated.';
}
