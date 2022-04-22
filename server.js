const { exec, execSync, execFileSync, spawn } = require("child_process");
const fs = require('fs');
const express = require("express");
const dotenv = require("dotenv");
const tmp = require('tmp');

const app = express();

const globals = require("./constants/global.js");
const generateI = require("./constants/GenerateInputFile.js");


dotenv.config();

const port = process.env.PORT;

if (process.env.DEV == 0)
{
  app.use(express.static(__dirname + "/client"));
  app.use(express.static(__dirname + "/client/build"));
}
else
{
  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });
}

app.post("/websapo", (req, res, next) => {
	let data = '';
  req.on('data', chunk => {
    data += chunk.toString();
  });
  req.on('end', () => {
    let vars = JSON.parse(data); 

    let basePath = ".";
    let systemName = "AutoGenerated";
		
	let model = generateI.generateModelFile(
			vars.variables,
			vars.parameters,
			vars.reachability,
			vars.synthesis,
			vars.leftButtonActive,
			vars.rightButtonActive,
			vars.numberOfIterations,
			vars.maxBundleMagnitude,
			vars.maxParamSplits,
			vars.parametersMatrix,
			vars.directions,
			vars.initialDirBoundaries,
			vars.tMatrix,
			vars.logicFormulas
		);

	tmpobj = tmp.fileSync();
	fs.writeFileSync(tmpobj.fd, model);
	command = "./sapoCore/sapo/bin/sapo -b -j -t "+tmpobj.name;

    globals.executeShellCommand(
      command, 
	  (result) => {
				res.write(result);
				res.end();
				tmpobj.removeCallback();
			},
	  (stderr_data) => {
			res.write(stderr_data);
			tmpobj.removeCallback();
	  }
    );
  });
});


app.post("/polyproject", (req, res, next) => {
	let data = '';
  req.on('data', chunk => {
    data += chunk.toString();
  });
  req.on('end', () => {

	tmpobj = tmp.fileSync();
	fs.writeFileSync(tmpobj.fd, data);
	command = "./polyprojector/polyprojector "+tmpobj.name;

    globals.executeShellCommand(
	  command,
      (result) => {
				res.write(result);
				res.end();
				tmpobj.removeCallback();
			},
	  (stderr_data) => {
		tmpobj.removeCallback();
	  }
    );
  });
});

app.get("/kill", (req, res, next) => {
  console.log("Received STOP signal...");
  globals.killShellCommand();
  globals.pkill('./sapoCore/bin/sapo');
  console.log("stopped");
  res.end();
});

app.post("/saveModel", (req, res, next) => {
	console.log("Saving model file");
	let data = '';
  req.on('data', chunk => {
    data += chunk.toString();
  });
  req.on('end', () => {
    let vars = JSON.parse(data);
		var result = generateI.generateModelFile(
			vars.variables,
			vars.parameters,
			vars.reachability,
			vars.synthesis,
			vars.leftButtonActive,
			vars.rightButtonActive,
			vars.numberOfIterations,
			vars.maxBundleMagnitude,
			vars.maxParamSplits,
			vars.parametersMatrix,
			vars.directions,
			vars.initialDirBoundaries,
			vars.tMatrix,
			vars.logicFormulas
		);
		res.write(result);
		res.end();
	});
});

if (process.env.DEV == 0)
{
  app.get("/", (req, res) => {
    res.sendFile(__dirname + "/client/build/index.html");
  });
}

app.listen(port, () => console.log("listening on port " + port));
