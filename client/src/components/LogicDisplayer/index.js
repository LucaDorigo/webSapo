import React, { Component } from "react";
import LogicRow from "../LogicRow/index";
import LogicButtons from "../LogicButtons/index";
import styles from "./style.module.css";

type Props = {};

export default class LogicDisplayer extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.grid_container}>
        <div className={styles.grid_item}>
          <div className={styles.titleBox}>FORMULA DECLARATION</div>

          <div className={styles.grid_container2}>
            <div className={styles.grid_item2}>
              <div className={styles.listBox}>
                {/*generate lines and print the formulas*/}
                {this.props.logicFormulas.map((item, index) => {
                  return (
                    <div key={index}>
                      <LogicRow
                        index={index}
                        updateLogicFormulaCallback={
                          this.props.updateLogicFormulaCallback
                        }
                        deleteLogicFormulaCallback={
                          this.props.deleteLogicFormulaCallback
                        }
                        setCursorPositionForLogicFormula={
                          this.props.setCursorPositionForLogicFormula
                        }
                        value={item}
                      />
                      <hr className={styles.separator} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={styles.grid_item2}>
              <div className={styles.buttonsList}>
                <LogicButtons
                  injectTextInLogicFormula={this.props.injectTextInLogicFormula}
                />
              </div>
            </div>
          </div>

          <div className={styles.buttonBox}>
            <button
              className={styles.button}
              onClick={this.props.addLogicFormulaCallback}
            >
              <p>ADD FORMULA</p>
            </button>
          </div>
          <p className={styles.textNote}>Atom syntax admits the following symbols: +, *, &gt;&#61;, &lt;&#61;, &#61;</p>
          <p className={styles.textNote}>
            ¬ Until formulas, numbers in scientific notation, 
          </p>
          <p className={styles.textNote}>and numbers having more than 6 decimals are not supported</p>
        </div>
        {/*end grid item*/}

        {/*display variables*/}
        <div className={styles.grid_item}>
          <div className={styles.titleBox}>VARIABLES</div>
          {this.props.variables.map((item, index) => {
            if (item.lMatrixExtra === false) {
              // hide the variables added for lMatrixExtra
              return (
                <p key={index} className={styles.text}>
                  {item.name}
                </p>
              );
            }
            return "";
          })}
        </div>
        {/*end grid item for variables */}
      </div>
    );
  }
}
