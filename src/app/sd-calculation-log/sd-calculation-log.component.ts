// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { Component, ElementRef, ViewChild } from '@angular/core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFileDownload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

import { SdCalculationLogService } from './sd-calculation-log.service';

@Component({
  selector: 'sd-calculation-log',
  templateUrl: './sd-calculation-log.component.html',
  styleUrls: ['./sd-calculation-log.component.css']
})
export class SdCalculationLogComponent {
  constructor(public log: SdCalculationLogService) {
    library.add(faFileDownload);
    library.add(faTrashAlt);
  }

  @ViewChild('sdcalcmostrecent') mostRecent: ElementRef;

  scrollIntoView(): void {
    this.mostRecent.nativeElement.scrollIntoView();
  }

  empty(): boolean {
    return this.log.empty();
  }

  append(columns: Array<string>, cells: Array<string>): void {
    return this.log.append(columns, cells);
  }
}
