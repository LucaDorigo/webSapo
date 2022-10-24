const tasks = {
	undefined: "undefined",
	reachability: "reachability",
	synthesis: "synthesis",
	invariant_validation: "invariant validation"
};

exports.generateModelFile = (
  variables,
  parameters,
  task,
  leftButtonActive,
  rightButtonActive,
  numberOfIterations,
  maxBundleMagnitude,
  maxParamSplits,
  parametersMatrix,
  initial_set,
  invariant,
  cache_Bernstein_coeff,
  dynamic_directions,
  use_invariant_directions,
  k_induction_join,
  tMatrix,
  logicFormulas
) => {
	var model = "";
	
	// problem type
	switch (task) {
		case tasks.reachability:
			model += "problem: reachability;\n";
			break;
		case tasks.synthesis:
			model += "problem: synthesis;\n";
			break;
		case tasks.invariant_validation:
			model += "problem: invariant_validation;\n";
			break;
	}
	
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
	if (logicFormulas.length>0) {
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
		
		if (allFormulas != "") {
			model += "\n// specification\nspec: " + allFormulas + ";\n";
		}
	}


	// initial set
	model += "\n// initial set\n";

	initial_set.forEach((constraint, index) => {
		model += "direction "+ constraint.expression;

		switch (constraint.relation) {
			case "=":
			case ">=":
				model += " " + constraint.relation + " " + constraint.lowerBound + ";\n"
				break;
			case "<=":
				model += " <= " + constraint.upperBound + ";\n"
				break;
			default:
			case "in":
				model += " in [" + constraint.lowerBound + ", " + 
								   constraint.upperBound + "];\n"		
		}
	});

	// invariant
	if (tasks.invariant_validation === task && invariant.length>0) {
		model += "\n\n// invariant\ninvariant: ";

		invariant.forEach((constraint, index) => {
			if (index>0) {
				model += " && "
			}

			model += constraint.expression;

			switch (constraint.relation) {
				case "=":
				case ">=":
					model += " " + constraint.relation + " " + constraint.lowerBound
					break;
				case "<=":
					model += " <= " + constraint.upperBound
					break;
				default:
				case "in":
					model += " in [" + constraint.lowerBound + ", " + 
									constraint.upperBound + "]"		
			}
		});
		model += ";\n\n"
		
		model += "option k_induction_join "+ k_induction_join +";\n"

		if (use_invariant_directions) {
			model += "option use_invariant_dirs;\n"
		}
		model += "\n"
	}

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

	if (!cache_Bernstein_coeff) {
		model += "option no_caching;\n";
	}
	

	if (dynamic_directions) {
		model += "option dynamic_directions;\n";
	}

	return model;
};
