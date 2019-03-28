import { Component, ContentChild, ContentChildren, Directive, Input, QueryList, TemplateRef } from '@angular/core';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

@Directive({selector: 'ng-template[sdCalcRowLabel]'})
export class SdCalcRowLabel {
  @Input('sdCalcRowLabelFor') for: string;
  constructor(public templateRef: TemplateRef<any>) {}
}

@Directive({selector: 'ng-template[sdCalcRowInput]'})
export class SdCalcRowInput {
  @Input('sdCustomRowInput') custom = false;
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
  @Input('sdShow') show = true;
  showHelp = false;
  errorText = '';

  @ContentChild(SdCalcRowLabel) label: SdCalcRowLabel;
  @ContentChildren(SdCalcRowInput) inputs: QueryList<SdCalcRowInput>;
  @ContentChild(SdCalcRowHelp) help?: SdCalcRowHelp;

  constructor() {
    library.add(faQuestionCircle);
  }
}
