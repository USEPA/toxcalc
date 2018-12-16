import { Directive, ElementRef, Input, OnChanges, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// The API for MathJax is to update an element's innerHTML then call Typeset
// on it, by pushing Typeset on the MathJax queue.
//
// Updating innerHTML is easy with nativeElement.innerHTML = ... but unsafe.
// Using a @HostBinding or "host: {'[innerHTML]': 'innerHTML'}" property defers
// the update of the native element's innerHTML property on the DOM until after
// MathJax will have already run. Therefore, we run the DomSanitizer manually.

// Check the sanitizer by using '<img onerror="javascript:alert(1)">' in place
// of '$$' + this.value + '$$'.

@Directive({
  selector: '[sdMathJax]',
})
export class SdMathJaxDirective implements OnChanges {
  @Input('sdMathJax') private value: string;

  constructor(private element: ElementRef, private sanitizer: DomSanitizer) {}

  ngOnChanges() {
    this.element.nativeElement.innerHTML = this.sanitizer.sanitize(SecurityContext.HTML, '$$' + this.value + '$$');
    // TODO: MathJax .d.ts doesn't contain isReady.
    if ((MathJax as any).isReady) {
      MathJax.Hub.Queue(["Typeset", MathJax.Hub, this.element.nativeElement]);
    }
  }
}
