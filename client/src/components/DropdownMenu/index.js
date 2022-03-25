/* eslint no-console:0 */
import React, { Component } from "react";
import Menu, { SubMenu, MenuItem } from "rc-menu";

const reachability = "reachability";
const synthesis = "synthesis";

export default class SelectorMenu extends Component {
  /*
  constructor(props) {
    super(props);
  }
  */

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
        <SubMenu title={this.props.nameSelectedMenu}>
          <MenuItem key={reachability}>{reachability}</MenuItem>
          <MenuItem key={synthesis}>{synthesis}</MenuItem>
        </SubMenu>
      </Menu>
    );
  }
}
