import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  file: File;
  constructor(
    private router: Router 
  ) { 
    
  }

  ngOnInit(): void {
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
    this.router.navigate(['/progress/'], { queryParams: { file: this.file.path } });
  }
}
