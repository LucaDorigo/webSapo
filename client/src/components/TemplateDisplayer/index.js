// @flow
import React, { Component } from "react";
import styles from "./style.module.css";

type Props = {};

/**
 * @param tMatrix: the template matrix to display
 * @param updateMatrixElement: callback to modify the value of a specific matrix element
 * @param directions: the direction vector
 */

export default class TemplateDisplayer extends Component<Props> {
  props: Props;

  render() {
    var options = [];

    for (var i=0; i<this.props.directions.length; i++) {
      options.push({label: (i+1), value: i})
    }

    return (
      <div className={styles.rowVariable}>
        {this.props.tMatrix._data.map((itemRow, indexRow) => {
          return (
            <div key={indexRow}>
              {Array.isArray(itemRow) && (
                <div className={styles.flexRow}>
                  {itemRow.map((itemColumn, indexColumn) => {
                    return (
                      <div key={indexColumn}>
                        <select value={itemColumn} onChange={e =>
                            this.props.updateMatrixElement(
                              e,
                              indexRow,
                              indexColumn
                            )}>
                        {options.map((option) => (
                          <option value={option.value} key={option.value}>{option.label}</option>
                        ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
