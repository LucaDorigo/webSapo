import React, { Component } from "react";
import { MdClose } from "react-icons/md";
import styles from "./style.module.css";

type Props = {};

export default class LogicRow extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.rowVariable}>
        <MdClose
          size={20}
          className={styles.icon}
          id={this.props.index}
          onClick={() => {
            this.props.deleteLogicFormulaCallback(this.props.index);
          }}
        />
        <input
          className={styles.textInput}
          value={this.props.value}
          type="text"
          id={"Logic" + this.props.index}
          onChange={e => {
            console.log("change");
            this.props.updateLogicFormulaCallback(this.props.index, e);
          }}
          onSelect={e => {
            console.log("select");
            this.props.setCursorPositionForLogicFormula(this.props.index, e);
          }}
        />
      </div>
    );
  }
}
