const { exec, execSync, execFileSync } = require("child_process");
const fs = require('fs');
const express = require("express");
const dotenv = require("dotenv");

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

app.post("/prova", (req, res, next) => {
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
				vars.equations,
				vars.reachability,
				vars.synthesis,
				vars.boxesMethod,
				vars.polytopesMethod,
				vars.parallelotopesMethod,
				vars.leftButtonActive,
				vars.rightButtonActive,
				vars.numberOfIterations,
				vars.parametersMatrix,
				vars.lMatrix,
				vars.tMatrix,
				vars.logicFormulas
		);

    // execute the sapo tool
    globals.executeShellCommand(
      ("echo '" + model.replace(/(?:\r\n|\r|\n)/g, " ") + "' | ./sapoCore/bin/sapo | sed '0,/^RESULTS$/d'"),		// print model, execute sapo and remove useless output
      (result) => {
				var parts = result.split("END RESULTS\n");
				res.write(JSON.stringify({vars: parts[0], params: parts[1]}));
				res.end();
			}
    );
  });
});

app.get("/kill", (req, res, next) => {
  console.log("Recieved STOP signal...");
  globals.killShellCommand();
  console.log("stoppped");
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
			vars.equations,
			vars.reachability,
			vars.synthesis,
			vars.boxesMethod,
			vars.polytopesMethod,
			vars.parallelotopesMethod,
			vars.leftButtonActive,
			vars.rightButtonActive,
			vars.numberOfIterations,
			vars.parametersMatrix,
			vars.lMatrix,
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
