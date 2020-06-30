const fs = require("fs");
const H = {
  getLineNumber: function(file, theLine){
    let lines = H.getLines(file) || [];
    let count = 0;
    let theNumber = -1;
    lines.forEach(function(line){
      if(line.match(theLine)){
        theNumber = count;
      }
      count++;
    });
    return theNumber;
  },
  getLines: function(file){
    if(fs.existsSync(file)){
      return fs.readFileSync(file, 'utf-8')
      .split(/\r?\n/);
    }else{
      return [];
    }
  },
  setLine: function(file, lineNumber, line){
    if(fs.existsSync(file)){
      let data = fs.readFileSync(file).toString().split(/\r?\n/);
      data.splice(lineNumber, 0, line);
      let text = data.join("\n");
      fs.writeFileSync(file, text);
      return true;
    }else{
      return false;
    }
  },
  log: function(message){
    console.log("Countly: "+message);
  }
};

module.exports = H;