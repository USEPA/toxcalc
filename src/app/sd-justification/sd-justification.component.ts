import { Component } from '@angular/core';

@Component({
  selector: 'sd-justification',
  templateUrl: './sd-justification.component.html',
  styleUrls: ['./sd-justification.component.css']
})
export class SdJustificationComponent {
  backupJustification: string = '';
  justification: string = '';
  showJustification: boolean = false;
  openJustificationEditor(): void {
    this.backupJustification = this.justification;
    this.showJustification = true;
  }
  saveJustification(): void {
    this.showJustification = false;
  }
  cancelJustification(): void {
    this.justification = this.backupJustification;
    this.showJustification = false;
  }
}
