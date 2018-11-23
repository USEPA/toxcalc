import { AfterContentInit, Component, ContentChild, ContentChildren, Directive, Input, QueryList, TemplateRef } from '@angular/core';

@Directive({selector: 'ng-template[sdProductListTitle]'})
export class SdProductListItemTitle {
  constructor(public templateRef: TemplateRef<any>) {}
}

@Directive({selector: 'ng-template[sdProductListDescription]'})
export class SdProductListItemDescription {
  constructor(public templateRef: TemplateRef<any>) {}
}

@Directive({selector: 'sd-product-list-item'})
export class SdProductListItem {
  @ContentChild(SdProductListItemTitle) title: SdProductListItemTitle;
  @ContentChild(SdProductListItemDescription) description: SdProductListItemDescription;
  @Input() routerLink: string;
}

@Component({
  selector: 'sd-product-list',
  templateUrl: './sd-product-list.component.html',
  styleUrls: ['./sd-product-list.component.css']
})
export class SdProductListComponent {
  @ContentChildren(SdProductListItem) items: QueryList<SdProductListItem>;
}
