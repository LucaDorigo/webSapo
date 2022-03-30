exports.generateModelFile = (
  variables,
  parameters,
  reachability,
  synthesis,
  leftButtonActive,
  rightButtonActive,
  numberOfIterations,
  maxBundleMagnitude,
  maxParamSplits,
  parametersMatrix,
  directions,
  initialDirBoundaries,
  tMatrix,
  logicFormulas
) => {
	var model = "";
	
	// problem type
	if (reachability)
		model += "problem: reachability;\n";
	else
		model += "problem: synthesis;\n";
	
	// iterations
	model += "iterations: " + numberOfIterations + ";\n";

	if (maxBundleMagnitude > 0) {
		model += "max_bundle_magnitude: " + maxBundleMagnitude + ";\n";
	}

	// max parameter splits
	model += "max_parameter_splits: " + maxParamSplits + ";\n";
	
	model += "\n";
	
	// variables
	model += "\n// variables\n";
	variables.forEach(v => {
		model += "var " + v.name + ";\n";
	});
	
	// constants
	model += "\n// constants\n"
	parameters.forEach((p, i) => {

		if (p.lowerBound === p.upperBound) {
			// this parameter is actually a constant
			model += "const " + p.name + " = " + p.lowerBound + ";\n";
		}
	});

	// parameters
	model += "\n// parameters\n"

	var realParams = [];
	parameters.forEach((p, i) => {
		if (p.lowerBound !== p.upperBound) {
			// if the upper and lower bounds are different,
			// this is a real parameter 

			model += "param " + p.name;
			
			// if needed, add interval
			if (leftButtonActive)
				model += " in [" + p.lowerBound + ", " + p.upperBound + "]";
			
			model += ";\n";
			realParams.push(i);
		}
	});

	model += "\n// dynamics\n"
	// dynamics
	variables.forEach(v => {
		model += "dynamic(" + v.name + ") = " + v.dynamics + ";\n";
	});
	
	// spec
	model += "\n// specification\n"
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
	
//	console.log("PRINT ALL FORMULAS");
//	console.log(allFormulas);
	
	if (allFormulas != "")
		model += "spec: " + allFormulas + ";\n";


	// directions
	model += "\n// directions\n";

	directions.forEach((direction, index) => {
		model += "direction "+ direction;

		let bounds = initialDirBoundaries[index]
		let relation = bounds.relation;
		switch (relation) {
			case "=":
			case ">=":
				model += " " + relation + " " + bounds.lowerBound + ";\n"
				break;
			case "<=":
				model += " <= " + bounds.upperBound + ";\n"
				break;
			default:
			case "in":
				model += " in [" + bounds.lowerBound + ", " + 
								   bounds.upperBound + "];\n"		
		}
	});
	model += "\n";

	// template
	if (tMatrix.size[1]>0 && tMatrix.size[0]>0)
	{
		model += "template = {\n";
		tMatrix.data.forEach((row, i) => {
			model += "{";
			row.forEach((e, j) => {
				model += e + (j == row.length - 1 ? "" : ", ");
			});
			model += "}" + (i == tMatrix.data.length - 1 ? "\n" : ",\n");
		});
		model += "};\n\n";
	}
	
	// param directions
	if (!leftButtonActive)
	{
		for (var i = 0; i < realParams.length; i++)
		{
			let param = parameters[realParams[i]];
			model += "parameter_direction ";

			realParams.forEach((p_idx) => {
				let coeff = parametersMatrix.data[2*realParams[i]][p_idx];
				if (coeff != 0) {
					model += " " + (coeff > 0 ? "+" : "-") + coeff + "*" + param.name;
				}
			});

			model += " in [" + param.lowerBound + ", " + param.upperBound + "];\n";
		}
		model += "\n";
	}
	
	// no sapo options
	
	return model;
};
