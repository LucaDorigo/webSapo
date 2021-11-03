// @flow
import React, { Component } from "react";
import Home from "../components/Home";
import { deepCopy, downloadFile, parseFlowpipe, parseParams } from "../constants/global";
import * as math from "mathjs";
//import { range } from "rxjs";
import { checkInput } from "../constants/InputChecks";

var http = require("http");
let killed = false; // check if execution has been killed by user

/** layout
	equations: [
				{variableName: "x", equation: "x+x"},
				{variableName: "y", equation: "y+z"},
				{variableName: "z", equation: "y+z-r"},
				{variableName: "t", equation: "y+z*z"},
				{variableName: "r", equation: "y+z/v"},
				{variableName: "v", equation: "(y+z)*y"}
			],
			variables: [
				{name: "x", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "y", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "z", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "t", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "r", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "v", lowerBound: 10, upperBound: 30, lMatrixExtra: true},
			],
			parameters: [
				{name: "x", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "y", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "z", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "t", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "r", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
				{name: "v", lowerBound: 10, upperBound: 30, lMatrixExtra: false},
			]
 *
 *
 */

export default class HomeContainer extends Component {
	props;

	constructor(props) {
		super(props);
		this.state = {
			executing: false,
			numberOfIterations: 1,
			maxParamSplits: 0,
			variables: [], // array of object
			parameters: [],
			equations: [],
			parametersMatrix: math.zeros(1),
			tMatrix: math.zeros(1),
			lMatrix: math.identity(1, 1), // updated in this.handleMethodSelection()
			logicFormulas: [""],
			cursorPositionForLogicFormula: {
				index: 0,
				startPosition: 0,
				endPosition: 0
			},
			reachability: false, // possible use of enumeration?
			synthesis: false,
			boxesMethod: false,
			polytopesMethod: false,
			parallelotopesMethod: false,
			leftButtonActive: true, // for the parameters type
			rightButtonActive: false, // for the parameters type
			disabledAddVariable: false,
			disabledAddParameter: false,
			// will display a combination of 'reachability/synthesis and methods'
			nameSelectedMenu: "Analysis method",
			sapoResults: undefined,
			sapoParams: undefined,
			updateChart: true
		};
	}

	resetParams = () => {
		this.setState({
			parameters: [],
			disabledAddParameter: false,
			parametersMatrix: math.zeros(1)
		});
	};

	// the left button for the parameters: boxes
	setLeftButtonActive = () => {
		this.resetParams();

		this.setState({
			leftButtonActive: true,
			rightButtonActive: false
		});
	};

	// the right button for the parameters: polytopes
	setRightButtonActive = () => {
		this.resetParams();

		this.setState({
			leftButtonActive: false,
			rightButtonActive: true
		});
	};

	changeNumberOfIterations = e => {
		const value = e.target.value;

		if (value > 0 && Number.isInteger(parseFloat(value, 10)) === true) {
			// parseInt is not used because does an automatic truncate and returns always an int
			this.setState({ numberOfIterations: value });
		} else {
			this.setState({ numberOfIterations: 1 });
		}
	};

	changeMaxParamSplits = e => {
		const value = e.target.value;

		if (value >= 0 && Number.isInteger(parseFloat(value, 10)) === true) {
			// parseInt is not used because does an automatic truncate and returns always an int
			this.setState({ maxParamSplits: value });
		} else {
			this.setState({ maxParamSplits: 0 });
		}
	};

	// it's not called when there is a load configuration, the menù name and state are already set.
	handleMethodSelection = info => {
		let { key } = info; // extract only the key value

		// clean the state
		this.setState({
			reachability: false,
			synthesis: false,
			boxesMethod: false,
			polytopesMethod: false,
			parallelotopesMethod: false
		});

		// assumes that there is only reachability and synthesis
		if (key.includes("reachability")) {
			this.setState({ reachability: true });
		} else {
			this.setState({ synthesis: true });
		}

		if (key.includes("boxes")) {
			let numVar = this.state.variables.length;
			numVar = numVar === 0 ? 1 : numVar;
			console.log("numVar " + numVar);

			this.setState({
				lMatrix: math.identity(numVar, numVar),
				boxesMethod: true
			});
		} else if (key.includes("polytopes")) {
			this.setState({ polytopesMethod: true });
		} else if (key.includes("parallelotopes")) {
			this.setState({ parallelotopesMethod: true });
		}
		// write the menu name
		this.setState({ nameSelectedMenu: key });
	};

