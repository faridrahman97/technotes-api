const { logEvents } = require("./logger");

const errorHandler = (err, req, res, next) => {
  // going to log the error using the logEvents function
  logEvents(
    `${err.name}: ${err.message}\t${req.method}\t${req.url}\t${req.headers.origin}`,
    "errLog.log"
  );
  console.log(err.stack);
  // the stack can get pretty large but will give us a lot of information

  const status = res.statusCode ? res.statusCode : 500; // server error

  // sets the response status
  res.status(status);

  //sends a json response
  res.json({ message: err.message, isError: true });
};

module.exports = errorHandler;
