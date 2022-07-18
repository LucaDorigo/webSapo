/* eslint no-console:0 */
import React, { Component } from "react";
import Menu, { SubMenu, MenuItem } from "rc-menu";
import { tasks, task_name } from "../../constants/global";

export default class SelectorMenu extends Component {

  // menu without a name
  // key values of the menu item are String
  render() {
    const { triggerSubMenuAction } = this.props;
    return (
      <Menu
        mode="vertical"
        onSelect={this.props.handleMethodSelection}
        triggerSubMenuAction={triggerSubMenuAction}
      >
        <SubMenu title={task_name(this.props.task)}>
          <MenuItem key={tasks.reachability}>{task_name(tasks.reachability)}</MenuItem>
          <MenuItem key={tasks.synthesis}>{task_name(tasks.synthesis)}</MenuItem>
          <MenuItem key={tasks.invariant_validation}>{task_name(tasks.invariant_validation)}</MenuItem>
        </SubMenu>
      </Menu>
    );
  }
}
