
export function formatPhone(value: string) {
  if (!value) {
    return;
  }

  const stripped = value.replace(/[^0-9]/g, '');

  if (stripped.length === 10) {
    return '(' + stripped.substring(0, 3) + ') ' + stripped.substring(3, 6) + '-' + stripped.substring(6, 10);
  }

  return stripped;
}
