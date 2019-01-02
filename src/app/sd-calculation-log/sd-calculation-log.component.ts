import { Component } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { library } from '@fortawesome/fontawesome-svg-core';
import { faFileDownload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'sd-calculation-log',
  templateUrl: './sd-calculation-log.component.html',
  styleUrls: ['./sd-calculation-log.component.css']
})
export class SdCalculationLogComponent {
  private uri: SafeUrl | null = null;

  private static global_groups: Array<{'columns': Array<string>, 'rows': Array<Array<string>>}> = [];
  private get groups(): Array<{'columns': Array<string>, 'rows': Array<Array<string>>}> { return SdCalculationLogComponent.global_groups; }

  constructor(private sanitizer: DomSanitizer) {
    library.add(faFileDownload);
    library.add(faTrashAlt);
  }

  private sameArray(left: Array<string>, right: Array<string>): boolean {
    return JSON.stringify(left) == JSON.stringify(right);
  }

  append(columns: Array<string>, cells: Array<string>): void {
    if (this.groups.length == 0 ||
        !this.sameArray(this.groups[this.groups.length - 1].columns, columns)) {
      this.groups.push({'columns': columns, 'rows': [cells]});
    } else {
      this.groups[this.groups.length - 1].rows.push(cells);
    }
    this.updateDownload();
  }

  deleteRow(group_index: number, row_index: number): void {
    // These safety checks should never fire.
    if (group_index > this.groups.length) { return; }
    if (row_index > this.groups[group_index].rows.length) { return; }

    // Delete the row.
    this.groups[group_index].rows.splice(row_index, 1);

    // Did we just delete the last row of a group? If so, delete the group.
    if (this.groups[group_index].rows.length == 0) {
      this.groups.splice(group_index, 1);

      // Did the groups before and after the one we deleted have the same
      // columns? If so, merge them.
      if (group_index != 0 && group_index < this.groups.length &&
          this.sameArray(this.groups[group_index - 1].columns,
                         this.groups[group_index].columns)) {
          this.groups[group_index - 1].rows = this.groups[group_index - 1].rows.concat(this.groups[group_index].rows);
          this.groups.splice(group_index, 1);
      }
    }
    this.updateDownload();
  }

  private updateDownload(): void {
    if (this.groups.length == 0) {
      this.uri = null;
      return;
    }

    // TODO: we don't escape the values at all. If we ever want to emit quotes,
    // commas or newlines, that will become a problem.

    let result = '';
    this.groups.forEach(function(group: {'columns': Array<string>, 'rows': Array<Array<string>>}) {
      result += group.columns.join(',') + '\n';
      group.rows.forEach(function(row: Array<string>){
        result += row.join(',') + '\n';
      });
    });

    let blob = new Blob([result], {type: 'text/csv'});
    let url = URL.createObjectURL(blob);
    this.uri = this.sanitizer.bypassSecurityTrustUrl(url);
  }
}
