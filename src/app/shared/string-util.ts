// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

export function removeSoftHyphen(input: string): string {
  return input.replace(/­/g, '');
}
