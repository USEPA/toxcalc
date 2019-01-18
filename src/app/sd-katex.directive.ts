import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

import * as katex from 'katex';

@Directive({
  selector: '[sdKatex]',
  host: {'class': 'katex'}
})
export class SdKatexDirective implements OnChanges {
  @Input('sdKatex') private value: string;
  @Input('sdKatexInline') private inlineMode: boolean = false;

  constructor(private element: ElementRef) { }

  ngOnChanges() {
    katex.render(this.value, this.element.nativeElement, {displayMode: !this.inlineMode});
  }
}
