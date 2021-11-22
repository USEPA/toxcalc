// ToxCalc! by Safe Dose © 2018-2021. See LICENSE file for details.
// SPDX-License-Identifier: GPL-3.0-or-later

import { Injectable } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { removeSoftHyphen } from '../shared/string-util';

@Injectable({
  providedIn: 'root',
})
export class SdCalculationLogService {
  constructor(private sanitizer: DomSanitizer) {}

  private blob: Blob | null = null;

  private uri_: SafeUrl | null = null;
  get uri(): SafeUrl | null { return this.uri_; }

  private unsafeuri: string | null = null;

  private groups_: Array<{'columns': Array<string>, 'rows': Array<Array<string>>}> = [];
  get groups(): Array<{'columns': Array<string>, 'rows': Array<Array<string>>}> {
    return this.groups_;
  }

  private sameArray(left: Array<string>, right: Array<string>): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  empty(): boolean {
    return this.groups_.length === 0;
  }

  append(columns: Array<string>, cells: Array<string>): void {
    if (this.groups_.length === 0 ||
        !this.sameArray(this.groups_[this.groups_.length - 1].columns, columns)) {
      this.groups_.push({'columns': columns, 'rows': [cells]});
    } else {
      this.groups_[this.groups_.length - 1].rows.push(cells);
    }
    this.updateDownload();
  }

  deleteRow(group_index: number, row_index: number): void {
    // These safety checks should never fire.
    if (group_index > this.groups_.length) { return; }
    if (row_index > this.groups[group_index].rows.length) { return; }

    // Delete the row.
    this.groups[group_index].rows.splice(row_index, 1);

    // Did we just delete the last row of a group? If so, delete the group.
    if (this.groups[group_index].rows.length === 0) {
      this.groups_.splice(group_index, 1);

      // Did the groups before and after the one we deleted have the same
      // columns? If so, merge them.
      if (group_index !== 0 && group_index < this.groups_.length &&
          this.sameArray(this.groups[group_index - 1].columns,
                         this.groups[group_index].columns)) {
          this.groups[group_index - 1].rows = this.groups[group_index - 1].rows.concat(this.groups[group_index].rows);
          this.groups_.splice(group_index, 1);
      }
    }
    this.updateDownload();
  }

  // Escaping as described in RFC 4180. Appears to work with Excel.
  private static csvEscape(escape: string): string {
    if (!escape.includes(',') && !escape.includes('"') &&
        !escape.includes('\n')) {
      return escape;
    }

    return '"' + escape.replace(/"/g, '""') + '"';
  }

  private updateDownload(): void {
    if (this.groups_.length === 0) {
      this.uri_ = null;
      return;
    }

    let result = '';
    this.groups_.forEach(function(group: {'columns': Array<string>, 'rows': Array<Array<string>>}) {
      result += group.columns.map(removeSoftHyphen).map(SdCalculationLogService.csvEscape).join(',') + '\r\n';
      group.rows.forEach(function(row: Array<string>) {
        result += row.map(removeSoftHyphen).map(SdCalculationLogService.csvEscape).join(',') + '\r\n';
      });
    });

    this.blob = new Blob([result], {type: 'text/csv'});
    const oldunsafeuri = this.unsafeuri;
    this.unsafeuri = URL.createObjectURL(this.blob);
    this.uri_ = this.sanitizer.bypassSecurityTrustUrl(this.unsafeuri);
    if (oldunsafeuri) {
      URL.revokeObjectURL(oldunsafeuri);
    }
  }

  // Hacks for IE browsers that don't support blob URIs.
  downloadclick(): boolean {
    if (window.navigator && navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveOrOpenBlob(this.blob, 'Calculator Log.csv');
      return false;
    }
    return true;
  }
}