	// save the array at every changes, array contains variables or parameters of the system
	saveChanges(copiedArray, parameter) {
		console.log(this.state.lMatrix);

		if (parameter) {
			this.setState({
				parameters: copiedArray
			});
		} else {
			this.setState({
				variables: copiedArray
			});
		}
	}

	// prevent the insertion of variables or paramenters if the previous ones aren't defined
	checkAllDefined = (copiedArray, parameter) => {
		let allDefined = true;

		for (let i = 0; i < copiedArray.length; i++) {
			let element = copiedArray[i];

			if (element.name === "") {
				allDefined = false;
				break;
			}
		}

		if (allDefined === true) {
			if (parameter) {
				this.setState({
					disabledAddParameter: false
				});
			} else {
				this.setState({
					disabledAddVariable: false
				});
			}
		}
	};

	// ------------- VARIABLE STUFF ----------------------

	changeName = (e, parameter) => {
		let copiedArray = deepCopy(
			parameter ? this.state.parameters : this.state.variables
		);

		let obj = copiedArray[e.target.id];
		obj.name = e.target.value;

		if (e.target.value === "") {
			if (parameter) {
				this.setState({
					disabledAddParameter: true
				});
			} else {
				this.setState({
					disabledAddVariable: true
				});
			}
		} else {
			this.checkAllDefined(copiedArray, parameter);
		}

		if (e.target.value !== "" && !parameter) {
			this.addEquation(e.target.id, e.target.value);
		}

		this.saveChanges(copiedArray, parameter);
	};

	changeLowerBound = (e, parameter) => {
		let copiedArray = deepCopy(
			parameter ? this.state.parameters : this.state.variables
		);
		let obj = copiedArray[e.target.id];
		obj.lowerBound = parseFloat(e.target.value);

		this.saveChanges(copiedArray, parameter);
	};

	changeUpperBound = (e, parameter) => {
		let copiedArray = deepCopy(
			parameter ? this.state.parameters : this.state.variables
		);
		let obj = copiedArray[e.target.id];
		obj.upperBound = parseFloat(e.target.value);

		this.saveChanges(copiedArray, parameter);
	};

	// callback to add a variable or a parameter, modifying the rispective matrix
	addCallback = parameter => {
		let copiedArray = deepCopy(
			parameter ? this.state.parameters : this.state.variables
		);
		copiedArray.push({
			name: "",
			lowerBound: 0,
			upperBound: 0,
			lMatrixExtra: false
		});

		if (parameter) {
			const indexFirstMatrixEl = (copiedArray.length - 1) * 2;
			const indexSecondMatrixEl = indexFirstMatrixEl + 1;

			let newMatrix = this.state.parametersMatrix.resize([
				copiedArray.length * 2,
				copiedArray.length + 1
			]);

			newMatrix = math.subset(
				newMatrix,
				math.index(indexFirstMatrixEl, copiedArray.length - 1),
				1
			);
			newMatrix = math.subset(
				newMatrix,
				math.index(indexSecondMatrixEl, copiedArray.length - 1),
				-1
			);

			this.setState({
				parametersMatrix: newMatrix,
				disabledAddParameter: true
			});
		} else {
			let newLMatrix = this.state.lMatrix;
			let newTMatrix = this.state.tMatrix;

			let numberOfVar = copiedArray.filter(element => {
				return !element.lMatrixExtra;
			}).length;

			newLMatrix = math.identity(copiedArray.length, numberOfVar);
			newTMatrix = this.state.tMatrix.resize([1, numberOfVar]);
			newTMatrix = math.subset(
				newTMatrix,
				math.index(0, numberOfVar - 1),
				numberOfVar - 1
			);

			this.setState({
				lMatrix: newLMatrix,
				tMatrix: newTMatrix,
				disabledAddVariable: true
			});
		}
		this.saveChanges(copiedArray, parameter);
	};

