// @flow
import React, { Component } from 'react';
import styles from './style.module.css';
import { Link } from 'react-router-dom';

type Props = {};

/**
 * @param leftButtonText: text to display on the left button
 * @param rightButtonText: text to display on the right button
 * @param leftButtonActive: true|false value if the button is active or not
 * @param rightButtonActive: true|false value if the button is active or not
 * @param setLeftButtonActive: callback to activate the button
 * @param setRightButtonActive: callback to activate the button
 */

export default class InlineMenu extends Component<Props> {
    props: Props;

    render() {
        return (
            <div className={styles.headerParameters}>
                <button onClick={this.props.setLeftButtonActive} className={[styles.leftButton, (this.props.leftButtonActive) ? styles.active : ''].join(' ')}>{this.props.leftButtonText}</button>
                <button onClick={this.props.setRightButtonActive} className={[styles.rightButton, (this.props.rightButtonActive) ? styles.active : ''].join(' ')}>{this.props.rightButtonText}</button>
            </div>
        );
    }
}
