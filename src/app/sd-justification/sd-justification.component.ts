import { Component } from '@angular/core';

@Component({
  selector: 'sd-justification',
  templateUrl: './sd-justification.component.html',
  styleUrls: ['./sd-justification.component.css']
})
export class SdJustificationComponent {
  // Justification to return to when the user clicks cancel.
  private backupJustification: string = '';

  // Whether we're showing the textarea to edit the justification.
  showJustification: boolean = false;

  justification: string = '';

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
