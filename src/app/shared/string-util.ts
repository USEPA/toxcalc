export function removeSoftHyphen(input: string): string {
  return input.replace(/­/g, '');
}
