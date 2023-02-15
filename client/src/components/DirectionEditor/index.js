// @flow
import React, { Component } from "react";
import styles from "./style.module.css";

import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css'

import homestyles from "../Home/style.module.css";
import { MdClose } from "react-icons/md";
import classNames from 'classnames/bind';

import RoundedButton from "../RoundedButton/index";

type Props = {};


const options = [{value: "=", label: "="}, 
                 {value: "in", label: "in"},
                 {value: ">=", label: ">="},
                 {value: "<=", label: "<="}];


let hstyles = classNames.bind(homestyles);

/**
 * @param constraint: the constraint
 * @param index: index of the constraint in the constraint vector
 * @param deleteConstraint: callback to delete a constraint
 * @param changeExpression: callback to change the constraint expression
 * @param	changeRelation changes constraint relation
 * @param	changeLowerBound changes lower constraint boundary
 * @param	changeUpperBound changes upper constraint boundary
 * @param	setLowerBoundChanged checks lower bound and updates upper bound if needed
 * @param	setUpperBoundChanged checks upper bound and updates lower bound if needed
 */
class Constraints extends Component<Props> {
  props: Props;

  render() {
    return (
      <div className={styles.constraint}>
        <MdClose
          size={20}
          className={styles.icon}
          onClick={(e) => {
            this.props.deleteConstraint(this.props.index);}}
        />
        <p className={homestyles.smallFont}>{this.props.index+1}:&nbsp;</p>
        <Tippy content={"Set the direction n."+(this.props.index+1)}>
        <input className={homestyles.equation} 
          type="text"
          value={this.props.constraint.expression}
          onChange={(e) => this.props.changeExpression(e, this.props.index)}
          />
        </Tippy>
        <select onChange={e => {
          this.props.changeRelation(e, this.props.index);
        }}
          value={this.props.constraint.relation}>
          {options.map((option) => (
            <option value={option.value} key={option.value}>{option.label}</option>
          ))}
        </select>
        {(this.props.constraint.relation==="in" || 
          this.props.constraint.relation===">=") &&
        
        <Tippy content={"The initial lower bound for direction \"" + 
          this.props.constraint.expression + "\""}>
        <input
          className={hstyles('boundaryInput', {
            error: this.props.constraint.lb_error
          })}
          value={this.props.constraint.lowerBound}
          onBlur={e => 
            this.props.setLowerBoundChanged(e)
          }
          onChange={e =>
            this.props.changeLowerBound(e)
          }
          type="text"
          id={this.props.index}
        />
        </Tippy>}
        {(this.props.constraint.relation==="=") &&
        
        <Tippy content={"The initial value for direction \"" + 
                         this.props.constraint.expression + "\""}>
        <input
          className={hstyles('boundaryInput', {
            error: this.props.constraint.lb_error
          })}
          value={this.props.constraint.lowerBound}
          onBlur={e => 
            this.props.setLowerBoundChanged(e)
          }
          onChange={e =>
            this.props.changeLowerBound(e)
          }
          type="text"
          id={this.props.index}
        />
        </Tippy>}
        {(this.props.constraint.relation==="in") &&
        <p> - </p>
        }
        {(this.props.constraint.relation==="in" || this.props.constraint.relation==="<=") &&
        <Tippy content={"The initial upper bound for direction \"" + 
                        this.props.constraint.expression + "\""}>
        <input
          className={hstyles('boundaryInput', {
            error: this.props.constraint.ub_error
          })}
          value={this.props.constraint.upperBound}
          onBlur={e => 
            this.props.setUpperBoundChanged(e)
          }
          onChange={e =>
            this.props.changeUpperBound(e)
          }
          type="text"
          id={this.props.index}
        />
        </Tippy>
        }
        <Tippy content={"Make direction \""+this.props.constraint.expression + "\" " +
                        (this.props.constraint.adaptive ? "non-adaptive" : "adaptive")}>
        <input
          id={this.props.index}
          type="checkbox"
          checked={(this.props.constraint.hasOwnProperty('adaptive') ? 
                    this.props.constraint.adaptive : false)}
          onChange={e =>
            this.props.switchAdaptive(e)
          }
          disabled={false}/>
        </Tippy>
    </div>
    );
  }
}

/**
 * @param constraints the constraint vector
 * @param deleteConstraint: callback to delete a constraint
 * @param changeExpression: callback to change the constraint expression
 * @param	changeRelation changes constraint relation
 * @param	changeLowerBound changes lower constraint boundary
 * @param	changeUpperBound changes upper constraint boundary
 * @param	setLowerBoundChanged checks lower bound and updates upper bound if needed
 * @param	setUpperBoundChanged checks upper bound and updates lower bound if needed
 */
export default class ConvexSetSpecifier extends Component<Props> {
  props: Props;

  render() {
    return (
      <div  className={styles.modal_body}>
      <div className={styles.polytopeContainer}>
        {this.props.constraints.map((constraint, index) => {
          return (
            <div key={index} className={styles.constrContainer}>
              <Constraints
                constraint={constraint}
                index={index}
                deleteConstraint={this.props.deleteConstraint}
                changeExpression={this.props.changeExpression}
                changeRelation={this.props.changeRelation}
                changeUpperBound={this.props.changeUpperBound}
                changeLowerBound={this.props.changeLowerBound}
                setLowerBoundChanged={this.props.setLowerBoundChanged}
                setUpperBoundChanged={this.props.setUpperBoundChanged}
                switchAdaptive={this.props.switchAdaptive}
              />
            </div>
          );
        })}
      </div>
      <div>
        <div className={styles.footer}>
          <RoundedButton
            text={"Add Direction"}
            parameter={false}
            callback={this.props.addConstraint}
            notClickable={false}
          />
        </div>
      </div>
      </div>
      /*
      <div className={styles.radio_element}>
      <input id="adaptiveDirections" type="checkbox" 
        defaultChecked={this.props.adaptiveDirections}  
        onChange={e => this.props.changeAdaptiveDirections(e)} 
        disabled={this.state.changed}/>Set direction 
      </div>
      */
    );
  }
}
