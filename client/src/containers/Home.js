// @flow
import React, { Component } from "react";
import Home from "../components/Home";
import { downloadFile, tasks } from "../constants/global";
import * as math from "mathjs";
//import { range } from "rxjs";
import { checkInput } from "../constants/InputChecks";
import { ToastContainer, toast } from 'react-toastify';

import 'react-toastify/dist/ReactToastify.min.css';


var http = require("http");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let partial_value = /^(-)?([0-9]*|[0-9]+((\.|,)[0-9]*)?)$/;

const initState = {
	executing: false,
	killed: false,
	progress: 0,
	numberOfIterations: 1,
	maxBundleMagnitude: 0.0,
	maxParamSplits: 0,
	variables: [], // array of object
	parameters: [],
	parametersMatrix: math.zeros(1),
	tMatrix: math.zeros(1),
	directions: [], // array of directions
	initialDirBoundaries: [],
	logicFormulas: [],
	cursorPositionForLogicFormula: {
		index: 0,
		startPosition: 0,
		endPosition: 0
	},
	task: tasks.undefined,
	leftButtonActive: true, // for the parameters type
	rightButtonActive: false, // for the parameters type
	disabledAddVariable: false,
	disabledAddParameter: false,
	disabledAddFormula: false,
	// will display a combination of 'reachability/synthesis and methods'
	sapoResults: undefined,
	projectName: undefined,
	updateChart: true
};

export default class HomeContainer extends Component {
	props;

	constructor(props) {
		super(props);
		this.state = initState;
	}

