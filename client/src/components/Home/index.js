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
import TemplateDisplayer from "../TemplateDisplayer/index";
import ConvexSetSpecifier from "../ConvexSetSpecifier/index";
import Specification from "../Specification/index";
import ReachSynthPlot from "../ReachSynthPlot/index";
import InvariantPlot from "../InvariantPlot/index";
//import { black } from "ansi-colors";
import { tasks, task_name, change_targets, invariant_results } from "../../constants/global";

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

	analysis_not_ready() {
		return (this.props.executing||this.props.disabledAddVariable||
				this.props.disabledAddParameter||this.props.disabledAddFormula||
				this.props.variables.length===0||
				this.props.initial_set.length===0||
				(this.props.task === tasks.synthesis 
		 		 && this.props.logicFormulas.length===0)||
				(this.props.task === tasks.invariant_validation 
					&& this.props.invariant.length===0));
	}

	render() {
		
		let plot_button_msg = "Plot";

		if (this.props.sapoResults !== undefined && "task" in this.props.sapoResults && 
			this.props.sapoResults.task === tasks.invariant_validation) {
			switch(this.props.sapoResults.result) {
				case invariant_results.proved:
					plot_button_msg += " the invariant proof";
					break;
				case invariant_results.disproved:
					plot_button_msg += " the invariant disproof";
					break;
				case invariant_results.epoch_limit:
					plot_button_msg += " the system flow";
					break;
				default:
					break;
			}
		}

		return (
			<div className={styles.container} data-tid="container">
				<div>
					<div className={styles.header}>
						<div className={styles.marginLeft}>
							{/*menu of selection*/}

							<DropdownMenu
								handleMethodSelection={this.props.handleMethodSelection}
								task={this.props.task}
							/>
						</div>
						<div className={styles.headerCenter}>
							<div className={styles.buttonBox}>
								{this.props.sapoResults === undefined && 
								 this.props.task !== tasks.undefined &&
								 <RoundedButton
									text={task_name(this.props.task)+ " Analysis"}
									parameter={false}
									callback={() => {
										document.getElementById("progress").style.display =
													"block";
										this.props.startExecuting();
									}}
									notClickable={this.analysis_not_ready()}
								 />
								}
								
								{this.props.sapoResults !== undefined && 
								 this.props.task !== tasks.undefined && 
								<RoundedButton
									text={plot_button_msg}
									className={styles.plotButton}
									callback={() => {
										switch(this.props.task) {
											case tasks.reachability:
											case tasks.synthesis:
												if (this.props.sapoResults.data.length > 0) {
													document.getElementById("reach_synth_plot").style.display = "block";
													window.dispatchEvent(new Event('resize'));
												} else {
													let msg;
													switch(this.props.task) {
														case tasks.synthesis:
															msg = "The synthesized set is empty";
															break;
														default:
															msg = "The reachable set is empty";
													}
													toast.info(msg, {position: "bottom-center"});
												}
												break;
											case tasks.invariant_validation:
												document.getElementById("invariant_plot").style.display = "block";
												window.dispatchEvent(new Event('resize'));
												break;
											default:
												break;
										}
									}}
								/> 
								}
								 </div>
								
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

					{this.props.task === tasks.undefined && (
						<div className={styles.selectMethodContainer}>
							<p>Select an analysis method from the header menu</p>
						</div>
					)}

					{this.props.task !== tasks.undefined && (
						<div className={styles.mainContainer}>
							<div className={styles.main}>
								<div className={styles.grid_container}>
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>Variables & Dynamics Laws</div>

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
												parameter={change_targets.variables}
												callback={this.props.addCallback}
												notClickable={this.props.disabledAddVariable}
											/>
										</div>
									</div>
									
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Parameters & Constants
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
															parameter={item}
															polytopes={this.props.rightButtonActive}
															changeName={this.props.changeName}
															changeLowerBound={this.props.changeLowerBound}
															changeUpperBound={this.props.changeUpperBound}
															changedLowerBound={this.props.changedLowerBound}
															changedUpperBound={this.props.changedUpperBound}
															deleteCallback={this.props.deleteCallback}
														/>
													</div>
												);
											})}
										</div>

										<div className={styles.buttonBox}>
											<RoundedButton
												text={"New Parameter"}
												parameter={change_targets.parameters}
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

								<div className={`${this.props.task===tasks.synthesis?
									styles.grid_container3:styles.grid_container2}`}>
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Initial Set & Templates
										</div>
										<div className={styles.center}>
											<RoundedButton
												text={"Initial Set"}
												parameter={false}
												notClickable={false}
												callback={() => {
													document.getElementById(
														"InitialSetModel"
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

									{ (this.props.task === tasks.reachability ||
									   this.props.task === tasks.synthesis) && 
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Reachability
										</div>

										<div className={styles.center}>
										{/*selector for iteration of the system*/}
											<div className={styles.simplePaddingLeft}>
												Reachability steps:{" "}
												<input
													onChange={this.props.changeNumberOfIterations}
													value={this.props.numberOfIterations}
													className={styles.textInput}
													type="number"
													name="numberIterations"
													min="0"
													step="1"
												/>
											</div>

											{/*selector for maximum vector magnitude*/}
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
										</div>
									</div>
									}

									{ this.props.task === tasks.synthesis &&
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Synthesis
										</div>
										<div className={styles.center}>
												<RoundedButton
													text={"Specification"}
													parameter={false}
													callback={() => {
														document.getElementById("logicModal").style.display =
															"block";
														}
													}
												/>
															
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
									{ this.props.task === tasks.invariant_validation &&
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											Invariant Validation
										</div>
										<div className={styles.center}>
												<RoundedButton
													text={"Candidate Invariant"}
													parameter={false}
													callback={() => {
														document.getElementById("invariant").style.display =
															"block";
														}
													}
												/>

											{/* join semantics selector */}			
											<div className={styles.simplePaddingLeft}>
												Join Semantics:{" "}
												<select onChange={this.props.changeKInductionJoin}
													value={this.props.kInductionJoin}>
													<option value="listing">Listing</option>
													<option value="packaging">Packaging</option>
													{/*<option value="merging">Merging</option>*/}
												</select>
											</div>
								
											{/*selector for maximum vector magnitude*/}
											<div className={styles.simplePaddingLeft}>
												Max epoch (0 = forever):{" "}
												<input
													onChange={this.props.changeNumberOfIterations}
													value={this.props.numberOfIterations}
													className={styles.textInput}
													type="number"
													name="numberIterations"
													min="0"
													step="1"
												/>
											</div>
										</div>
										<div className={styles.center}>
											<div className={styles.radio_element}>
												<input id="use_invariant_directions" type="checkbox" defaultChecked={this.props.useInvariantDirections}  onChange={e => this.props.changeUseInvariantDirections(e)} disabled={this.state.changed}/> Use Invariant Directions
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

				{/*modal for showing the L matrix*/}
				<div id="InitialSetModel" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("InitialSetModel").style.display =
										"none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
								<h2>Initial Set</h2>
							</div>
						</div>
						<div className={modalStyles.modal_body}>
							{this.props.variables.length === 0 && <p>No variables inserted</p>}
							{this.props.variables.length > 0 && (
									<ConvexSetSpecifier
										constraints={this.props.initial_set}
										changeRelation={(e, index) => {
											this.props.changeRelation(e, index, change_targets.initial_set);
										}}
										changeExpression={(e, index) => { 
											this.props.changeExpression(e, index, change_targets.initial_set);
										}}
										deleteConstraint={(e) => { 
											this.props.deleteConstraint(e, change_targets.initial_set);
										}}
										changeLowerBound={(e) => {
											this.props.changeLowerBound(e, change_targets.initial_set);
										}}
										changeUpperBound={(e) => {
											this.props.changeUpperBound(e, change_targets.initial_set);
										}}
										changedLowerBound={(e) => {
											this.props.changedLowerBound(e, change_targets.initial_set);
										}}
										changedUpperBound={(e) => {
											this.props.changedUpperBound(e, change_targets.initial_set);
										}}
									/>
							)}

							{this.props.variables.length !== 0 && (
								<div>
									<div className={styles.footer}>
										<RoundedButton
											text={"New Direction"}
											parameter={false}
											callback={() => {
												this.props.addConstraint(change_targets.initial_set);
											}}
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
								directions={this.props.initial_set}
							/>
							{this.props.variables.length !== 0 && (
								<div>
									<div className={styles.footer}>
										<RoundedButton
											text={"Add Template"}
											parameter={false}
											callback={this.props.addRowTMatrix}
											notClickable={false}
										/>
										<RoundedButton
											text={"Remove Last Template"}
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
								<h2>Specification</h2>
							</div>
						</div>

						<div className={modalStyles.modal_body}>
							<Specification
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

				{/*modal for showing the candidate invariant*/}
				<div id="invariant" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									if (!this.props.disabledAddFormula) {
										document.getElementById("invariant").style.display = "none";
									}
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
								<h2>Candidate Invariant</h2>
							</div>
						</div>

						<div className={modalStyles.modal_body}>
							{this.props.variables.length === 0 && <p>No variables inserted</p>}
							{this.props.variables.length > 0 && (
									<ConvexSetSpecifier
										constraints={this.props.invariant}
										changeRelation={(e, index) => {
											this.props.changeRelation(e, index, change_targets.invariant);
										}}
										changeExpression={(e, index) => {
											this.props.changeExpression(e, index, change_targets.invariant);
										}}
										deleteConstraint={(e) => { 
											this.props.deleteConstraint(e, change_targets.invariant);
										}}
										changeLowerBound={(e) => {
											this.props.changeLowerBound(e, change_targets.invariant);
										}}
										changeUpperBound={(e) => {
											this.props.changeUpperBound(e, change_targets.invariant);
										}}
										changedLowerBound={(e) => {
											this.props.changedLowerBound(e, change_targets.invariant);
										}}
										changedUpperBound={(e) => {
											this.props.changedUpperBound(e, change_targets.invariant);
										}}
									/>
							)}

							{this.props.variables.length !== 0 && (
								<div>
									<div className={styles.footer}>
										<RoundedButton
											text={"New Invariant Constraint"}
											parameter={false}
											callback={() => {
												this.props.addConstraint(change_targets.invariant);
											}}
											notClickable={false}
										/>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
				{/*end of the modal for the logic*/}

				{/*modal for showing reachability/synthesis result plot */}
				<div id="reach_synth_plot" className={modalStyles.modal_chart}>
					<div className={modalStyles.modal_content_chart}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("reach_synth_plot").style.display = "none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
							</div>
						</div>

						<div className={modalStyles.modal_body_chart}>
							<ReachSynthPlot
									sapoResults={this.props.sapoResults}
									projectName={this.props.projectName}
									updateChart={this.props.updateChart}
									setUpdated={this.props.setUpdated}
									setExecuting={this.props.setExecuting}
								/>
						</div>
					</div>
				</div>
				{/*end modal for showing reachability/synthesis result plot*/}

				{/*modal for showing invariant validation result plot*/}
				<div id="invariant_plot" className={modalStyles.modal_chart}>
					<div className={modalStyles.modal_content_chart}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("invariant_plot").style.display = "none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
							</div>
						</div>

						<div className={modalStyles.modal_body_chart}>
							<InvariantPlot
									sapoResults={this.props.sapoResults}
									projectName={this.props.projectName}
									updateChart={this.props.updateChart}
									setUpdated={this.props.setUpdated}
									setExecuting={this.props.setExecuting}
								/>
						</div>
					</div>
				</div>
				{/*end modal for showing invariant validation result plot*/}

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
