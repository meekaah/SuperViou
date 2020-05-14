import { Component, OnInit } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { SettingsDialog } from './settings/settings.dialog';
import { SettingsModel } from '../shared/SettingsModel';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  file: File;
  settings: SettingsModel = {
    upscale: -1
  };
  constructor(
    private router: Router,
    private dialog: MatDialog
  ) { 
    
    const navigation = this.router.getCurrentNavigation();
    const state = navigation.extras.state as {
      settings: SettingsModel
    };
    
    if (state){
      this.settings = state.settings;
    }
  }

  ngOnInit(): void {
  }

  openSettings(){
    const dialogRef = this.dialog.open(SettingsDialog, {
      width: '250px',
      data: this.settings
    }); 

    dialogRef.afterClosed().subscribe(result => {
      if (result){
        this.settings = result;
      }
    });
  }

  onFileDropped($event) {
    this.prepareFilesList($event);
  }

  fileBrowseHandler(files) {
    this.prepareFilesList(files);
  }

  deleteFile() {
    this.file = null;
  }

  prepareFilesList(files: FileList) {
    if (files.length > 0){
      this.file = files[0];
    }
  }

  processFile(){
    
    console.log("Processing : ", this.file);
    const navigationExtras: NavigationExtras = {
      state: {
        file: this.file.path,
        settings: this.settings
      }
    };
    this.router.navigate(['/progress/'], navigationExtras);
  }
}
