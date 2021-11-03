// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import modalStyles from "./modalStyle.module.css";
import RoundedButton from "../RoundedButton/index";
import DropdownMenu from "../DropdownMenu/index";
import VariableRow from "../VariableRow/index";
import EquationRow from "../EquationRow/index";
import InlineMenu from "../InlineMenu/index";
import MatrixDisplayer from "../MatrixDisplayer/index";
import LogicDisplayer from "../LogicDisplayer/index";
import Chart from "../Chart/index";
import Popover from "react-tiny-popover";
//import { black } from "ansi-colors";
import { MdMenu } from "react-icons/md";
import PulseLoader from "react-spinners/PulseLoader";

import generatedGitInfo from '../../generatedGitInfo.json';

type Props = {};

export default class BoxesPage extends Component<Props> {
	props: Props;

	constructor(props) {
		super(props);
		this.state = {
			isPopoverOpen: false
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

							{/*selector for iteration of the system*/}
							<div className={styles.simplePaddingLeft}>
								Number of iterations:{" "}
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

							{/*selector for maximum number of parameter splits*/}
							<div className={styles.simplePaddingLeft}>
								Max parameter splits:{" "}
								<input
									onChange={this.props.changeMaxParamSplits}
									value={this.props.maxParamSplits}
									className={styles.textInput}
									type="number"
									name="numberIterations"
									min="0"
									step="1"
								/>
							</div>
						</div>

						<div className={styles.flexEnd}>
							{/* The menu on the top right for load and save*/}
							<Popover
								isOpen={this.state.isPopoverOpen}
								position={"bottom"}
								padding={0}
								onClickOutside={() => this.setState({ isPopoverOpen: false })} // close popover
								containerClassName={styles.menuContainer}
								content={(
									{ position, nudgedLeft, nudgedTop, targetRect, popoverRect } // you can also provide a render function that injects some useful stuff!
								) => (
									<div style={{ padding: 10 }}>
										<p
											className={styles.menuElement}
										>
											<label
												className={styles.menuElement}
												for={styles.file}
											>
												Load configuration from file
											</label>
										</p>
										<input id={styles.file} type="file" onChange={() => {
												this.props.loadConfiguration(styles.file);
												this.setState({ isPopoverOpen: false})}}/>
										<p
											className={styles.menuElement}
											onClick={() => {
													this.props.saveConfiguration();
													this.setState({ isPopoverOpen: false})}
												}
										>
											Save current configuration
										</p>
										<p
											className={styles.menuElement}
											onClick={() => {
													this.props.exportSourceFile();
													this.setState({ isPopoverOpen: false})}
												}
										>
											Export model file
										</p>
										<p
											className={styles.menuElement}
											onClick={() => {
												this.setState({ isPopoverOpen: false});
												document.getElementById("about").style.display =
													"block";
												window.dispatchEvent(new Event('resize'));
											}}
										>
										About webSapo...
										</p>
									</div>
								)}
							>
								{/* end of the opening popover tag */}
								<MdMenu
									className={styles.icon}
									size={30}
									onClick={() => this.setState({ isPopoverOpen: true })}
								/>
							</Popover>
						</div>
						{/* end of menu on the top right */}
					</div>
					{/* end of the header*/}

					{this.props.nameSelectedMenu === "Method of analysis" && (
						<div className={styles.selectMethodContainer}>
							<p>Select a method of analysis from the header menu</p>
						</div>
					)}

					{this.props.nameSelectedMenu !== "Method of analysis" && (
						<div className={styles.mainContainer}>
							<div className={styles.main}>
								<div className={styles.grid_container}>
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>VARIABLE DECLARATIONS</div>

										<div className={styles.listBox}>
											{this.props.variables.map((item, index) => {
												return (
													<div key={index}>
														<VariableRow
															index={index}
															name={item.name}
															lowerBound={item.lowerBound}
															upperBound={item.upperBound}
															lMatrixExtra={item.lMatrixExtra}
															polytopes={false}
															parameter={false}
															changeName={this.props.changeName}
															changeLowerBound={this.props.changeLowerBound}
															changeUpperBound={this.props.changeUpperBound}
															deleteCallback={this.props.deleteCallback}
															boxesMethod={this.props.boxesMethod}
															polytopesMethod={this.props.polytopesMethod}
															parallelotopesMethod={
																this.props.parallelotopesMethod
															}
														/>
														{!item.lMatrixExtra && (
															<hr className={styles.separator} />
														)}
													</div>
												);
											})}
										</div>

										<div className={styles.buttonBox}>
											<RoundedButton
												text={"ADD VARIABLE"}
												parameter={false}
												callback={this.props.addCallback}
												notClickable={this.props.disabledAddVariable}
											/>
										</div>
									</div>

									<div className={styles.grid_item}>
										<div className={styles.titleBox}>
											PARAMETER DECLARATIONS
										</div>
										{/*inline menu selector of the type of parameters*/}
										<InlineMenu
											leftButtonText={"BOXES"}
											rightButtonText={"POLYTOPES"}
											leftButtonActive={this.props.leftButtonActive}
											rightButtonActive={this.props.rightButtonActive}
											setLeftButtonActive={this.props.setLeftButtonActive}
											setRightButtonActive={this.props.setRightButtonActive}
										/>
										{/*printing the parametes of the system*/}
										<div className={styles.listBox}>
											{this.props.parameters.map((item, index) => {
												return (
													<div key={index}>
														<VariableRow
															index={index}
															name={item.name}
															polytopes={this.props.rightButtonActive}
															parameter={true}
															lowerBound={item.lowerBound}
															upperBound={item.upperBound}
															changeName={this.props.changeName}
															changeLowerBound={this.props.changeLowerBound}
															changeUpperBound={this.props.changeUpperBound}
															deleteCallback={this.props.deleteCallback}
															boxesMethod={this.props.boxesMethod}
															polytopesMethod={this.props.polytopesMethod}
															parallelotopesMethod={
																this.props.parallelotopesMethod
															}
														/>
														<hr className={styles.separator} />
													</div>
												);
											})}
										</div>

										<div className={styles.buttonBox}>
											<RoundedButton
												text={"ADD PARAMETER"}
												parameter={true}
												callback={this.props.addCallback}
												notClickable={this.props.disabledAddParameter}
											/>
											{this.props.rightButtonActive && (
												<RoundedButton
													text={"SHOW MATRIX"}
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
									{/*printing the equations of the system*/}
									<div className={styles.grid_item}>
										<div className={styles.titleBox}>SYSTEM OF EQUATIONS</div>
										<div className={styles.listBox}>
											{this.props.equations.map((item, index) => {
												return (
													<EquationRow
														key={index}
														index={index}
														variableName={item.variableName}
														equation={item.equation}
														updateEquation={this.props.updateEquation}
													/>
												);
											})}
										</div>
									</div>

									{!this.props.boxesMethod && (
										<div className={styles.grid_item}>
											<div className={styles.titleBox}>
												MODIFY APPROXIMATION METHOD MATRIX
											</div>
											<div className={styles.center}>
												<RoundedButton
													text={"MODIFY L MATRIX"}
													parameter={false}
													notClickable={false}
													callback={() => {
														document.getElementById(
															"lMatrixModal"
														).style.display = "block";
													}}
												/>
												{this.props.polytopesMethod && (
													<RoundedButton
														text={"MODIFY T MATRIX"}
														parameter={false}
														notClickable={false}
														callback={() => {
															document.getElementById(
																"TMatrixModal"
															).style.display = "block";
														}}
													/>
												)}
											</div>
										</div>
									)}
								</div>
							</div>

							{/*footer with buttons*/}
							<div className={styles.footer}>
								{/*conditional button*/}
								{this.props.synthesis && (
									<button
										className={styles.logicButton}
										onClick={() => {
											document.getElementById("logicModal").style.display =
												"block";
										}}
									>
										<p>TEMPORAL LOGIC</p>
									</button>
								)}

								<button
									onClick={this.props.startExecuting}
									disabled={this.props.executing}
									className={styles.startButton}
								>
									{!this.props.executing && <p>EXECUTE</p>}
									{this.props.executing && (
										<PulseLoader
											sizeUnit={"px"}
											size={5}
											color={"#fff"}
											loading={this.props.executing}
										/>
									)}
								</button>

								<button
									onClick={this.props.stopExecuting}
									className={styles.stopButton}
								>
									<p>STOP</p>
								</button>
								
								
								{this.props.sapoResults !== undefined && <button
									className={styles.chartButton}
									onClick={() => {
										document.getElementById("chart").style.display =
											"block";
										window.dispatchEvent(new Event('resize'));
									}}
								>
									<p>PLOTS</p>
								</button>}
								
							</div>
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
				<div id="lMatrixModal" className={modalStyles.modal}>
					<div className={modalStyles.modal_content}>
						<div className={modalStyles.modal_header}>
							<span
								onClick={() => {
									document.getElementById("lMatrixModal").style.display =
										"none";
								}}
								className={modalStyles.close}
							>
								&times; {/*X in HTML*/}
							</span>
							<div className={modalStyles.flexRow}>
								<h2>L MATRIX</h2>
							</div>
						</div>
						<div className={modalStyles.modal_body}>
							{this.props.variables.length === 0 && <p>No variables inserted</p>}
							{this.props.variables.length > 0 && (
								<div className={styles.flexRow}>
									<MatrixDisplayer
										updateMatrixElement={this.props.updateMatrixElement}
										matrix={this.props.lMatrix}
										list={this.props.variables}
										parametersModal={false}
									/>
									{(this.props.polytopesMethod ||
										this.props.parallelotopesMethod) && (
										<div>
											<p>Domain declaration</p>
											{this.props.variables.map((item, index) => {
												return (
													<div key={index} className={styles.flexRowDomain}>
														<input
															className={styles.textInput}
															value={item.lowerBound}
															onChange={e =>
																this.props.changeLowerBound(e, false)
															}
															type="number"
															id={index}
															pattern="[0-9]+([\.,][0-9]+)?"
															step="0.0001"
														/>
														<p> - </p>
														<input
															className={styles.textInput}
															value={item.upperBound}
															onChange={e =>
																this.props.changeUpperBound(e, false)
															}
															type="number"
															id={index}
															pattern="[0-9]+([\.,][0-9]+)?"
															step="0.0001"
														/>
													</div>
												);
											})}
										</div>
									)}
								</div>
							)}

							{this.props.variables.length !== 0 && this.props.polytopesMethod && (
								<div>
									<div className={styles.footer}>
										<RoundedButton
											text={"ADD ROW TO MATRIX"}
											parameter={false}
											callback={this.props.addRowLMatrix}
											notClickable={false}
										/>
										<RoundedButton
											text={"REMOVE LAST ROW FROM MATRIX"}
											parameter={false}
											callback={this.props.deleteRowLMatrix}
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
								<h2>T MATRIX</h2>
							</div>
						</div>
						<div className={modalStyles.modal_body}>
							<MatrixDisplayer
								updateMatrixElement={this.props.updateTMatrixElement}
								matrix={this.props.tMatrix}
								list={this.props.variables}
								parametersModal={false}
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
									document.getElementById("logicModal").style.display = "none";
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
									sapoParams={this.props.sapoParams}
									variables={this.props.variables}
									parameters={this.props.parameters}
									updateChart={this.props.updateChart}
									setUpdated={this.props.setUpdated}
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
			</div>
		);
	}
}
