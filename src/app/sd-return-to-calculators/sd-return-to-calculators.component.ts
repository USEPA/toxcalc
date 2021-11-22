// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { Component } from '@angular/core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faCalculator } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'sd-return-to-calculators',
  templateUrl: './sd-return-to-calculators.component.html',
  styleUrls: ['./sd-return-to-calculators.component.css']
})
export class SdReturnToCalculatorsComponent {
  constructor() {
    library.add(faCalculator);
  }
}
