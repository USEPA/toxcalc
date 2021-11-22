// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { Component, Input } from '@angular/core';

@Component({
  selector: 'sd-internal-calc-error',
  templateUrl: './sd-internal-calc-error.component.html',
  styleUrls: ['./sd-internal-calc-error.component.css']
})
export class SdInternalCalcErrorComponent {
  @Input() errorText: string;
}
