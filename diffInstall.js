var fs = require('fs');
var path = require('path');
var isArray = Array.isArray;
var isWindows = (process.platform === 'win32');
var homePath = process.env[ isWindows ? 'USERPROFILE' : 'HOME'];
var child_process = require('child_process');
var ncp;
if(isWindows) {
  child_process.execSync('npm install ncp');
  ncp = require('ncp').ncp;
  ncp.limit = 5;
  child_process.execSync('npm uninstall ncp');
}

function isExist(dir) {
  dir = path.normalize(dir);
  if (fs.accessSync) {
    try {
      fs.accessSync(dir, fs.R_OK);
      return true;
    } catch (e) {
      return false;
    }
  }
  return fs.existsSync(dir);
}

/**
 * check path is directory
 */
function isDirectory(filePath) {
  if (!isExist(filePath)) {
    return false;
  }
  var stat =fs.statSync(filePath);
  return stat.isDirectory();
}

/**
 * check filepath is file
 */
function isFile(filePath) {
  if (!isExist(filePath)) {
    return false;
  }
  var stat = fs.statSync(filePath);
  return stat.isFile();
}

function chmod(dir) {
  var mode = arguments.length <= 1 || arguments[1] === undefined ? '0777' : arguments[1];

  if (!isExist(dir)) {
    return false;
  }
  try {
    fs.chmodSync(dir, mode);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * make dir
 */
function mkdir(dir) {
  var mode = arguments.length <= 1 || arguments[1] === undefined ? '0777' : arguments[1];

  if (isExist(dir)) {
    return chmod(dir, mode);
  }
  var pp = path.dirname(dir);
  if (isExist(pp)) {
    try {
      fs.mkdirSync(dir, mode);
      return true;
    } catch (e) {
      return false;
    }
  }
  if (mkdir(pp, mode)) {
    return mkdir(dir, mode);
  } else {
    return false;
  }
}

function getDirectories(dir){
  if(!isDirectory(dir)){
    return [];
  }
  var files = fs.readdirSync(dir);
  var result = [];
  files.forEach(function(item) {
    var stat = fs.statSync(path.join(dir, item));
    if (stat.isDirectory()) {
      result.push(item);
    }
  });
  return result;
}

function extend(target) {
  var src = void 0,
      copy = void 0;

  for (var _len = arguments.length, sources = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }

  if (!target) {
    target = isArray(sources[0]) ? [] : {};
  }
  sources.forEach(function (source) {
    if (!source) {
      return;
    }
    for (var key in source) {
      src = target[key];
      copy = source[key];
      if (src && src === copy) {
        continue;
      }
      if (isObject(copy)) {
        target[key] = extend(src && isObject(src) ? src : {}, copy);
      } else if (isArray(copy)) {
        target[key] = extend([], copy);
      } else {
        target[key] = copy;
      }
    }
  });
  return target;
}

function isObject(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
}


function run(){
  var package = './package.json';
  if(!isFile(package)){
    return;
  }
  var content = fs.readFileSync(package);
  var data = JSON.parse(content);
  var dependencies = extend({}, data.dependencies, data.devDependencies);
  var product = process.argv[2];
  if(!product){
    throw new Error('node diffInstall.js [productName]');
  }
  var nmPath = __dirname + '/node_modules/';
  mkdir(nmPath);
  var savePath = homePath + '/.diffInstall/' + product + '/';

  function copydir(src, dst, cb) {
    if(isWindows) {
      ncp(src, dst, function(err){
        if(err) return console.log(err);
        cb();
      });
    } else {
      child_process.execSync('cp -R ' + src + '/* ' + dst);
      cb();
    }
  }
  // copy directories to node_modules/
  if(isDirectory(savePath)){
    var dirs = getDirectories(savePath);
    dirs.forEach(function(dir){
      if(isDirectory(nmPath + dir)){
        return;
      }
      mkdir(nmPath + dir);
      
      copydir(savePath + dir, nmPath + dir, function() {});
    });
  }

  // npm install packages
  for(var name in dependencies){
    var mpath = nmPath + name;
    if(isDirectory(mpath)){
      continue;
    }

    var registry = process.argv[3] || 'http://registry.npm.qiwoo.org';
    var cmd = 'npm install ' + name + '@' + dependencies[name] + ' --registry=' + registry;
    console.log(cmd);
    child_process.execSync(cmd);
  }

  // copy directories to ~/.diffInstall
  var dirs = getDirectories(nmPath);
  var total = 0;
  var finished = 0;
  dirs = dirs.filter(function(dir){
    return !isDirectory(savePath + dir);
  }).forEach(function(dir, index, array){
    mkdir(savePath + dir);
    copydir(nmPath + dir, savePath + dir, function() {
      // finished++;
      // console.log('全局备份已完成百分之 ' + (finished * 100 / array.length).toFixed(2));  
    });
  });
}


;run();