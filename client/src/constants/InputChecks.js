import * as math from "mathjs";

//check if each equation respects constraints
// constraints:
// 1) no trigonometric functions
// 2) no exponential functions
// 3) no logarithmic functions
// 4) radix with no elevated parameters
// 5) variables and paramaters cannot appear in a grade superior than the first

const mathFunctions = [
  "sin",
  "sen",
  "cos",
  "tan",
  "tg",
  "ctg",
  "cot",
  "sec",
  "csc",
  "cosec",
  "sqrt",
  "log",
  "ln",
  "e",
  "^"
];

/**
 * @param variables: JSON object containing all the info's about the variables defined by the user
 * @param parameters: JSON object containing all the info's about the parameters defined by the user
 */
export const checkInput = (variables, parameters) => {
  let result = {
    error: false,
    errorMessagge: ""
  };

  checkDynamicsCorrectness(variables, result);
  if (result.error) {
    return result;
  }

  checkVarAndParamsNames(variables, result);
  if (result.error) {
    return result;
  }
  checkVarAndParamsNames(parameters, result);
  if (result.error) {
    return result;
  }

  checkBoundsVarAndParams(variables, result);
  if (result.error) {
    return result;
  }
  checkBoundsVarAndParams(parameters, result);
  if (result.error) {
    return result;
  }

  checkEqualNamesVarAndParameters(variables, parameters, result);
  if (result.error) {
    return result;
  }

  cheksEquationsVarAndParams(variables, parameters, result);

  return result;
};

/**
 * @param variables: a list of variable objects
 * @param result: JSON object containing the info to return in case of error to the main file
 */
const checkDynamicsCorrectness = (variables, result) => {
  variables.map((item, index) => {
    try {
      math.parse(item.dynamics);
      result.error = false;
    } catch (math) {
      result.errorMessagge =
        math.toString() + " in equation for variable " + item.name;
      result.error = true;
    }
    return result;
  });
};

/**
 * @param elementList: JSON object containing all the info's about the variables/parameters defined by the user
 * @param result: JSON object containing the info to return in case of error to the main file
 */
const checkVarAndParamsNames = (elementList, result) => {
  elementList.forEach(element => {
		if ((typeof element.name !== "number") && (element.name === "" || !element.name.match(/[A-Za-z][A-Za-z0-9_]*/g)))
		{
			result.error = true;
			result.errorMessage = "Illegal name for symbol: name mut begin with letter and contain only letters, numbers and '_'";
		}
  });
};

/**
 * @param elementList: JSON object containing all the info's about the variables/parameters defined by the user
 * @param result: JSON object containing the info to return in case of error to the main file
 */
const checkBoundsVarAndParams = (elementList, result) => {
  elementList.forEach(element => {
    if (element.lowerBound > element.upperBound) {
      result.error = true;
      result.errorMessagge =
        "The lower bound of the domain of variable/parameter " +
        element.name +
        " is higher of the upper bound";
    }
  });
};

/**
 * @param variables: JSON object containing all the info's about the variables defined by the user
 * @param parameters: JSON object containing all the info's about the parameters defined by the user
 * @param result: JSON object containing the info to return in case of error to the main file
 */
const checkEqualNamesVarAndParameters = (variables, parameters, result) => {
  let variablesName = [];
  let parametersName = [];

  variables.forEach(element => {
    variablesName.push(element.name);
  });

  parameters.forEach(element => {
    parametersName.push(element.name);
  });

  //checks if there are duplicates in the same array
  if (new Set(variablesName).size !== variablesName.length) {
    result.error = true;
    result.errorMessagge = "Duplicated name in variables";
  } else {
    //checks if there are duplicates in the same array
    if (new Set(parametersName).size !== parametersName.length) {
      result.error = true;
      result.errorMessagge = "Duplicated name in parameters";
    } else {
      for (let index = 0; index < variablesName.length; index++) {
        const element = variablesName[index];
        if (parametersName.indexOf(element) !== -1) {
          result.error = true;
          result.errorMessagge =
            "Name " +
            element +
            " can't be used both for parameters and variables";
        }
      }
    }
  }
};

/**
 * @param variables: JSON object containing all the info's about the variables defined by the user
 * @param parameters: JSON object containing all the info's about the parameters defined by the user
 * @param result: JSON object containing the info to return in case of error to the main file
 */
const cheksEquationsVarAndParams = (
  variables,
  parameters,
  result
) => {
  let variablesName = [];
  let parametersName = [];

  variables.forEach(element => {
    variablesName.push(element.name);
  });

  parameters.forEach(element => {
    parametersName.push(element.name);
  });

  variables.forEach(element => {
    let dynamics = element.dynamics;

    if (dynamics === "") {
      result.error = true;
      result.errorMessagge =
        "Equation for variable " + element.name + " is empty";
    } else {
//      let cleanedEquation = equation.replace(/[^A-Z]+/gi, " ");
      let cleanedDynamics = dynamics.replace(/[^A-Za-z0-9_]+/gi, " ");
      let equationArray = cleanedDynamics.split(" ");
			
			let equationIndex = 0;
			while (equationIndex < equationArray.length) {
				if (!equationArray[equationIndex].match(/[A-Za-z][A-Za-z0-9_]*/g)) {
					equationArray.splice(equationIndex, 1);
				} else {
					equationIndex++;
				}
			}

      for (let index = 0; index < equationArray.length; index++) {
        const subEquation = equationArray[index];
        if (subEquation !== "") {
          if (
            variablesName.indexOf(subEquation) === -1 &&
            parametersName.indexOf(subEquation) === -1
          ) {
            result.error = true;
            if (mathFunctions.indexOf(subEquation) === -1) {
              result.errorMessagge =
                subEquation +
                " in equation for variable/parameter " +
                element.name +
                " is undefined and can't be used";
            } else {
              result.errorMessagge =
                subEquation +
                " function in equation for variable " +
                element.name +
                " can't be used";
            }
          }
        }
      }
    }
  });
};
