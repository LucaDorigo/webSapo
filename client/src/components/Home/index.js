// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import modalStyles from "./modalStyle.module.css";
import ProgressBar from "@ramonak/react-progress-bar";
import RoundedButton from "../RoundedButton/index";
import DropdownMenu from "../DropdownMenu/index";
import FileMenu from "../FileMenu/index";
import VariableRows from "../VariableRows/index";
import ParameterRows from "../ParameterRows/index";
//import InlineMenu from "../InlineMenu/index";
import MatrixDisplayer from "../MatrixDisplayer/index";
import TemplateDisplayer from "../TemplateDisplayer/index";
import DirectionVectorDisplayer from "../DirectionVectorDisplayer/index";
import LogicDisplayer from "../LogicDisplayer/index";
import Chart from "../Chart/index";
//import { black } from "ansi-colors";

import { toast } from 'react-toastify';

import generatedGitInfo from '../../generatedGitInfo.json';

type Props = {};

export default class BoxesPage extends Component<Props> {
	props: Props;

	constructor(props) {
		super(props);
		this.state = {
			isPopoverOpen: false,
			proj_extension: "webSapo"
		};
	}

	render() {
		return (
			<div className={styles.container} data-tid="container">
				<div>
					<div className={styles.header}>
						<div className={styles.marginLeft}>
							{/*menu of selection*/}

							<DropdownMenu
								handleMethodSelection={this.props.handleMethodSelection}
								nameSelectedMenu={this.props.nameSelectedMenu}
							/>
						</div>
						<div className={styles.headerCenter}>
								{this.props.sapoResults === undefined && 
								 (this.props.synthesis || this.props.reachability) &&
								 <div className={styles.buttonBox}>
								 <RoundedButton
								 text={(this.props.synthesis?"Synthesis":"Reachability")+ " Analysis"}
								 parameter={false}
								 callback={() => {
									 document.getElementById("progress").style.display =
												 "block";
									 this.props.startExecuting();
								 }}
								 notClickable={this.props.executing||this.props.disabledAddVariable||
									this.props.disabledAddParameter||this.props.disabledAddFormula}
								 />
								 </div>
								}
								
								{this.props.sapoResults !== undefined && 
								 (this.props.synthesis || this.props.reachability) && <button
									className={styles.chartButton}
									onClick={() => {
										if (this.props.sapoResults.data.length > 0) {
											document.getElementById("chart").style.display = "block";
											window.dispatchEvent(new Event('resize'));
										} else {
											if (this.props.reachability) {
												toast.info("The reachable set is empty", {position: "bottom-center"});
											}
											if (this.props.synthesis) {
												toast.info("The synthesized set is empty", {position: "bottom-center"});
											}
										}
									}}
								>
									<p>Plot</p>
								</button>}
								
							</div>
						<div className={styles.marginRight}>
							<div className={styles.flexEnd}>
							{/* The menu on the top right for load and save*/}
							<FileMenu
								projExt = {this.state.proj_extension}
								resetProject={this.props.resetConfiguration}
								loadProject={this.props.loadConfiguration}
								saveProject={() => {
									this.props.saveConfiguration(this.state.proj_extension);
									this.setState({ isPopoverOpen: false})}}
								exportSapo={() => {
									this.props.exportSourceFile();
									this.setState({ isPopoverOpen: false})}}
								loadResult={(id) => {
									this.props.loadResult(id);
									this.setState({ isPopoverOpen: false})}}
								fetchProject={this.props.fetchConfiguration}
								about={() => {
									this.setState({ isPopoverOpen: false});
									document.getElementById("about").style.display =
										"block";
									window.dispatchEvent(new Event('resize'));}}
							/>
							</div>
						</div>
						{/* end of menu on the top right */}
					</div>
					{/* end of the header*/}

					{this.props.nameSelectedMenu === "Analysis method" && (
						<div className={styles.selectMethodContainer}>
							<p>Select an analysis method from the header menu</p>
						</div>
					)}

					{this.props.nameSelectedMenu !== "Analysis method" && (
						<div className={styles.mainContainer}>
							<div className={styles.main}>
								<div className={styles.grid_container}>
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>Variables and Dynamics Laws</div>

										<div className={styles.listBox}>
											{this.props.variables.map((item, index) => {
												return (
													<div key={index}>
														<VariableRows
															index={index}
															name={item.name}
															dynamics={item.dynamics}
															changeName={this.props.changeName}
															changeDynamics={this.props.changeDynamics}
															deleteCallback={this.props.deleteCallback}
														/>
													</div>
												);
											})}
										</div>

										<div className={styles.buttonBox}>
											<RoundedButton
												text={"New Variable"}
												parameter={false}
												callback={this.props.addCallback}
												notClickable={this.props.disabledAddVariable}
											/>
										</div>
									</div>
									
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Parameters
										</div>
										{/*inline menu selector of the type of parameters*/}
										{/*
										<InlineMenu
											leftButtonText={"Boxes"}
											rightButtonText={"Polytopes"}
											leftButtonActive={this.props.leftButtonActive}
											rightButtonActive={this.props.rightButtonActive}
											setLeftButtonActive={this.props.setLeftButtonActive}
											setRightButtonActive={this.props.setRightButtonActive}
										/>*/}
										{/*printing the parametes of the system*/}
										<div className={styles.listBox}>
											{this.props.parameters.map((item, index) => {
												return (
													<div key={index}>
														<ParameterRows
															index={index}
															name={item.name}
															polytopes={this.props.rightButtonActive}
															lowerBound={item.lowerBound}
															upperBound={item.upperBound}
															changeName={this.props.changeName}
															changeLowerBound={this.props.changeLowerBound}
															changeUpperBound={this.props.changeUpperBound}
															deleteCallback={this.props.deleteCallback}
														/>
													</div>
												);
											})}
										</div>

										<div className={styles.buttonBox}>
											<RoundedButton
												text={"New Parameter"}
												parameter={true}
												callback={this.props.addCallback}
												notClickable={this.props.disabledAddParameter}
											/>
											{this.props.rightButtonActive && (
												<RoundedButton
													text={"Parameter Constraints"}
													parameter={true}
													callback={() => {
														document.getElementById(
															"parameterMatrixModal"
														).style.display = "block";
													}}
												/>
											)}
										</div>
									</div>
								</div>

								<div className={`${this.props.synthesis?styles.grid_container3:styles.grid_container2}`}>
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Bundle Space and Initial Set
										</div>
										<div className={styles.center}>
											<RoundedButton
												text={"Directions and Initial Set"}
												parameter={false}
												notClickable={false}
												callback={() => {
													document.getElementById(
														"DirectionsModal"
													).style.display = "block";
												}}
											/>
											<RoundedButton
													text={"Templates"}
													parameter={false}
													notClickable={false}
													callback={() => {
														document.getElementById(
															"TMatrixModal"
														).style.display = "block";
													}}
												/>
										</div>
									</div>

									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Reachability
										</div>

										<div className={styles.center}>
										{/*selector for iteration of the system*/}
										{ (this.props.synthesis || this.props.reachability) && 
										<div className={styles.simplePaddingLeft}>
											Reachability steps:{" "}
											<input
												onChange={this.props.changeNumberOfIterations}
												value={this.props.numberOfIterations}
												className={styles.textInput}
												type="number"
												name="numberIterations"
												min="1"
												step="1"
											/>
										</div>
										}

										{/*selector for maximum vector magnitude*/}
										{ (this.props.synthesis || this.props.reachability) &&
										<div className={styles.simplePaddingLeft}>
											Max bundle magnitude:{" "}
											<input
												onChange={this.props.changeMaxBundleMagnitude}
												value={this.props.maxBundleMagnitude}
												className={styles.textInput}
												type="number"
												min="0"
												step="0.01"
											/>
										</div>
										}
										</div>
									</div>
									{ this.props.synthesis &&
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Synthesis
										</div>
										<div className={styles.center}>
											<button
												className={styles.logicButton}
												onClick={() => {
													document.getElementById("logicModal").style.display =
														"block";
												}}
											>
												<p>Specification</p>
											</button>
											<div className={styles.simplePaddingLeft}>
												Max parameter splits:{" "}
												<input
													onChange={this.props.changeMaxParamSplits}
													value={this.props.maxParamSplits}
													className={styles.textInput}
													type="number"
													min="0"
													step="1"
												/>
											</div>
										</div>

									</div>
									}
								</div>
							</div>

							{/*footer with buttons*/}
							{/*<div className={styles.footer}>
							</div>*/}
							{/*end footer*/}
						</div>
					)}
				</div>

				{/*modal for showing the parameters matrix*/}
				<div id="parameterMatrixModal" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById(
										"parameterMatrixModal"
									).style.display = "none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
								<h2>PARAMETER MATRIX</h2>
							</div>
						</div>
						<div className={modalStyles.modal_body}>
							<MatrixDisplayer
								updateMatrixElement={this.props.updateMatrixElement}
								matrix={this.props.parametersMatrix}
								list={this.props.parameters}
								parametersModal={true}
								tmatrix={false}
							/>
							{this.props.parameters.length !== 0 && (
								<div>
									<div className={styles.footer}>
										<RoundedButton
											text={"ADD ROW TO MATRIX"}
											parameter={false}
											callback={this.props.addRowParameterMatrix}
											notClickable={false}
										/>
										<RoundedButton
											text={"REMOVE LAST ROW FROM MATRIX"}
											parameter={false}
											callback={this.props.deleteRowParameterMatrix}
											notClickable={false}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				{/*end of the modal matrix*/}

				{/*modal for showing the L matrix*/}
				<div id="DirectionsModal" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("DirectionsModal").style.display =
										"none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
								<h2>Directions and Initial Set</h2>
							</div>
						</div>
						<div className={modalStyles.modal_body}>
							{this.props.variables.length === 0 && <p>No variables inserted</p>}
							{this.props.variables.length > 0 && (
									<DirectionVectorDisplayer
										directions={this.props.directions}
										initialDirBoundaries={this.props.initialDirBoundaries}
										changeRelation={this.props.changeRelation}
										changeLowerBound={this.props.changeLowerBound}
										changeUpperBound={this.props.changeUpperBound}
										variables={this.props.variables}
										changeDirection={this.props.changeDirection}
										deleteDirection={this.props.deleteDirection}
									/>
							)}

							{this.props.variables.length !== 0 && (
								<div>
									<div className={styles.footer}>
										<RoundedButton
											text={"New Direction"}
											parameter={false}
											callback={this.props.addDirection}
											notClickable={false}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				{/*end of the modal L matrix*/}

				{/*start of the modal T matrix*/}
				<div id="TMatrixModal" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("TMatrixModal").style.display =
										"none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
								<h2>Template Matrix</h2>
							</div>
						</div>
						<div className={modalStyles.modal_body}>
							<TemplateDisplayer
								updateMatrixElement={this.props.updateTMatrixElement}
								tMatrix={this.props.tMatrix}
								directions={this.props.directions}
							/>
							{this.props.variables.length !== 0 && (
								<div>
									<div className={styles.footer}>
										<RoundedButton
											text={"ADD ROW TO MATRIX"}
											parameter={false}
											callback={this.props.addRowTMatrix}
											notClickable={false}
										/>
										<RoundedButton
											text={"REMOVE LAST ROW FROM MATRIX"}
											parameter={false}
											callback={this.props.deleteRowTMatrix}
											notClickable={false}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				{/*end of the modal T matrix*/}

				{/*modal for showing the logic formulas*/}
				<div id="logicModal" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									if (!this.props.disabledAddFormula) {
										document.getElementById("logicModal").style.display = "none";
									}
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
								<h2>LOGICS</h2>
							</div>
						</div>

						<div className={modalStyles.modal_body}>
							<LogicDisplayer
								logicFormulas={this.props.logicFormulas}
								addLogicFormulaCallback={this.props.addLogicFormulaCallback}
								updateLogicFormulaCallback={
									this.props.updateLogicFormulaCallback
								}
								deleteLogicFormulaCallback={
									this.props.deleteLogicFormulaCallback
								}
								setCursorPositionForLogicFormula={
									this.props.setCursorPositionForLogicFormula
								}
								injectTextInLogicFormula={this.props.injectTextInLogicFormula}
								variables={this.props.variables}
								disabledAddFormula={this.props.disabledAddFormula}
							/>
						</div>
					</div>
				</div>
				{/*end of the modal for the logic*/}
				
				{/*modal for showing chart*/}
				<div id="chart" className={modalStyles.modal_chart}>
					<div className={modalStyles.modal_content_chart}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("chart").style.display = "none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
							</div>
						</div>

						<div className={modalStyles.modal_body_chart}>
							<Chart
									sapoResults={this.props.sapoResults}
									projectName={this.props.projectName}
									updateChart={this.props.updateChart}
									setUpdated={this.props.setUpdated}
									setExecuting={this.props.setExecuting}
								/>
						</div>
					</div>
				</div>
				{/*end modal for showing chart*/}


				{/*modal for showing the about*/}
				<div id="about" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("about").style.display =
										"none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
						</div>
						<div className={modalStyles.modal_body}>
							<div className={styles.about}>
								<div className={styles.columns}>
								<div className={styles.logo}>
								<img src={require('./logo.png')} alt="webSapo Logo"/>
								</div>
								<div>
								<div><h2><a href="https://github.com/LucaDorigo/webSapo" target="_blank" rel="noopener noreferrer">webSapo</a></h2></div>
								<div>Commit: <code>{generatedGitInfo.gitCommitHash}</code></div>
								<div>
								<div>Luca Dorigo</div>
								<div>Alberto Casagrande</div>
								<div>Alessandro Grisafi</div>
								<div>Gianluca Ermacora</div>
								</div>
								<div><h2><a href="https://github.com/dreossi/sapo" target="_blank" rel="noopener noreferrer">Sapo</a></h2></div>
								<div>
								<div>Tommaso Dreossi</div>
								<div>Alberto Casagrande</div>
								<div>Luca Dorigo</div>
								</div>
								</div>
								</div>
							</div>								
							<div className={styles.bug_report}>Please, report any bug <a href="https://github.com/LucaDorigo/webSapo/issues" target="_blank" rel="noopener noreferrer">here</a> describing the bug itself, mentioning the commit hash <code>{generatedGitInfo.gitCommitHash}</code>, and uploading the JSON configuration file that produced it.</div>
						</div>
					</div>
				</div>
				{/*end of the modal about*/}


				{/*modal for showing the progress bar*/}
				<div id="progress" className={modalStyles.modal_bar}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_body_bar}>
							<div id="progress_msg">
							</div>
							<div className={styles.progress_bar}>
							<ProgressBar completed={this.props.progress} />
							</div>
							<div className={styles.buttonBox}>
								<button
									onClick={this.props.stopExecuting}
									className={styles.stopButton}>
								<p>STOP</p>
								</button>
							</div>
						</div>
					</div>
				</div>
				{/* end progress bar model */}

			</div>
		);
	}
}
