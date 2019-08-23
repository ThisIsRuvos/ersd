import { IHumanName } from './human-name';

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

export function formatHumanName(name: IHumanName) {
  if (name.family && name.given && name.given.length > 0) {
    return name.given.join(' ') + ' ' + name.family;
  } else if (name.family) {
    return name.family;
  } else if (name.given && name.given.length > 0) {
    return name.given.join(' ');
  }
}
