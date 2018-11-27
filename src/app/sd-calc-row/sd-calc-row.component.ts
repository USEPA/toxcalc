import { Component, ContentChild, Directive, Input, TemplateRef } from '@angular/core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

@Directive({selector: 'ng-template[sdCalcRowLabel]'})
export class SdCalcRowLabel {
  @Input('sdCalcRowLabelFor') for: string;
  constructor(public templateRef: TemplateRef<any>) {}
}

@Directive({selector: 'ng-template[sdCalcRowInput]'})
export class SdCalcRowInput {
  constructor(public templateRef: TemplateRef<any>) {}
}

@Directive({selector: 'ng-template[sdCalcRowHelp]'})
export class SdCalcRowHelp {
  constructor(public templateRef: TemplateRef<any>) {}
}

@Component({
  selector: 'sd-calc-row',
  templateUrl: './sd-calc-row.component.html',
  styleUrls: ['./sd-calc-row.component.css']
})
export class SdCalcRowComponent {
  showHelp: boolean;
  errorText: string;

  @ContentChild(SdCalcRowLabel) label: SdCalcRowLabel;
  @ContentChild(SdCalcRowInput) input: SdCalcRowInput;
  @ContentChild(SdCalcRowHelp) help: SdCalcRowHelp;

  constructor() {
    library.add(faQuestionCircle);
  }
}
