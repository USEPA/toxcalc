import { Directive, ElementRef, HostBinding, Input, OnChanges } from '@angular/core';

import * as katex from 'katex';

@Directive({
  selector: '[sdKatex]'
})
export class SdKatexDirective implements OnChanges {
  @HostBinding('class.katex') private readonly class = true;
  @Input('sdKatex') private value: string;
  @Input('sdKatexInline') private inlineMode = false;

  constructor(private element: ElementRef) { }

  ngOnChanges() {
    katex.render(this.value, this.element.nativeElement, {displayMode: !this.inlineMode});
  }
}
