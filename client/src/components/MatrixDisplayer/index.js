// @flow
import React, { Component } from "react";
import styles from "./style.module.css";
import * as math from "mathjs";

type Props = {};

/**
 * @param matrix: matrix to display
 * @param updateMatrixElement: callback to modify the value of a specific matrix element
 * @param list: list containing all the info about the parameters/variables to display
 * @param parametersModal: boolean used to understand what info tho show or hide
 */

export default class MatrixDisplayer extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.rowVariable}>
        {this.props.matrix._data.map((itemRow, indexRow) => {
          return (
            <div key={indexRow}>
              {Array.isArray(itemRow) && (
                <div className={styles.flexRow}>
                  {itemRow.map((itemColumn, indexColumn) => {
                    return (
                      <div key={indexColumn}>
                        {indexRow === 0 && this.props.parametersModal && (
                          <div>
                            {this.props.list[indexColumn] !== undefined && (
                              <p>{this.props.list[indexColumn].name}</p>
                            )}
                            {this.props.list[indexColumn] === undefined && (
                              <p>Boundaries</p>
                            )}
                          </div>
                        )}
                        {indexRow === 0 && !this.props.parametersModal && (
                          <p>{this.props.list[indexColumn].name}</p>
                        )}
                        <input
                          key={indexColumn}
                          onChange={e =>
                            this.props.updateMatrixElement(
                              e,
                              indexRow,
                              indexColumn,
                              indexColumn === itemRow.length - 1,
                              this.props.parametersModal
                            )
                          }
                          value={
                            indexColumn !== itemRow.length - 1 ||
                            indexRow >= this.props.list.length * 2 ||
                            !this.props.parametersModal
                              ? itemColumn
                              : indexRow % 2 === 0
                              ? this.props.list[math.floor(indexRow / 2)]
                                  .lowerBound
                              : this.props.list[math.floor(indexRow / 2)]
                                  .upperBound
                          }
                          disabled={
                            indexColumn !== itemRow.length - 1 &&
                            indexRow < this.props.list.length * 2 &&
                            this.props.parametersModal
                              ? true
                              : false
                          }
                          className={styles.matrixElement}
                          type="number"
                          pattern="[0-9]+([\.,][0-9]+)?"
                          step="0.0001"
                          name="matrixElement"
                          id={indexColumn}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {!Array.isArray(itemRow) && <p>No parameters inserted</p>}
            </div>
          );
        })}
      </div>
    );
  }
}
