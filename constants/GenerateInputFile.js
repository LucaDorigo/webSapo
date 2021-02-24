exports.generateModelFile = (
  variables,
  parameters,
  equations,
  reachability,
  synthesis,
  boxesMethod,
  polytopesMethod,
  parallelotopesMethod,
	leftButtonActive,
	rightButtonActive,
	numberOfIterations,
  parametersMatrix,
  lMatrix,
  tMatrix,
  logicFormulas
) => {
	var model = "";
	
	// problem type
	if (reachability)
		model += "problem: reachability;\n";
	else
		model += "problem: synthesis;\n";
	
	// var mode
	if (boxesMethod)
		model += "variable_mode: boxes;\n";
	else if (parallelotopesMethod)
		model += "variable_mode: parallelotopes;\n";
	else
		model += "variable_mode: polytope;\n";
	
	// param mode
	if (leftButtonActive)
		model += "parameter_mode: boxes;\n";
	else
		model += "parameter_mode: parallelotopes;\n";
	
	// iterations
	model += "iterations: " + numberOfIterations + ";\n";
	
	model += "\n";
	
	// variables
	var varNum = 0;
	variables.forEach(v => {
		if (!v.lMatrixExtra)
		{
			model += "var " + v.name;
			
			// if needed, add interval
			if (boxesMethod)
				model += " in [" + v.lowerBound + ", " + v.upperBound + "]";
			
			model += ";\n";
			
			varNum++;
		}
	});
	model += "\n";
	
	// parameters
	var paramNum = 0;
	parameters.forEach(p => {
		model += "param " + p.name;
		
		// if needed, add interval
		if (leftButtonActive)
			model += " in [" + p.lowerBound + ", " + p.upperBound + "]";
		
		model += ";\n";
		paramNum++;
	});
	model += "\n";
	
	// dynamics
	equations.forEach(e => {
		model += "dynamic(" + e.variableName + ") = " + e.equation + ";\n";
	});
	model += "\n";
	
	// spec TODO: implement
	var allFormulas = "";
	logicFormulas.forEach(f => {
		if (f != "")
		{
			if (allFormulas == "")
				allFormulas = f;
			else
				allFormulas += " && " + f;
		}
	});
	allFormulas = allFormulas.replace(/∧/g, "&&");
	allFormulas = allFormulas.replace(/∨/g, "||");
	allFormulas = allFormulas.replace(/¬/g, "!");
	allFormulas = allFormulas.replace(/F_/g, "F");
	allFormulas = allFormulas.replace(/G_/g, "G");
	allFormulas = allFormulas.replace(/_U_/g, "U");
	
	console.log("PRINT ALL FORMULAS");
	console.log(allFormulas);
	
	if (allFormulas != "")
		model += "spec: " + allFormulas + ";";
	
	
	// directions
	if (!boxesMethod)
	{
		lMatrix.data.forEach((l, i) => {
			model += "direction <";
			
			l.forEach((e, j) => {
				model += e + (j == l.length - 1 ? "" : ", ");
			});
			
			model += "> in [" + variables[i].lowerBound + ", " + variables[i].upperBound + "];\n"
		});
		model += "\n";
	}
	
	// template
	if (polytopesMethod)
	{
		model += "template = {\n";
		tMatrix.data.forEach((row, i) => {
			model += "{";
			row.forEach((e, j) => {
				model += e + (j == row.length - 1 ? "" : ", ");
			});
			model += "}" + (i == tMatrix.data.length - 1 ? "\n" : ",\n");
		});
		model += "}\n\n";
	}
	
	// param directions
	if (!leftButtonActive)
	{
		// parameter matrix has two rows for each direction, assumed to be consecutive
		for (var i = 0; 2*i < parametersMatrix.data.length; i++)
		{
			model += "parameter_direction <";

			for (var j = 0; j < paramNum; j++)
				model += parametersMatrix.data[2*i][j] + (j == paramNum - 1 ? "" : ", ");

			model += "> in [" + parameters[i].lowerBound + ", " + parameters[i].upperBound + "];\n";
		}
		model += "\n";
	}
	
	// no sapo options
	
	return model;
};
