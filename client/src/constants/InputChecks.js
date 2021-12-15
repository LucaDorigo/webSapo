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
 * @param equations: JSON object containing all the info's about the equations defined by the user
 */
export const checkInput = (variables, parameters, equations) => {
  let result = {
    error: false,
    errorMessagge: ""
  };

  checkEquationsCorrectness(equations, result);
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

  cheksEquationsVarAndParams(variables, parameters, equations, result);

  return result;
};

/**
 * @param equations: JSON object containing all the info's about the equations defined by the user
 * @param result: JSON object containing the info to return in case of error to the main file
 */
const checkEquationsCorrectness = (equations, result) => {
  equations.map((item, index) => {
    try {
      math.parse(item.equation);
      result.error = false;
    } catch (math) {
      result.errorMessagge =
        math.toString() + " in equation for variable " + item.variableName;
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
 * @param str: string that needs to be checked to contain only letters from the ranges [a-z] or [A-z]
 */
const strOnlyLetters = (str) => {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123) // lower alpha (a-z)
    ) {
      return false;
    }
  }
  return true;
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
 * @param equations: JSON object containing all the info's about the equations defined by the user
 * @param result: JSON object containing the info to return in case of error to the main file
 */
const cheksEquationsVarAndParams = (
  variables,
  parameters,
  equations,
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

  let parsedEquation;

  equations.forEach(element => {
    let equation = element.equation;

    if (equation === "") {
      result.error = true;
      result.errorMessagge =
        "Equation for variable " + element.variableName + " is empty";
    } else {
//      let cleanedEquation = equation.replace(/[^A-Z]+/gi, " ");
      let cleanedEquation = equation.replace(/[^A-Za-z0-9_]+/gi, " ");
      let equationArray = cleanedEquation.split(" ");
			
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
                element.variableName +
                " is undefined and can't be used";
            } else {
              if (subEquation === "sqrt") {
                //future checks on sqrt still to be implemented
                parsedEquation = math.parse(equation);
              } else {
                result.errorMessagge =
                  subEquation +
                  " function in equation for variable " +
                  element.variableName +
                  " can't be used";
              }
            }
          }
        }
      }
    }
  });
};
