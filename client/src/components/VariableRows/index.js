// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import { MdClose } from "react-icons/md";

type Props = {};

/**
 * @param name: name of the variable/parameter
 * @param changeName: callback to change the variable/parameter name
 * @param lowerBound: lower bound of the variable/parameter
 * @param changeLowerBound: callback to change the lower bound of the variable/parameter
 * @param upperBound: upper bound of the variable/parameter
 * @param changeUpperBound: callback to change the upper bound of the variable/parameter
 * @param index: index of the variable/parameter in the JSON array
 * @param polytopes: true|false value used in the parameters box to decide method
 * @param parameter: true|false value to distinguish between variables and parameters
 * @param deleteCallback: callback to delete variable/parameter
 * @param boxesMethod:  true|false value used to distinguish method
 * @param polytopesMethod: true|false value used to distinguish method
 * @param parallelotopesMethod: true|false value used to distinguish method
 * @param lMatrixExtra: true|false value to identify variables that are extra added from the lMatrix modal
 */

export default class VariableRows extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        {!this.props.lMatrixExtra && (
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
        )}
      </div>
    );
  }
}
