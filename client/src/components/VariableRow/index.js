// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import { Link } from "react-router-dom";
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

export default class VariableRow extends Component<Props> {
  props: Props;

  render() {
    return (
      <div>
        {!this.props.lMatrixExtra && (
          <div className={styles.rowVariable}>
            <p className={styles.smallFont}>NAME</p>
            <input
              className={styles.textInput}
              value={this.props.name}
              onChange={e => this.props.changeName(e, this.props.parameter)}
              type="text"
              id={this.props.index}
            />
            {this.props.boxesMethod && !this.props.parameter && (
              <p>INITIAL OFFSET</p>
            )}
            {(this.props.parallelotopesMethod || this.props.polytopesMethod) &&
              !this.props.parameter && (
                <p>DOMAIN DECLARATION INSIDE MODIFY L MATRIX MODAL</p>
              )}
            {!this.props.polytopes && this.props.parameter && (
              <p>INITIAL OFFSET</p>
            )}
            {this.props.polytopes && this.props.parameter && (
              <p>INITIAL DOMAIN</p>
            )}

            {((!this.props.polytopesMethod &&
              !this.props.parallelotopesMethod) ||
              this.props.parameter) && (
              <div className={styles.rowContainer}>
                <input
                  className={styles.textInput}
                  value={this.props.lowerBound}
                  onChange={e =>
                    this.props.changeLowerBound(e, this.props.parameter)
                  }
                  type="number"
                  id={this.props.index}
                  pattern="[0-9]+([\.,][0-9]+)?"
                  step="0.0001"
                />
                <p> - </p>
                <input
                  className={styles.textInput}
                  value={this.props.upperBound}
                  onChange={e =>
                    this.props.changeUpperBound(e, this.props.parameter)
                  }
                  type="number"
                  id={this.props.index}
                  pattern="[0-9]+([\.,][0-9]+)?"
                  step="0.0001"
                />
              </div>
            )}

            <MdClose
              size={20}
              className={styles.icon}
              id={this.props.index}
              onClick={e => this.props.deleteCallback(e, this.props.parameter)}
            />
          </div>
        )}
      </div>
    );
  }
}
