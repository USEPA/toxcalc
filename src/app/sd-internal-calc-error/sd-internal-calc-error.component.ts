import { Component, Input } from '@angular/core';

@Component({
  selector: 'sd-internal-calc-error',
  templateUrl: './sd-internal-calc-error.component.html',
  styleUrls: ['./sd-internal-calc-error.component.css']
})
export class SdInternalCalcErrorComponent {
  @Input() errorText: string;
}
