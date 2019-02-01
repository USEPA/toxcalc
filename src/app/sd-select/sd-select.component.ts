import { AfterContentInit, Component, ContentChildren, Directive, EventEmitter, Input, Output, QueryList, forwardRef } from '@angular/core';

@Directive({selector: 'option'})
export class SdSelectItem {
  @Input() label: string;
  index: number;

  @Input() value: any;
}

@Directive({selector: 'optgroup'})
export class SdSelectGroup implements AfterContentInit {
  @ContentChildren(SdSelectItem) items: QueryList<SdSelectItem>;
  @Input() label: string;
  index: number;

  ngAfterContentInit() {
    this.items.forEach(function(item: SdSelectItem, index: number, array: SdSelectItem[]) { item.index = index; });
  }
}

@Component({
  selector: 'sd-select',
  templateUrl: './sd-select.component.html',
  styleUrls: ['./sd-select.component.css'],
})
export class SdSelectComponent implements AfterContentInit {
  @Input('sdAppend') append: boolean;

  selectedItem: SdSelectItem;
  selectedGroup: SdSelectGroup;

  @ContentChildren(SdSelectGroup) groups: QueryList<SdSelectGroup>;
  @ContentChildren(SdSelectItem) items: QueryList<SdSelectItem>;

  onGroupItemSelected(group: SdSelectGroup, item: SdSelectItem): void {
    this.selectedGroup = group;
    this.selectedItem = item;
    this.change.emit({group: group, item: item});
  }
  onItemSelected(item: SdSelectItem): void {
    this.selectedItem = item;
    this.change.emit({item: item});
  }

  @Output() change: EventEmitter<any> = new EventEmitter<any>();

  // If you attempt to access these before 'ready' is true, such as from an
  // ngIf, they will raise an exception. Check the value of ready, and if it is
  // false produce the result that is correct for the default state of the page.

  get selectedIndex(): number { return this.selectedItem.index; }
  get selectedName(): string { return this.selectedItem.label; }

  get selectedGroupIndex(): number { return this.selectedGroup.index; }
  get selectedGroupName(): string { return this.selectedGroup.label; }

  private ready_: boolean = false;
  get ready(): boolean { return this.ready_; }

  ngAfterContentInit() {
    if (this.groups.length == 0) {
      this.selectedItem = this.items.first;
      this.items.forEach(function(item: SdSelectItem, index: number, array: SdSelectItem[]) { item.index = index; });
    } else {
      this.groups.forEach(function(group: SdSelectGroup, index: number, array: SdSelectGroup[]) { group.index = index; });
      this.selectedGroup = this.groups.first;
      this.selectedItem = this.selectedGroup.items.first;
    }
    this.ready_ = true;
  }

  get value(): any { return this.selectedItem.value; }
}