	// callback for removing a variable or a parameter, modifying the rispective matrix
	deleteCallback = (e, parameter) => {
		let copiedArray = deepCopy(
			parameter ? this.state.parameters : this.state.variables
		);

		let name = copiedArray[e.target.id].name;
		copiedArray.splice(e.target.id, 1);

		this.checkAllDefined(copiedArray, parameter);

		if (!parameter) {
			let numberOfVar = copiedArray.filter(element => {
				return !element.lMatrixExtra;
			}).length;

			let newLMatrix;
			let newTMatrix;

			if (numberOfVar !== 0) {
				newLMatrix = this.state.lMatrix.resize([
					copiedArray.length,
					numberOfVar
				]);
				newTMatrix = this.state.tMatrix.resize([1, numberOfVar]);
			} else {
				newLMatrix = math.identity(1, 1);
				newTMatrix = math.zeros(1);
			}

			this.setState({
				lMatrix: newLMatrix,
				tMatrix: newTMatrix
			});

			if (name !== "") {
				this.deleteEquation(e.target.id);
			}
		} else {
			let newMatrix =
				copiedArray.length !== 0
					? this.state.parametersMatrix.resize([
							copiedArray.length * 2,
							copiedArray.length + 1
						])
					: math.zeros(1);

			this.setState({
				parametersMatrix: newMatrix
			});
		}

		this.saveChanges(copiedArray, parameter);
	};

	// ------------- EQUATION STUFF ----------------------

	deleteEquation = index => {
		let equations = deepCopy(this.state.equations);

		equations.splice(index, 1);

		this.setState({
			equations: equations
		});
	};

	addEquation = (index, variableName) => {
		let equations = deepCopy(this.state.equations);

		if (index <= equations.length - 1) {
			let obj = equations[index];
			obj.variableName = variableName;
		} else {
			equations.push({ variableName: variableName, equation: "" });
		}

		this.setState({
			equations: equations
		});
	};

	updateEquation = e => {
		let equations = deepCopy(this.state.equations);
		let obj = equations[e.target.id];
		obj.equation = e.target.value;

		this.setState({
			equations: equations
		});
	};

	// ------------- MATRIX STUFF ----------------------

	updateMatrixElement = (
		e,
		indexRow,
		indexColumn,
		updateParams,
		parametersModal
	) => {
		if (parametersModal) {
			let newMatrix = math.subset(
				this.state.parametersMatrix,
				math.index(indexRow, indexColumn),
				parseFloat(e.target.value)
			);

			let parameters = this.state.parameters;

			if (updateParams && indexRow < this.state.parameters.length * 2) {
				if (indexRow % 2 === 0) {
					parameters[math.floor(indexRow / 2)].lowerBound = e.target.value;
				} else {
					parameters[math.floor(indexRow / 2)].upperBound = e.target.value;
				}
			}

			this.setState({
				parameters: parameters,
				parametersMatrix: newMatrix
			});
		} else {
			let newMatrix = math.subset(
				this.state.lMatrix,
				math.index(indexRow, indexColumn),
				parseFloat(e.target.value)
			);

			this.setState({
				lMatrix: newMatrix
			});
		}
	};

	addRowParameterMatrix = () => {
		let newMatrix = this.state.parametersMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];
		matrixDimensions[0] = numberOfRows + 1;
		newMatrix.resize(matrixDimensions);

