// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import homestyles from "../Home/style.module.css";
//import { Link } from "react-router-dom";
import { MdClose } from "react-icons/md";

type Props = {};

/**
 * @param name: name of the parameter
 * @param changeName: callback to change the parameter name
 * @param lowerBound: lower bound of the parameter
 * @param changeLowerBound: callback to change the lower bound of the parameter
 * @param upperBound: upper bound of the parameter
 * @param changeUpperBound: callback to change the upper bound of the parameter
 * @param index: index of the parameter in the JSON array
 * @param polytopes: true|false value used in the parameters box to decide method
 * @param deleteCallback: callback to delete parameter
 */

export default class ParameterRows extends Component<Props> {
  props: Props;

  render() {

    return (
      <div>
          <div className={styles.rowVariable}>
          <MdClose
            size={20}
            className={styles.icon}
            onClick={e => this.props.deleteCallback(this.props.index, true)}
          />
            <input
              className={homestyles.equation}
              value={this.props.name}
              onChange={e => this.props.changeName(e, true)}
              type="text"
              id={this.props.index}
            />
            {!this.props.polytopes && (
              <p>in</p>
            )}
            {this.props.polytopes && (
              <p>INITIAL DOMAIN</p>
            )}

              <div className={styles.rowContainer}>
                <input
                  className={homestyles.boundaryInput}
                  value={this.props.lowerBound}
                  onChange={e =>
                    this.props.changeLowerBound(e, true)
                  }
                  type="number"
                  id={this.props.index}
                  pattern="[0-9]+([\.,][0-9]+)?"
                  step="0.0001"
                />
                <p> - </p>
                <input
                  className={homestyles.boundaryInput}
                  value={this.props.upperBound}
                  onChange={e =>
                    this.props.changeUpperBound(e, true)
                  }
                  type="number"
                  id={this.props.index}
                  pattern="[0-9]+([\.,][0-9]+)?"
                  step="0.0001"
                />
              </div>
          </div>
      </div>
    );
  }
}
