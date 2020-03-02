import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as url from 'url';
import { spawn }  from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as isDev from 'electron-is-dev';


if (os.platform() === 'darwin' && !app.isInApplicationsFolder()){
  app.moveToApplicationsFolder();
}

let win: BrowserWindow = null;
const args = process.argv.slice(1),
    serve = args.some(val => val === '--serve');

let basePath:string = __dirname;
let ffmpegPath:string;
let ffprobePath:string;

if (!isDev && fs.existsSync(process.resourcesPath)){
  basePath = process.resourcesPath;
}
    
console.log("basepath: ", basePath);
ffmpegPath = path.resolve(basePath, 'ffmpeg', 'win32', 'ffmpeg.exe');
ffprobePath = path.resolve(basePath, 'ffmpeg', 'win32', 'ffprobe.exe');

if (os.platform() == 'darwin'){
  ffmpegPath = path.resolve(basePath, 'ffmpeg', 'darwin', 'ffmpeg');
  ffprobePath = path.resolve(basePath, 'ffmpeg', 'darwin', 'ffprobe');

  try {
    fs.chmodSync(ffmpegPath, '755');
    fs.chmodSync(ffprobePath, '755');
  } catch (error) {
    console.error('Unable to chmod ffmpeg && ffprobe: ', error);
  }

}

console.log(`ffmpegPath: ${ffmpegPath} | exists: ${fs.existsSync(ffmpegPath)}`);
console.log(`ffprobePath: ${ffprobePath} | exists: ${fs.existsSync(ffprobePath)}`);

ipcMain.on('CommandEncode', (event, arg) => {
  console.log(`received an encodeCommand with arg: ${arg}`);
  processVideo(arg);
})

function createWindow(): BrowserWindow {

  // Create the browser window.
  win = new BrowserWindow({
    width: 600,
    height: 470,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      allowRunningInsecureContent: (serve) ? true : false,
    },
  });

  win.setMenu(null);

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

function processVideo(inputFile:string) {
  
  var outputFile = replaceExt(inputFile);

  getCodecs().then((codecs) => {
    probe(inputFile).then((metadata:any) => {
      console.log("codecs & probe finished");

      const codec = metadata.streams[0].codec_name;
      const width = metadata.streams[0].width;
      const height = metadata.streams[0].height;
      const duration = parseFloat(metadata.streams[0].duration);
      const bit_rate = metadata.streams[0].bit_rate;
      
      const outX = parseInt((width/(4.0/3.0)*(16.0/9.0)).toString()) / 2 * 2 // multiplier of 2
      const outY = height;
      console.log(`Scaling input file ${inputFile} (codec: ${codec}, duration: ${duration} secs) from ${width}*${height} to ${outX}*${outY} using superview scaling`);
  
      generateFilters(outX, outY, width).then(() => {
        
        console.log(`Filter files generated, re-encoding video at bitrate ${parseInt((bit_rate/1024/1024).toString())} MB/s`);

        encode(inputFile, outputFile, codec, bit_rate, duration).then(() => {
          console.log("finished encoding!");
        }, (err) => {
          console.error("encoding error");
        });

      });

    }, (err) => {
      console.error("probe error", err);
    });
  }, (err) => {
    console.error("getcodecs error", err);
  });
}


function getCodecs(){
  win.webContents.send('EventGetCodecsStarted');
  return new Promise((resolve, reject) => {
    let codecsExec = spawn(ffmpegPath, ["-codecs"]);
    let codecsStr = "";
    codecsExec.stdout.on('data', (data) => {
      codecsStr += data.toString();
    });
    
    codecsExec.on('close', (code) => {
      if (code != 0){
        win.webContents.send('EventGetCodecsFailed');
        reject();
        return;
      }

      let result = {h264: codecsStr.includes("H.264"), h265: codecsStr.includes("H.265")};

      console.log("H.264 support: ", result.h264);
      console.log("H.265/HEVC support: ", result.h265);
      
      win.webContents.send('EventGetCodecsFinished', result);
      resolve(result);
    });
  });
}

