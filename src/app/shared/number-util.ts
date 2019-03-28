import { Directive, HostBinding, HostListener, ElementRef, EventEmitter, Output } from '@angular/core';

// Make sure that the values emitted by printNum are accepted by the pattern in
// SdInputPositiveNumber and by parseFloat.

@Directive({
  selector: '[sdInputPosNum]'
})
export class SdInputPositiveNumber {
  constructor(public e: ElementRef<HTMLInputElement>) {}
  @Output() ngModelChange: EventEmitter<any> = new EventEmitter()
  @HostBinding('class.text-right') private readonly class = true;
  @HostBinding('attr.type') private readonly type = 'text';
  @HostListener('input') onInput() {
    this.e.nativeElement.value = this.e.nativeElement.value.replace(/[^\d.]/g, '');
    this.ngModelChange.emit(this.e.nativeElement.value);
  }
}

@Directive({
  selector: '[sdInputPosNumLeft]'
})
export class SdInputPositiveNumberLeft {
  constructor(public e: ElementRef<HTMLInputElement>) {}
  @Output() ngModelChange: EventEmitter<any> = new EventEmitter()
  @HostBinding('attr.type') private readonly type = 'text';
  @HostListener('input') onInput() {
    this.e.nativeElement.value = this.e.nativeElement.value.replace(/[^\d.]/g, '');
    this.ngModelChange.emit(this.e.nativeElement.value);
  }
}

export function printNum(n: number): string {
  // Never use scientific notation, round to 6 decimal places or fewer.
  return Number(n).toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 6 });
}

