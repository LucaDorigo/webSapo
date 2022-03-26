// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import { MdClose } from "react-icons/md";

type Props = {};

/**
 * @param name: name of the variable/parameter
 * @param dynamics: variable dynamics
 * @param changeName: callback to change the variable name
 * @param changeDynamics: callback to change the variable dynamics
 * @param index: index of the variable/parameter in the JSON array
 * @param deleteCallback: callback to delete variable
 */

export default class VariableRows extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
          <div className={styles.rowVariable}>
            <MdClose
              size={20}
              className={styles.icon}
              onClick={(e) => this.props.deleteCallback(this.props.index, false)}
            />
            <input
              className={styles.name}
              value={this.props.name}
              onChange={(e) => this.props.changeName(e, false)}
              type="text"
              id={this.props.index}
            />
            <p className={styles.smallFont}>{this.props.name}(k+1)&nbsp;=</p>
            <input className={styles.dynamics} 
              type="text"
              value={this.props.dynamics}
              onChange={(e) => this.props.changeDynamics(e, false)}
              id={this.props.index}
              />
          </div>
      </div>
    );
  }
}
