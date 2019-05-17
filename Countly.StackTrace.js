if (ErrorUtils) {
  var previousHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler(function (error, isFatal) {
    console.log(error, isFatal);

    var stack = error.stack.toString();
    console.log(stack);
    stack = stack.split('\n');
    console.log(stack);
    // Countly.logException()
    // if (_this.config.captureUncaught && _this.config.shouldSend()) {
    //   _this.error(error, undefined, function (queued) {
    //     if (previousHandler) {
    //       previousHandler(error, isFatal);
    //     }
    //   });
    // } else if (previousHandler) {
    // previousHandler(error, isFatal);
    // }
  });
}else{
  console.log("ErrorUtils not available.");
}