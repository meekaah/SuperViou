import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HomeRoutingModule } from './home-routing.module';

import { HomeComponent } from './home.component';
import { SharedModule } from '../shared/shared.module';
import { DndDirective } from '../shared/directives/dnd.directive';
import { SettingsDialog } from './settings/settings.dialog';


@NgModule({
  declarations: [HomeComponent, SettingsDialog, DndDirective],
  imports: [CommonModule, SharedModule, HomeRoutingModule],
  entryComponents: []
})
export class HomeModule {}
