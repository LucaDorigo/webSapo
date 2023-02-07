// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import homestyles from "../Home/style.module.css";
//import { Link } from "react-router-dom";
import { MdClose } from "react-icons/md";
import classNames from 'classnames/bind';

import { change_targets } from "../../constants/global";

type Props = {};


let hstyles = classNames.bind(homestyles);

/**
 * @param parameter: parameter
 * @param changeName: callback to change the parameter name
 * @param changeLowerBound: callback to change the lower bound of the parameter
 * @param changeUpperBound: callback to change the upper bound of the parameter
 * @param	setLowerBoundChanged checks lower bound and updates upper bound if needed
 * @param	setUpperBoundChanged checks upper bound and updates lower bound if needed
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
            onClick={e => this.props.deleteCallback(this.props.index, change_targets.parameters)}
          />
            <input
              className={homestyles.equation}
              value={this.props.parameter.name}
              onChange={e => this.props.changeName(e, change_targets.parameters)}
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
                  className={hstyles('boundaryInput', {
                    error: this.props.parameter.lb_error
                  })}
                  value={this.props.parameter.lowerBound}
                  onBlur={e => 
                    this.props.setLowerBoundChanged(e, change_targets.parameters)
                  }
                  onChange={e => 
                    this.props.changeLowerBound(e, change_targets.parameters)
                  }
                  type="text"
                  id={this.props.index}
                />
                <p> - </p>
                <input
                  className={hstyles('boundaryInput', {
                    error: this.props.parameter.ub_error
                  })}
                  value={this.props.parameter.upperBound}
                  onBlur={e => 
                    this.props.setUpperBoundChanged(e, change_targets.parameters)
                  }
                  onChange={e =>
                    this.props.changeUpperBound(e, change_targets.parameters)
                  }
                  type="text"
                  id={this.props.index}
                />
              </div>
          </div>
      </div>
    );
  }
}
