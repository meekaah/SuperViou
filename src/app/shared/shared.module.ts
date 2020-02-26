import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PageNotFoundComponent } from './components/';
import { WebviewDirective } from './directives/';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@NgModule({
  declarations: [PageNotFoundComponent, WebviewDirective],
  imports: [CommonModule, TranslateModule, FormsModule, MatCardModule, MatButtonModule, MatDialogModule, BrowserAnimationsModule, MatBottomSheetModule, MatProgressSpinnerModule],
  exports: [TranslateModule, WebviewDirective, FormsModule, MatCardModule, MatButtonModule, MatDialogModule, BrowserAnimationsModule, MatBottomSheetModule, MatProgressSpinnerModule]
})
export class SharedModule { }
