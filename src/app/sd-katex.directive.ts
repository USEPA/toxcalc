import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

import * as katex from 'katex';

@Directive({
  selector: '[sdKatex]'
})
export class SdKatexDirective implements OnChanges {
  @Input('sdKatex') private value: string;

  constructor(private element: ElementRef) { }

  ngOnChanges() {
    katex.render(this.value, this.element.nativeElement, {displayMode: true});
  }
}
