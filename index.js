const inputFile = process.argv[2] || './input.txt';
const outputFile = process.argv[3] || './output.txt';
const fs = require('fs');
const readStream = fs.createReadStream(inputFile, {encoding: 'utf-8'});
const notarize = fs.openSync(outputFile, 'w');
const readline = require('readline');
const split = require('split');
const reader = readline.createInterface({ input: process.stdin, output: process.stdout });

if(!process.argv[3] && fs.existsSync('./output.txt')) {
  console.log(`Output file will overwrite the current output.txt file, Print (y) or (n)`);
  reader.on('line', answer => {
    if(!answer){
      console.log('print (y) or (n)');
    } else if(answer.toLowerCase() === 'y' || answer === '(Y)'){
      reader.close();
      execute();
    } else if(answer.toLowerCase() === 'n' || answer === '(N)'){
      console.log('exiting process');
      process.exit();
    } else {
      console.log('print (y) or (n)');
    }
  });
} else {
  reader.close();
  execute();
}


function execute(){
  let dataSize, windowSize;
  let chunkCount= 0;
  let writeCount = 0;
  let el = [];

  readStream.pipe(split(' ')).on('data', value => {
    if(value === ' ' || value === '') return;
    switch(chunkCount){
      case 0:
        dataSize = Number(value);
        break;
      case 1:
        windowSize = findRangeSize(value).windowSize;
        firstDataValue = findRangeSize(value).firstDataValue;
        if (firstDataValue){
          chunkCount++;
          el.push(firstDataValue);
        }
        break;
      default:
        el.push(Number(value));
        if(el.length >= windowSize){
          let windowCount = findCountForRange(chunkCount - 2);
          fs.write(notarize, windowCount + '\n', err => {
            if (err) throw err;
          });
          writeCount++;
        }
    }
    chunkCount++;
  });

  function findRangeSize(value){
    if(value.search(/\n/g) > -1){
      let pointsArray = value.split('\n').map(Number);
      return {windowSize: pointsArray[0], firstDataValue: pointsArray[1]};
    } else {
      return {windowSize: Number(value), firstDataValue: null};
    }
  }

  readStream.on('end', () => {
    if(chunkCount - 2 !== dataSize){
      console.log(`The give data size parameter ''${dataSize}'' did not match the number of data points processed '${chunkCount - 2}'.  Please check the input data.  The processed data can be found in ${outputFile}`);
    } else {
      console.log(`Success!  The processed data can be found in ${outputFile} A total of ${writeCount} points were written.`);
    }
  });

  let tracker = {
    flag: true,
    runner: 0,
    runnerType: null,
    multipleRun: null,
    points: [],
  };

  function findCountForRange(index){
    if(tracker.flag){
      return calculateFirstCount();
    } else {
      return calculateNextCount(index);
    }
  }

  function calculateFirstCount(){
    tracker.flag = false;
    for(let i = 0, length = el.length; i < length - 1; i++){
      let type = determineType(el[i + 1], el[i]);
      updateTracker(tracker, type, i);
    }
    return tracker.runner;
  }

  function determineType(a, b){
    if(a > b){
      return 1;
    } else if(a < b){
      return -1;
    } else {
      return 0;
    }
  }

  function calculateNextCount(index){
    let valueToSubtract = tracker.points[index - windowSize];
    tracker.runner -= valueToSubtract;
    let type = determineType(el[index], el[index - 1]);
    updateTracker(tracker, type, index - 1);
    return tracker.runner;
  }

  function updateTracker(tracker, type, windowIndex){
    if(tracker.runnerType === type){
      tracker.multipleRun = tracker.multipleRun + 1 === windowSize ? tracker.multipleRun : tracker.multipleRun + 1;
      tracker.runner += type * tracker.multipleRun;
      tracker.points[windowIndex] = 0;
      updateContributionArray(windowIndex, tracker.multipleRun, type);
    } else {
      tracker.multipleRun = 1;
      tracker.runnerType = type;
      tracker.points[windowIndex] = type;
      tracker.runner += type;
    }
  }

  function updateContributionArray(index, consecutiveCount, type){
    let leftmostIndexToUpdate = index - consecutiveCount;
    for(let i = index; i > leftmostIndexToUpdate; i--){
      if(type === 1){
        tracker.points[i]++;
      } else if(type === -1){
        tracker.points[i]--;
      }
    }
  };
};