		this.setState({
			parametersMatrix: newMatrix
		});
	};

	deleteRowParameterMatrix = () => {
		let newMatrix = this.state.parametersMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];

		if (numberOfRows > this.state.parameters.length * 2) {
			matrixDimensions[0] = numberOfRows - 1;
			newMatrix.resize(matrixDimensions);

			this.setState({
				parametersMatrix: newMatrix
			});
		} else {
			alert(
				"Can't delete row because otherwise the matrix would have less than 2*number of parameters rows"
			);
		}
	};

	addRowLMatrix = () => {
		let newMatrix = this.state.lMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];
		matrixDimensions[0] = numberOfRows + 1;
		newMatrix.resize(matrixDimensions);

		let copiedArray = deepCopy(this.state.variables);
		copiedArray.push({
			name: copiedArray.length + 1,
			lowerBound: 0,
			upperBound: 0,
			lMatrixExtra: true
		});

		this.setState({
			variables: copiedArray,
			lMatrix: newMatrix
		});
	};

	deleteRowLMatrix = () => {
		let newMatrix = this.state.lMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];

		let numberOfVar = this.state.variables.filter(element => {
			return !element.lMatrixExtra;
		}).length;

		if (numberOfRows > numberOfVar) {
			matrixDimensions[0] = numberOfRows - 1;
			newMatrix.resize(matrixDimensions);
			let copiedArray = deepCopy(this.state.variables);
			copiedArray.splice(copiedArray.length - 1, 1);

			this.setState({
				variables: copiedArray,
				lMatrix: newMatrix
			});
		} else {
			alert(
				"Can't delete row because otherwise the matrix would have less rows than the number of variables"
			);
		}
	};

	updateTMatrixElement = (e, indexRow, indexColumn) => {
		if (e.target.value < this.state.variables.length) {
			let newMatrix = math.subset(
				this.state.tMatrix,
				math.index(indexRow, indexColumn),
				parseFloat(e.target.value)
			);

			this.setState({
				tMatrix: newMatrix
			});
		} else {
			alert(
				"Can't insert this value because it's greater than the number of rows of the L matrix"
			);
		}
	};

	addRowTMatrix = () => {
		let newMatrix = this.state.tMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];
		matrixDimensions[0] = numberOfRows + 1;
		newMatrix.resize(matrixDimensions);

		this.setState({
			tMatrix: newMatrix
		});
	};

	deleteRowTMatrix = () => {
		let newMatrix = this.state.tMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];

		if (numberOfRows !== 1) {
			matrixDimensions[0] = numberOfRows - 1;
			newMatrix.resize(matrixDimensions);

			this.setState({
				tMatrix: newMatrix
			});
		} else {
			alert("Can't delete row because otherwise the matrix would be empty");
		}
	};

	// ------------- LOGICS STUFF ----------------------

	addLogicFormulaCallback = () => {
		let new_logicFormulas = this.state.logicFormulas;
		new_logicFormulas.push("");
		this.setState({
			logicFormulas: new_logicFormulas
		});
	};

	// write the inserted value of the formula in the react state
	// update the cursor position of the selected logic formulas
	updateLogicFormulaCallback = (index, e) => {
		console.log(
			"update logic formula. pos " +
				e.target.selectionStart +
				" " +
				e.target.selectionEnd
		);
		let new_logicFormulas = this.state.logicFormulas;
		new_logicFormulas[index] = e.target.value;

		this.setState({
			logicFormulas: new_logicFormulas,
			cursorPositionForLogicFormula: {
				index: index,
				startPosition: e.target.selectionStart,
				endPosition: e.target.selectionEnd
			}
		});
	};

	deleteLogicFormulaCallback = id => {
		let new_logicFormulas = this.state.logicFormulas;
		new_logicFormulas.splice(id, 1);
		this.setState({
			cursorPositionForLogicFormula: {},
			logicFormulas: new_logicFormulas
		});
	};

	setCursorPositionForLogicFormula = (index, e) => {
		console.log(
			"set pos " + e.target.selectionStart + " " + e.target.selectionEnd
		);
		this.setState({
			cursorPositionForLogicFormula: {
				index: index,
				startPosition: e.target.selectionStart,
				endPosition: e.target.selectionEnd
			}
		});
	};

	// used by the buttons
	injectTextInLogicFormula = txt => {
		let index = this.state.cursorPositionForLogicFormula.index;
		let startPosition = this.state.cursorPositionForLogicFormula.startPosition;
		let endPosition = this.state.cursorPositionForLogicFormula.endPosition;

		//this check is for preventing the case when the user select a row, delete it and then press a button
		if (this.state.logicFormulas[index] !== undefined) {
			let textBeforeStartPosition = this.state.logicFormulas[index].substring(
				0,
				startPosition
			);
			let textAfterEndPosition = this.state.logicFormulas[index].substring(
				endPosition
			);
			let finalText = textBeforeStartPosition + txt + textAfterEndPosition;
			let new_logicFormulas = this.state.logicFormulas;
			new_logicFormulas[index] = finalText;

			this.setState({
				logicFormulas: new_logicFormulas,
				cursorPositionForLogicFormula: {
					index: index,
					startPosition: startPosition + txt.length,
					endPosition: startPosition + txt.length
				}
			});

			// refocus on the input form
			document
				.getElementById(
					"Logic" + this.state.cursorPositionForLogicFormula.index
				)
				.focus();
		}
	};

	// ------------- PRINT SETTINGS --------------------

	updatePrintSwSettings = e => {
		console.log(e.target.value);
		// overwrite the choice
		this.setState({
			printSettings: {
				drawingSw: e.target.value,
				charts: this.state.printSettings.charts
			}
		});
	};

	addPrintChart = () => {
		let newCharts = this.state.printSettings.charts;
		newCharts.push({
			x_axis: "",
			y_axis: "",
			z_axis: ""
		});

		this.setState({
			printSettings: {
				drawingSw: this.state.printSettings.drawingSw,
				charts: newCharts
			}
		});
	};

	deletePrintChart = index => {
		let newCharts = this.state.printSettings.charts;
		newCharts.splice(index, 1);
		this.setState({
			printSettings: {
				drawingSw: this.state.printSettings.drawingSw,
				charts: newCharts
			}
		});
	};

	updatePrintChart = e => {
		//console.log(e.target);

		let newCharts = this.state.printSettings.charts;
		let id = e.target.id;
		let name = e.target.name; // name of the axis
		let value = e.target.value; // name of the variable
		newCharts[id][name] = value;

		console.log(newCharts);

		this.setState(
			{
				printSettings: {
					drawingSw: this.state.printSettings.drawingSw,
					charts: newCharts
				}
			},
			() => console.log(this.state.printSettings)
		);
	};

	createArrayOptions = () => {
		// if reachability it's possible to draw only variables
		// if synthesis it's possible to draw variables and parameters
		let array;

		if (this.state.reachability === true) {
			array = this.state.variables.map(item => {
				return item.name;
			});
		} else if (this.state.synthesis === true) {
			array = this.state.variables.concat(this.state.parameters);
			array = array.map(item => {
				return item.name;
			});
		}

		return array;
	};

	// ------------- BUTTON STUFF ----------------------

	startExecuting = () => {
		let resultChecks = checkInput(
			this.state.variables,
			this.state.parameters,
			this.state.equations
		);

		if (resultChecks.error) {
			alert(resultChecks.errorMessagge);
		} else {
			if (this.state.executing) {
				alert("process already in execution");
			} else {
				this.setState(
					{ executing: true },
					() => {
						
						let data = JSON.stringify(this.state);
						const options = {
							hostname: window.location.hostname,
							port: process.env.REACT_APP_SERVER_PORT,
							path: '/websapo',
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
								'Content-Length': data.length
							}
						}

						const req = http.request(options, (res) => {
							let str = '';

							res.on('data', (d) => {
								str += d;
							});

							res.on('end', () => {
								if (! killed)
								{
									var parts = JSON.parse(str);
									if (this.state.reachability)
									{
										downloadFile(parts.vars, "result.txt", "text/plain");
										this.setState({
											sapoResults: parseFlowpipe(parts.vars),
											sapoParams: undefined,
											hasResults: true,
											executing: false,
											updateChart:true
										});
									}
									else
									{
										downloadFile(parts.params, "result.txt", "text/plain");
										this.setState({
											sapoResults: parseFlowpipe(parts.vars),
											sapoParams: parseParams(parts.params),
											hasResults: true,
											executing: false,
											updateChart: true
										});
									}
								}
								killed = false;
							});
						}).on('error', (error) => {
							console.error(error)
						});
						req.write(data);
						req.end();
					} // end of the inline function
				); // end of setState
			} // end of else for error in the state input
		}
	};

	stopExecuting = () => {
		killed = true;
		http.get("/kill", (req, res) => {
			this.setState({ executing: false });
		});
	};

	loadConfiguration = (id) => {
		let file = document.getElementById(id).files[0];
		if (file)
		{
			let reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = (e) => {
				try
				{
					let stateFromFile = JSON.parse(e.target.result);
					this.setState(
						{
							...stateFromFile,
							lMatrix: math.matrix(stateFromFile.lMatrix.data),
							tMatrix: math.matrix(stateFromFile.tMatrix.data),
							parametersMatrix: math.matrix(
								stateFromFile.parametersMatrix.data
							),
							sapoResults: undefined,
							sapoParams: undefined,
							hasResults: false,
							updateChart: true
						},
						() => {
							console.log(this.state);
						}
					);
				}
				catch (err)
				{
					alert("Error parsing JSON string:", err);
				}
			};
		}
	};

	saveConfiguration = () => {
		downloadFile(JSON.stringify(this.state), "config.json", "application/json");
	};

	exportSourceFile = () => {
		// get header file
		let data = JSON.stringify(this.state);
			const options = {
				hostname: window.location.hostname,
				port: process.env.REACT_APP_SERVER_PORT,
				path: '/saveModel',
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Content-Length': data.length
				}
			}

			const req = http.request(options, (res) => {
				let str = '';

				res.on('data', (d) => {
					str += d;
				});

				res.on('end', () => {
					downloadFile(str, "model.sil", "text/plain");
				});
			}).on('error', (error) => {
				console.error(error)
			});
			req.write(data);
			req.end();
	};

	chooseMethod = () => {
		alert("choose");
	};
	
	
	
	
	render() {
		return (
			<Home
				changeNumberOfIterations={this.changeNumberOfIterations}
				numberOfIterations={this.state.numberOfIterations}
				changeMaxParamSplits={this.changeMaxParamSplits}
				maxParamSplits={this.state.maxParamSplits}
				handleMethodSelection={this.handleMethodSelection}
				nameSelectedMenu={this.state.nameSelectedMenu}
				//
				reachability={this.state.reachability}
				synthesis={this.state.synthesis}
				boxesMethod={this.state.boxesMethod}
				polytopesMethod={this.state.polytopesMethod}
				parallelotopesMethod={this.state.parallelotopesMethod}
				variables={this.state.variables}
				parameters={this.state.parameters}
				//
				addCallback={this.addCallback}
				deleteCallback={this.deleteCallback}
				changeName={this.changeName}
				changeLowerBound={this.changeLowerBound}
				changeUpperBound={this.changeUpperBound}
				equations={this.state.equations}
				updateEquation={this.updateEquation}
				parametersMatrix={this.state.parametersMatrix}
				updateMatrixElement={this.updateMatrixElement}
				//
				logicFormulas={this.state.logicFormulas}
				addLogicFormulaCallback={this.addLogicFormulaCallback}
				updateLogicFormulaCallback={this.updateLogicFormulaCallback}
				deleteLogicFormulaCallback={this.deleteLogicFormulaCallback}
				setCursorPositionForLogicFormula={this.setCursorPositionForLogicFormula}
				injectTextInLogicFormula={this.injectTextInLogicFormula}
				//
				executing={this.state.executing}
				startExecuting={this.startExecuting}
				stopExecuting={this.stopExecuting}
				//
				leftButtonActive={this.state.leftButtonActive}
				rightButtonActive={this.state.rightButtonActive}
				setLeftButtonActive={this.setLeftButtonActive}
				setRightButtonActive={this.setRightButtonActive}
				disabledAddVariable={this.state.disabledAddVariable}
				disabledAddParameter={this.state.disabledAddParameter}
				//
				loadConfiguration={this.loadConfiguration}
				saveConfiguration={this.saveConfiguration}
				exportSourceFile={this.exportSourceFile}
				chooseMethod={this.chooseMethod}
				//
				addRowParameterMatrix={this.addRowParameterMatrix}
				deleteRowParameterMatrix={this.deleteRowParameterMatrix}
				lMatrix={this.state.lMatrix}
				addRowLMatrix={this.addRowLMatrix}
				deleteRowLMatrix={this.deleteRowLMatrix}
				//
				printSettings={this.state.printSettings}
				updatePrintSwSettings={this.updatePrintSwSettings}
				addPrintChart={this.addPrintChart}
				deletePrintChart={this.deletePrintChart}
				updatePrintChart={this.updatePrintChart}
				arrayOptions={this.createArrayOptions()}
				//
				tMatrix={this.state.tMatrix}
				updateTMatrixElement={this.updateTMatrixElement}
				addRowTMatrix={this.addRowTMatrix}
				deleteRowTMatrix={this.deleteRowTMatrix}
				//
				sapoResults={this.state.sapoResults}
				sapoParams={this.state.sapoParams}
				updateChart={this.state.updateChart}
				setUpdated={() => this.setState({updateChart: false})}
			/>
		);
	}
}