function probe(inputFile) {
  win.webContents.send('EventProbingStarted');
  return new Promise((resolve, reject) => {
    let probeExec = spawn(ffprobePath, ["-i", inputFile, "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=codec_name,width,height,duration,bit_rate", "-print_format", "json"]);
    let probeStr = "";
    let metadata = {};
    probeExec.stdout.on('data', (data) => {
      probeStr += data.toString();
    });

    probeExec.on('close', (code) => {
      if (code != 0){
        win.webContents.send('EventProbingFailed');
        reject();
        return;
      }
      metadata = JSON.parse(probeStr);
      win.webContents.send('EventProbingFinished', metadata);
      resolve(metadata);
    });
  });
}

function generateFilters(outX:number, outY:number, width:number){
  
  win.webContents.send('EventFilterGenerationStarted');
  return new Promise((resolve, reject) => {
    const wX = fs.createWriteStream(path.join(basePath, 'x.pgm'), {encoding: 'utf-8'});
    const wY = fs.createWriteStream(path.join(basePath, 'y.pgm'), {encoding: 'utf-8'});
    wX.write(`P2 ${outX} ${outY} 65535\n`);
    wY.write(`P2 ${outX} ${outY} 65535\n`);
    
    for (let y = 0; y < outY; y++) {
      for (let x = 0; x < outX; x++) {
        const tx = (parseFloat(x.toString())/parseFloat(outX.toString()) - 0.5) * 2.0;
        const sx = parseFloat(x.toString()) - parseFloat((outX-width).toString())/2.0;
        let offset = Math.pow(tx, 2) * (parseFloat((outX-width).toString()) / 2.0);
        if (tx < 0) {
          offset *= -1;
        }
        
        wX.write(parseInt((sx - offset).toString()).toString());
        wX.write(" ");
        wY.write(y.toString());
        wY.write(" ");
      }
      wX.write("\n");
      wY.write("\n");
    }  
    
    var xEnd = new Promise((res, reject) => {
      wX.end(() => {
        console.log("done writing X filter");
        res();
      });
    });
    
    var yEnd = new Promise((res, reject) => {
      wY.end(() => {
        console.log("done writing Y filter");
        res();
      });
    });

    Promise.all([xEnd, yEnd]).then(() => {
      win.webContents.send('EventFilterGenerationFinished');
      resolve();
    });
  });
}

function encode(inputFile, outputFile, codec, bit_rate, duration){
  
  win.webContents.send('EventEncodingStarted');
  return new Promise((resolve, reject) => {

    let args = ["-hide_banner", "-progress", "pipe:1", "-loglevel", "panic", "-y", "-re", "-i", inputFile, "-i", path.resolve(basePath, 'x.pgm'), "-i", path.resolve(basePath, 'y.pgm'), "-filter_complex", "remap,format=yuv444p,format=yuv420p", "-c:v", codec, "-b:v", bit_rate, "-c:a", "copy", "-x265-params", "log-level=error", outputFile];
    
    const ffmpegExec = spawn(ffmpegPath, args);
    
    ffmpegExec.stdout.on('data', (data) => {
      data.toString().split('\n').forEach(line => {
        if (line.startsWith('out_time_ms=')){
          const time = parseFloat(line.split('=')[1]);
          const progress:number = time/(duration*10000);

          console.log(`Encoding progress: ${progress}%`)
          win.webContents.send('EventEncodingProgress', progress);
          return;
        }
      });
    });
    
    ffmpegExec.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });
    
    ffmpegExec.on('close', (code) => {
      if (code != 0){
        win.webContents.send('EventEncodingFailed');
        reject();
        return;
      }
      win.webContents.send('EventEncodingFinished', outputFile);
      resolve();
    });
  });
}

function replaceExt(npath) {
  if (typeof npath !== 'string') {
    return npath;
  }

  if (npath.length === 0) {
    return npath;
  }

  var extension = path.extname(npath);
  var nFileName = path.basename(npath, extension) + ".superviou" +extension;
  return path.join(path.dirname(npath), nFileName);
}