import React, { Component } from "react";
import { MdClose } from "react-icons/md";
import RoundedButton from "../RoundedButton/index";
import styles from "./style.module.css";

type Props = {};

export default class LogicDisplayer extends Component<Props> {
  props: Props;

  // build the option for the selects, set the selected value
  createVariableSelector = () => {
    if (this.props.arrayOptions === undefined) {
      // at launch time
      return "";
    }

    return this.props.arrayOptions.map((item, index) => {
      return (
        <option key={index} value={item}>
          {item}
        </option>
      );
    });
  };

  render() {
    return (
      <div className={styles.grid_container}>
        <div className={styles.grid_item}>
          <form>
            <label>
              <input
                type="radio"
                name="choiceForDrawing"
                value="none"
                checked={this.props.printSettings.drawingSw === "none"}
                onChange={this.props.updatePrintSwSettings}
              />
              None
            </label>

            <label>
              <input
                type="radio"
                name="choiceForDrawing"
                value="matlab"
                checked={this.props.printSettings.drawingSw === "matlab"}
                onChange={this.props.updatePrintSwSettings}
              />
              Matlab
            </label>

            <label>
              <input
                type="radio"
                name="choiceForDrawing"
                value="octave"
                checked={this.props.printSettings.drawingSw === "octave"}
                onChange={this.props.updatePrintSwSettings}
              />
              Octave
            </label>
          </form>

          <div className={styles.listBox}>
            {/*array of 3 select for char printing*/}
            {this.props.printSettings.charts.map((item, index) => {
              // item is an object
              return (
                <React.Fragment key={index}>
                  <div className={styles.rowContainer}>
                    <select
                      name="x_axis"
                      className={styles.select_style}
                      value={item.x_axis}
                      id={index}
                      key={"x" + index} // needed by React
                      onChange={this.props.updatePrintChart}
                    >
                      <option value="" disabled></option>
                      {this.createVariableSelector()}
                    </select>

                    <select
                      name="y_axis"
                      className={styles.select_style}
                      value={item.y_axis}
                      id={index}
                      key={"y" + index} // needed by React
                      onChange={this.props.updatePrintChart}
                    >
                      <option value="" disabled></option>
                      {this.createVariableSelector()}
                    </select>

                    <select
                      name="z_axis"
                      className={styles.select_style}
                      value={item.z_axis}
                      id={index}
                      key={"z" + index} // needed by React
                      onChange={this.props.updatePrintChart}
                    >
                      <option value="" /* not disabled*/></option>
                      {this.createVariableSelector()}
                    </select>

                    <MdClose
                      size={20}
                      className={styles.icon}
                      key={index}
                      onClick={index => {
                        this.props.deletePrintChart(index);
                      }}
                    />
                  </div>
                  <hr className={styles.separator} />
                </React.Fragment>
              );
            })}
            {/*end of map()*/}
          </div>

          <div className={styles.buttonBox}>
            <RoundedButton
              text={"ADD CHART"}
              parameter={false}
              callback={this.props.addPrintChart}
            />
          </div>

          <p className={styles.textNote}>don't mix parameters with variables</p>
        </div>
      </div>
    ); // end return
  }
}
