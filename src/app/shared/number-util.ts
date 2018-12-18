import { Directive, HostListener, ElementRef } from '@angular/core';

// Make sure that the values emitted by printNum are accepted by the pattern in
// SdInputPositiveNumber and by parseFloat.

@Directive({
  selector: '[sdInputPosNum]',
  host: {'class': 'text-right', type: 'text'}
})
export class SdInputPositiveNumber {
  constructor(public e: ElementRef<HTMLInputElement>) {}
  @HostListener('input') onInput() {
    this.e.nativeElement.value = this.e.nativeElement.value.replace(/[^\d.]/g, '');
  }
}

export function printNum(n: number): string {
  // Never use scientific notation, round to 6 decimal places or fewer.
  return Number(n).toLocaleString('fullwide', { useGrouping: false, maximumFractionDigits: 6 });
}

