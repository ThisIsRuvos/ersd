
export function getErrorString(err: any): string {
  if (err.error && err.error.message) {
    return err.error.message;
  } else if (err.error && err.error.error) {
    return err.error.error;
  } else if (typeof err.error === 'string') {
    return err.error;
  } else if (err.data) {
    return err.data;
  } else if (typeof err === 'string') {
    return err;
  }

  return 'Unknown error';
}
