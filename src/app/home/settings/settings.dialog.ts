import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'settings-dialog',
  templateUrl: './settings.dialog.html',
  styleUrls: ['./settings.dialog.scss']
})
export class SettingsDialog {

  upscaleList = [
    { value: -1, label: "Unchanged"},
    { value: 1080, label: "1080p"},
    { value: 1440, label: "1440p"},
    { value: 2160, label: "4K"},
  ]
  constructor(
    public dialogRef: MatDialogRef<SettingsDialog>,
    @Inject(MAT_DIALOG_DATA) public settings: any
  ) {}


}
