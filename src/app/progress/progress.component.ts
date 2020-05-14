import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { ElectronService } from '../core/services';
import { SettingsModel } from '../shared/SettingsModel';

@Component({
  selector: 'app-progress',
  templateUrl: './progress.component.html',
  styleUrls: ['./progress.component.scss']
})
export class ProgressComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private electronService: ElectronService,
    private chRef: ChangeDetectorRef,
    private router: Router,
    private zone: NgZone
  ) { 

    const navigation = this.router.getCurrentNavigation();
    const state = navigation.extras.state as {
      file: string,
      settings: SettingsModel
    };

    this.inputFile = state.file;
    this.settings = state.settings;
  }

  inputFile: string;
  settings: SettingsModel;
  mode: string = "determinate"; //determinate | indeterminate
  progress: number = 0;
  message: string = "Step 1 / 4 : Initializing";

  ngOnInit(): void {


    if (this.electronService.isElectron) {
      this.electronService.ipcRenderer.on('EventGetCodecsStarted', (event, arg) => {
        this.zone.run(() => {
          this.mode = "indeterminate";
          this.progress = 0;
          this.message = "Step 1 / 4 : Get codecs started";
        });
      });

      this.electronService.ipcRenderer.on('EventGetCodecsFailed', (event, arg) => {
        this.zone.run(() => {
          this.mode = "determinate";
          this.progress = 100;
          this.message = "Step 1 / 4 : Get codecs failed";
        });
      });

      this.electronService.ipcRenderer.on('EventGetCodecsFinished', (event, arg) => {
        this.zone.run(() => {
          this.mode = "indeterminate";
          this.progress = 0;
          this.message = "Step 1 / 4 : Get codecs finished";
        });
      });

      this.electronService.ipcRenderer.on('EventProbingStarted', (event, arg) => {
        this.zone.run(() => {
          this.mode = "indeterminate";
          this.progress = 0;
          this.message = "Step 2 / 4 : Probing started";
        });
      });

      this.electronService.ipcRenderer.on('EventProbingFailed', (event, arg) => {
        this.zone.run(() => {
          this.mode = "determinate";
          this.progress = 100;
          this.message = "Step 2 / 4 : Probing failed";
        });
      });

      this.electronService.ipcRenderer.on('EventProbingFinished', (event, arg) => {
        this.zone.run(() => {
          console.log("Probing finished : ", arg);
          this.mode = "indeterminate";
          this.progress = 0;
          this.message = "Step 2 / 4 : Probing finished";
        });
      });

      this.electronService.ipcRenderer.on('EventFilterGenerationStarted', (event, arg) => {
        this.zone.run(() => {
          this.mode = "indeterminate";
          this.progress = 0;
          this.message = "Step 3 / 4 : Filter generation started";
        });
      });

      this.electronService.ipcRenderer.on('EventFilterGenerationFinished', (event, arg) => {
        this.zone.run(() => {
          this.mode = "indeterminate";
          this.progress = 0;
          this.message = "Step 3 / 4 : Filter generation finished";
        });
      });

      this.electronService.ipcRenderer.on('EventEncodingStarted', (event, arg) => {
        this.zone.run(() => {
          this.mode = "determinate";
          this.progress = 0;
          this.message = "Step 4 / 4 : Encoding started";
        });
      });

      this.electronService.ipcRenderer.on('EventEncodingProgress', (event, arg) => {
        this.zone.run(() => {
          let progress = parseInt(arg);
          console.log(`Encoding progress: ${progress}%`);
          this.mode = "determinate";
          this.progress = progress;
          this.message = "Step 4 / 4 : Encoding in progress";
        });
      });

      this.electronService.ipcRenderer.on('EventEncodingFailed', (event, arg) => {
        this.zone.run(() => {
          console.error("Encoding failed");
          this.mode = "determinate";
          this.progress = 100;
          this.message = "Step 4 / 4 : Encoding failed";
        });
      });

      this.electronService.ipcRenderer.on('EventEncodingFinished', (event, arg) => {
        this.zone.run(() => {
          console.log(`Encoding finished : ${arg}`);
          this.mode = "determinate";
          this.progress = 100;
          this.message = "Step 4 / 4 : Encoding finished";
        });
      });

      this.electronService.ipcRenderer.send('CommandEncode', this.inputFile, this.settings);
    }

  }

  close(): void {
    const navigationExtras: NavigationExtras = {
      state: {
        settings: this.settings
      }
    };
    this.router.navigate(['/'], navigationExtras);
  }

}