	resetParams = () => {
		this.setState({
			parameters: [],
			disabledAddParameter: false,
			parametersMatrix: math.zeros(1),
			sapoResults: undefined
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
			this.setState({ numberOfIterations: value, sapoResults: undefined});
		} else {
			this.setState({ numberOfIterations: 1, sapoResults: undefined});
		}
	};

	changeMaxBundleMagnitude = e => {
		const value = e.target.value;

		if (value >= 0) {
			this.setState({ maxBundleMagnitude: value, sapoResults: undefined});
		} else {
			this.setState({ maxBundleMagnitude: 0, sapoResults: undefined});
		}
	};

	changeMaxParamSplits = e => {
		const value = e.target.value;

		if (value >= 0 && Number.isInteger(parseFloat(value, 10)) === true) {
			// parseInt is not used because does an automatic truncate and returns always an int
			this.setState({ maxParamSplits: value, sapoResults: undefined});
		} else {
			this.setState({ maxParamSplits: 0, sapoResults: undefined});
		}
	};

	// it's not called when there is a load configuration, the menu name and state are already set.
	handleMethodSelection = info => {
		let { key } = info; // extract only the key value

		// clean the state
		this.setState({
			task: key,
			sapoResults: undefined
		});
	};

	// save the array at every changes, array contains variables or parameters of the system
	saveChanges(targetArray, parameter) {
		if (parameter) {
			this.setState({
				parameters: targetArray,
				sapoResults: undefined
			});
		} else {
			this.setState({
				variables: targetArray,
				sapoResults: undefined
			});
		}
	}

	// save the array at every changes, array contains variables or parameters of the system
	saveBoundaries(targetArray, parameter) {
		if (parameter) {
			this.setState({
				parameters: targetArray,
				sapoResults: undefined
			});
		} else {
			this.setState({
				initialDirBoundaries: targetArray,
				sapoResults: undefined
			});
		}
	}

	// prevent the insertion of variables or paramenters if the previous ones aren't defined
	checkAllDefined = (targetArray, parameter) => {
		let i = 0;
		if (!parameter) {
			while (i < targetArray.length && 
				 targetArray[i].name !== "" && 
				 targetArray[i].dynamics !== "") 
			{
				i += 1;
			}
		} else {
			while (i < targetArray.length && 
				targetArray[i].name !== "") 
			{
				i += 1;
			}	
		}

		if (parameter) {
			this.setState({
				disabledAddParameter: i!==targetArray.length
			});
		} else {
			this.setState({
				disabledAddVariable: i!==targetArray.length
			});
		}
	};

	checkFormulas = () => {
		let i = 0;
		let logicFormulas = this.state.logicFormulas;
		while (i < logicFormulas.length && 
			logicFormulas[i] !== "") {
			i += 1;
		}

		this.setState({
			disabledAddFormula: i!==logicFormulas.length
		});
	}

	// ------------- VARIABLE STUFF ----------------------

	changeName = (e, parameter) => {
		let targetArray = parameter ? this.state.parameters : this.state.variables;

		let index = e.target.id
		let obj = targetArray[index];
		var old_name = obj.name;
		obj.name = e.target.value;

		if (!parameter) {
			let directions = this.state.directions;

			if (directions[directions.length-1] === old_name) {
				this.changeDirection(e, directions.length-1);
			}

			if (obj.dynamics===old_name) {
				this.changeDynamics(e);
			}
		}

		this.checkAllDefined(targetArray, parameter);

		this.saveChanges(targetArray, parameter);
	};

	getVariableNames = () => {
		return new Set(this.state.variables.map(x => x.name));	
	}

	getParameterNames = () => {
		var params = new Set([]);
		var var_names = this.getVariableNames();	
	
		this.state.variables.forEach(x => {
			var dyn_names = x.dynamics.match(/[a-zA-Z]\w*/g);
			dyn_names.forEach(dyn_name => {
				if (!var_names.has(dyn_name)) {
					params.add(dyn_name);
				}
			})
		})

		return params;
	}

	changeDynamics = (e) => {

		let obj = this.state.variables[e.target.id];
		obj.dynamics = e.target.value;

		this.checkAllDefined(this.state.variables, false);

		this.saveChanges(this.state.variables, false);
	}

	changeRelation = (e, index) => {
		let targetArray = this.state.initialDirBoundaries;

		let obj = targetArray[index];
		obj.relation = e.target.value;

		this.setState({
			initialDirBoundaries: targetArray,
			sapoResults: undefined
		});
	}

	checkLowerBoundAndUpdateConcistency = (e, parameter) => {
		let targetArray = parameter ? this.state.parameters : this.state.initialDirBoundaries;

		let obj = targetArray[e.target.id]
		obj.lowerBound = parseFloat(e.target.value);
		obj.lb_error = isNaN(obj.lowerBound);

		if (!obj.lb_error) {
			if (obj.lowerBound>obj.upperBound) {
				obj.upperBound = obj.lowerBound;
			}
		}

		this.saveBoundaries(targetArray, parameter);
	}

	checkUpperBoundAndUpdateConcistency = (e, parameter) => {
		let targetArray = parameter ? this.state.parameters : this.state.initialDirBoundaries;

		let obj = targetArray[e.target.id]
		obj.upperBound = parseFloat(e.target.value);
		obj.ub_error = isNaN(obj.upperBound);

		if (!obj.ub_error) {
			if (obj.lowerBound>obj.upperBound) {
				obj.lowerBound = obj.upperBound;
			}
		}

		this.saveBoundaries(targetArray, parameter);
	}

	changeLowerBound = (e, parameter) => {
		if (partial_value.test(e.target.value)) {
			let targetArray = parameter ? this.state.parameters : this.state.initialDirBoundaries;
			let obj = targetArray[e.target.id];

			obj.lowerBound = e.target.value;

			this.saveBoundaries(targetArray, parameter);
		}
	};

	changeUpperBound = (e, parameter) => {
		if (partial_value.test(e.target.value)) {
			let targetArray = parameter ? this.state.parameters : this.state.initialDirBoundaries;
			let obj = targetArray[e.target.id];

			obj.upperBound = e.target.value;

			this.saveBoundaries(targetArray, parameter);
		}
	};

	// callback to add a variable or a parameter, modifying the rispective matrix
	addCallback = parameter => {
		let targetArray = parameter ? this.state.parameters : this.state.variables;

		if (parameter) {
			targetArray.push({
				name: "",
				lowerBound: 0,
				upperBound: 0,
				lb_error : false,
				ub_error : false,
			});
			const indexFirstMatrixEl = (targetArray.length - 1) * 2;
			const indexSecondMatrixEl = indexFirstMatrixEl + 1;

			let newMatrix = this.state.parametersMatrix.resize([
				targetArray.length * 2,
				targetArray.length + 1
			]);

			newMatrix = math.subset(
				newMatrix,
				math.index(indexFirstMatrixEl, targetArray.length - 1),
				1
			);
			newMatrix = math.subset(
				newMatrix,
				math.index(indexSecondMatrixEl, targetArray.length - 1),
				-1
			);

			this.setState({
				parametersMatrix: newMatrix,
				disabledAddParameter: true
			});
		} else {
			targetArray.push({
				name: "",
				dynamics: ""
			});

			/*
			let directions = this.state.directions
			if (directions.length < targetArray.length) {
				this.addDirection();
			}*/

			let newTMatrix = this.state.tMatrix.resize([0, targetArray.length]);

			this.setState({
				tMatrix: newTMatrix,
				disabledAddVariable: true
			});
		}
		this.saveChanges(targetArray, parameter);
	};

	// callback for removing a variable or a parameter, modifying the rispective matrix
	deleteCallback = (idx, parameter) => {
		let targetArray = parameter ? this.state.parameters : this.state.variables;

		var parsed = parseInt(idx);
		if (!isNaN(parsed)) {

			targetArray.splice(parsed, 1);

			this.checkAllDefined(targetArray, parameter);

			if (!parameter) {
				let newTMatrix;

				if (targetArray.length !== 0) {
					let row_num = this.state.tMatrix.size()[0];
					newTMatrix = this.state.tMatrix.resize([row_num, targetArray.length]);
				} else {
					newTMatrix = this.state.tMatrix.resize([0, targetArray.length]);
				}

				this.setState({
					tMatrix: newTMatrix
				});
			} else {
				let newMatrix =
					targetArray.length !== 0
						? this.state.parametersMatrix.resize([
								targetArray.length * 2,
								targetArray.length + 1
							])
						: math.zeros(1);

				this.setState({
					parametersMatrix: newMatrix
				});
			}

			this.saveChanges(targetArray, parameter);
		}
	};

	// ------------- MATRIX STUFF ----------------------

	addRowParameterMatrix = () => {
		let newMatrix = this.state.parametersMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];
		matrixDimensions[0] = numberOfRows + 1;
		newMatrix.resize(matrixDimensions);

		this.setState({
			parametersMatrix: newMatrix,
			sapoResults: undefined
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
				parametersMatrix: newMatrix,
				sapoResults: undefined
			});
		} else {
			toast.error("The number of rows must be at least twice the number of parameters");
		}
	};

	// ------------ Direction Stuff ---------------------

	deleteDirection = (index) => {
		let directions = this.state.directions;
		let initialDirBoundaries = this.state.initialDirBoundaries;

		if (index < directions.length) {
			directions.splice(index, 1);
			initialDirBoundaries.splice(index, 1);

			/* tMatrix UPDATE TO BE DONE */

			this.setState({
				directions: directions,
				initialDirBoundaries: initialDirBoundaries,
				sapoResults: undefined
			});
		}
	};

	changeDirection = (e, index) => {
		const value = e.target.value;

		let directions = this.state.directions;

		if (index < directions.length) {
			directions[index] = value;

			this.setState({
				directions: directions,
				sapoResults: undefined
			});
		}
	};

	addDirection = () => {
		let directions = this.state.directions;
		let initialDirBoundaries = this.state.initialDirBoundaries;

		directions.push("");
		initialDirBoundaries.push({
			relation: "in",
			lowerBound: 0,
			upperBound: 0,
			lb_error: false,
			ub_error: false
		})

		this.setState({
			directions: directions,
			initialDirBoundaries: initialDirBoundaries,
			sapoResults: undefined
		});
	};

	updateTMatrixElement = (e, indexRow, indexColumn) => {
		if (e.target.value < this.state.variables) {
			let newMatrix = math.subset(
				this.state.tMatrix,
				math.index(indexRow, indexColumn),
				parseInt(e.target.value)
			);

			this.setState({
				tMatrix: newMatrix,
				sapoResults: undefined
			});
		} else {
			toast.error('The value is must be at most equal to the number of L matrix rows');
		}
	};

	addRowTMatrix = () => {
		let newMatrix = this.state.tMatrix;
		let matrixDimensions = newMatrix.size();
		if (matrixDimensions[0]===0) {
			let numberOfVar = this.state.variables.filter(element => {
				return !element.lMatrixExtra;
			}).length;
			newMatrix = newMatrix.resize([1, numberOfVar]);
			newMatrix = math.subset(
				newMatrix,
				math.index(0, numberOfVar - 1),
				numberOfVar - 1
			);
		} else {
			matrixDimensions[0]+=1;
			newMatrix.resize(matrixDimensions);
		}
		this.setState({
			tMatrix: newMatrix,
			sapoResults: undefined
		});
	};

	deleteRowTMatrix = () => {
		let newMatrix = this.state.tMatrix;
		let matrixDimensions = newMatrix.size();
		let numberOfRows = matrixDimensions[0];

		if (numberOfRows > 0) {
			matrixDimensions[0] = numberOfRows - 1;
			newMatrix.resize(matrixDimensions);

			this.setState({
				tMatrix: newMatrix,
				sapoResults: undefined
			});
		}
	};

	// ------------- LOGICS STUFF ----------------------

	addLogicFormulaCallback = () => {
		let new_logicFormulas = this.state.logicFormulas;
		new_logicFormulas.push("");
		this.setState({
			logicFormulas: new_logicFormulas,
			disabledAddFormula: true,
			sapoResults: undefined
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
		let logicFormulas = this.state.logicFormulas;
		logicFormulas[index] = e.target.value;

		this.setState({
			logicFormulas: logicFormulas,
			cursorPositionForLogicFormula: {
				index: index,
				startPosition: e.target.selectionStart,
				endPosition: e.target.selectionEnd
			},
			sapoResults: undefined
		});

		this.checkFormulas();
	};

	deleteLogicFormulaCallback = id => {
		let new_logicFormulas = this.state.logicFormulas;
		new_logicFormulas.splice(id, 1);
		this.setState({
			cursorPositionForLogicFormula: {},
			logicFormulas: new_logicFormulas,
			sapoResults: undefined
		});

		this.checkFormulas();
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
				},
				sapoResults: undefined
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

		switch(this.state.task) {
			case tasks.synthesis:
				array = this.state.variables.concat(this.state.parameters);
				array = array.map(item => {
					return item.name;
				});
				break;
			default:
				array = this.state.variables.map(item => {
					return item.name;
				});
				break;
		}

		return array;
	};

	// ------------- BUTTON STUFF ----------------------

	startExecuting = () => {
		let resultChecks = checkInput(
			this.state.variables,
			this.state.parameters
		);

		if (resultChecks.error) {
			document.getElementById("progress").style.display =
			"none";
			toast.error(resultChecks.errorMessagge);
		} else {
			if (this.state.executing) {
				toast.error("The process is already running");
			} else {
				this.setState({ progress: 0});
				document.getElementById("progress_msg").innerHTML =
															"Analyzing the problem...";
				this.setState(
					{ executing: true, progress: 0, killed: false },
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
							let msg = '';
							let receiving_bar = true;
							let hash_code = '#'.charCodeAt(0);
							let backet = '{'.charCodeAt(0);

							res.on('data', (d) => {
								var progress = this.state.progress;
								
								var i = 0;

								if (receiving_bar) {
									while (d.length > i && d[i] !== backet) {
										if (d[i] === hash_code) {
											progress += 2; 
										}

										i += 1;
									}

									if (d[i] === backet) {
										receiving_bar = false;
									}
								}

								if (progress !== this.state.progress) {
									this.setState({
										progress: progress
									});
								}

								msg += d.slice(i);
							});

							res.on('end', () => {
								console.log("Computation end");
								if (! this.state.killed)
								{
									var msg_data = JSON.parse(msg);
									var result = "";

									try {
										if (msg.stdout !== "") {
											result = JSON.parse(msg_data.stdout);
											msg_data.stderr = "";
										}
									} catch (e) {}

									if (msg_data.stderr === "") {
										this.setState({ progress: 100 },
											() => {
											document.getElementById("progress_msg").innerHTML =
														"Setting-up plots...";

											sleep(1000).then(() => {
												if (result.data.length === 0) {
													this.setState({
														hasResults: false,
														executing: false
													});

													toast.info("The synthesized set is empty.");
												} else {
													if (result.data[0].flowpipe.length !== 0 &&
														result.data[0].flowpipe[0].length === 0) {
														toast.info("The initial set was empty.");
														this.setState({
															hasResults: false,
															executing: false
														});
													} else {
														this.setState({
															sapoResults: result,
															hasResults: true,
															updateChart: true,
															executing: false
														}, () => {
															downloadFile(JSON.stringify(this.state),
																		 (this.state.projectName !== undefined ? this.state.projectName + "-": "") +
																		 "result.webSapo", "text/plain");
														});
													}
												}
												sleep(500).then(() => {
													document.getElementById("progress").style.display =
														"none";
													this.setState({
														progress: 0,
														killed: false
													});
												});
											});
										});
									} else {
										toast.error(msg_data.stderr);

										this.setState({
											hasResults: false,
											executing: false,
											progress: 0,
											killed: false
										});

										document.getElementById("progress").style.display =
													"none";
									}
								}
							});
						}).on('error', (error) => {
							console.error(error)
							document.getElementById("progress").style.display =
													"none";
							this.setState({
								hasResults: false,
								executing: false,
								killed: false
							});
						});
						req.write(data);
						req.end();
					} // end of the inline function
				); // end of setState
			} // end of else for error in the state input
		}
	};

	stopExecuting = () => {
		this.setState({
			killed: true
		});
		const options = {
			hostname: window.location.hostname,
			port: process.env.REACT_APP_SERVER_PORT,
			path: '/kill'
		}
		http.get(options, (res) => {
			this.setState({ executing: false });
			document.getElementById("progress").style.display = "none";
		});
	};

	resetConfiguration = () => {
		this.setState(initState);
	}

	fetchConfiguration = (configURL) => {
		const that = this;

		if (configURL) {
			fetch(configURL)
			.then(function(response){
				return response.json();
			})
			.then(function(config) {
				that.setState({
					...config,
					tMatrix: math.matrix(config.tMatrix.data),
					parametersMatrix: math.matrix(
						config.parametersMatrix.data
					),
					sapoResults: ("sapoResults" in config ? config.sapoResults : undefined),
					hasResults: ("hasResults" in config ? config.stateFromFile : false),
					updateChart: true
				});
			});
		}
	};

	loadConfiguration = (file) => {
		if (file)
		{
			let reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = (e) => {
				try
				{
					let stateFromFile = JSON.parse(e.target.result);

					if ("reachability" in stateFromFile && stateFromFile.reachability) {
						stateFromFile.task = tasks.reachability;
					} else {
						if ("reachability" in stateFromFile && stateFromFile.synthesis) {
							stateFromFile.task = tasks.synthesis;
						} else {
							stateFromFile.task = tasks.undefined;
						}
					} 
					this.setState(
						{
							...stateFromFile,
							tMatrix: math.matrix(stateFromFile.tMatrix.data),
							parametersMatrix: math.matrix(
								stateFromFile.parametersMatrix.data
							),
							sapoResults: ("sapoResults" in stateFromFile ? stateFromFile.sapoResults : undefined),
							projectName: file.name.replace(/\.[^/.]+$/, ""),
							hasResults: ("hasResults" in stateFromFile ? stateFromFile.stateFromFile : false),
							updateChart: true
						},
						() => {
							console.log(this.state);
						}
					);
				}
				catch (err)
				{
					toast.error(`JSON parsing error: ${err}`);
				}
			};
		}
	};

	saveConfiguration = (proj_extension) => {
		downloadFile(JSON.stringify(this.state),
					 (this.state.projectName !== undefined ? this.state.projectName : "config") + "." +
					 proj_extension, "application/json");
	};

	loadResult = (id) => {
		let file = document.getElementById(id).files[0];
		if (file)
		{
			let reader = new FileReader();
			reader.readAsText(file, "UTF-8");
			reader.onload = (e) => {
				try
				{
					let resultFromFile = JSON.parse(e.target.result);
					this.setState(
						{
							sapoResults: resultFromFile,
							projectName: file.name.replace(/\.[^/.]+$/, ""),
							hasResults: true,
							updateChart: true
						},
						() => {
							console.log(this.state);
						}
					);

					document.getElementById("chart").style.display = "block";
					window.dispatchEvent(new Event('resize'));
				}
				catch (err)
				{
					toast.error(`JSON parsing error: ${err}`);
				}
			};
		}
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
					downloadFile(str, (this.state.projectName !== undefined ? this.state.projectName : "model") + ".sil", "text/plain");
				});
			}).on('error', (error) => {
				toast.error(error);
			});
			req.write(data);
			req.end();
	};

	chooseMethod = () => {
		toast.info("choose");
	};
	
	render() {
		return (
			<>
			<ToastContainer
					position="top-center"
					autoClose={5000}
					hideProgressBar={false}
					newestOnTop
					closeOnClick
					rtl={false}
					pauseOnFocusLoss
					draggable
					pauseOnHover
					theme="colored"
			/>
			<Home
				changeNumberOfIterations={this.changeNumberOfIterations}
				numberOfIterations={this.state.numberOfIterations}
				changeMaxBundleMagnitude={this.changeMaxBundleMagnitude}
				changeMaxParamSplits={this.changeMaxParamSplits}
				maxBundleMagnitude={this.state.maxBundleMagnitude}
				maxParamSplits={this.state.maxParamSplits}
				handleMethodSelection={this.handleMethodSelection}
				//
				task={this.state.task}
				variables={this.state.variables}
				directions={this.state.directions}
				initialDirBoundaries={this.state.initialDirBoundaries}
				parameters={this.state.parameters}
				//
				addCallback={this.addCallback}
				deleteCallback={this.deleteCallback}
				changeName={this.changeName}
				changeDynamics={this.changeDynamics}
				addDirection={this.addDirection}
				changeDirection={this.changeDirection}
				deleteDirection={this.deleteDirection}
				changeRelation={this.changeRelation}
				changeLowerBound={this.changeLowerBound}
				changeUpperBound={this.changeUpperBound}
				changedLowerBound={this.checkLowerBoundAndUpdateConcistency}
				changedUpperBound={this.checkUpperBoundAndUpdateConcistency}
				parametersMatrix={this.state.parametersMatrix}
				//
				logicFormulas={this.state.logicFormulas}
				addLogicFormulaCallback={this.addLogicFormulaCallback}
				updateLogicFormulaCallback={this.updateLogicFormulaCallback}
				deleteLogicFormulaCallback={this.deleteLogicFormulaCallback}
				setCursorPositionForLogicFormula={this.setCursorPositionForLogicFormula}
				injectTextInLogicFormula={this.injectTextInLogicFormula}
				//
				executing={this.state.executing}
				progress={this.state.progress}
				startExecuting={this.startExecuting}
				stopExecuting={this.stopExecuting}
				//
				leftButtonActive={this.state.leftButtonActive}
				rightButtonActive={this.state.rightButtonActive}
				setLeftButtonActive={this.setLeftButtonActive}
				setRightButtonActive={this.setRightButtonActive}
				disabledAddVariable={this.state.disabledAddVariable}
				disabledAddParameter={this.state.disabledAddParameter}
				disabledAddFormula={this.state.disabledAddFormula}
				//
				resetConfiguration={this.resetConfiguration}
				loadConfiguration={this.loadConfiguration}
				saveConfiguration={this.saveConfiguration}
				fetchConfiguration={this.fetchConfiguration}
				loadResult={this.loadResult}
				exportSourceFile={this.exportSourceFile}
				chooseMethod={this.chooseMethod}
				//
				addRowParameterMatrix={this.addRowParameterMatrix}
				deleteRowParameterMatrix={this.deleteRowParameterMatrix}
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
				projectName={this.state.projectName}
				updateChart={this.state.updateChart}
				setUpdated={() => this.setState({updateChart: false})}
				setExecuting={(status) => this.setState({executing: status})}
			/>
			</>
		);
	}
}
