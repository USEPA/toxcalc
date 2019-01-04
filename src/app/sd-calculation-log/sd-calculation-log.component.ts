import { Component } from '@angular/core';

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

  append(columns: Array<string>, cells: Array<string>): void {
    return this.log.append(columns, cells);
  }
}
