/* eslint no-console:0 */
import React, { Component } from "react";
import Menu, { SubMenu, MenuItem, Divider } from "rc-menu";

const reachability = "reachability";
const synthesis = "synthesis";
const boxes = "boxes";
const polytopes = "polytopes";
const parallelotopes = "parallelotopes";

export default class SelectorMenu extends Component {
  constructor(props) {
    super(props);
  }

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
          <SubMenu title={reachability} key={reachability}>
            <MenuItem key={reachability + " " + boxes}>{boxes}</MenuItem>

            <MenuItem key={reachability + " " + parallelotopes}>
              {parallelotopes}
            </MenuItem>

            <MenuItem key={reachability + " " + polytopes}>
              {polytopes}
            </MenuItem>
          </SubMenu>
          <Divider />

          <SubMenu title={synthesis} key={synthesis}>
            <MenuItem key={synthesis + " " + parallelotopes /*polytopes?*/}>
              {" "}
              {parallelotopes}{" "}
            </MenuItem>
          </SubMenu>
        </SubMenu>
      </Menu>
    );
  }
}
