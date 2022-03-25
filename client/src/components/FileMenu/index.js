import React, { Component } from "react";
import { Menu, MenuItem, MenuButton,SubMenu, MenuDivider } from '@szhsin/react-menu';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/slide.css';

import generatedGitInfo from '../../generatedGitInfo.json';


import styles from "./style.module.css";

import {MdMenu} from 'react-icons/md';

function examplesURL(name) {
  return ('https://raw.githubusercontent.com/LucaDorigo/webSapo/' 
          + generatedGitInfo.fullGitCommitHash + '/examples/'+name+'.webSapo');
};


export default class FileMenu extends Component {

  fetchExample = (name) => {
    this.props.fetchProject(examplesURL(name));
  };

  // menu without a name
  // key values of the menu item are String
  render() {

    return (
      <Menu menuButton={<MenuButton className={styles.menu}><MdMenu size={30} /></MenuButton>} transition>
        <MenuItem onClick={this.props.resetProject}>Reset Project</MenuItem>
        <MenuItem><label htmlFor="loadConf">Load Project</label></MenuItem>
        <input id="loadConf" type="file" accept={"."+ this.props.projExt} 
            onChange={() => {
												let file = document.getElementById("loadConf").files[0];
												this.props.loadProject(file);}} hidden/>
        <MenuItem onClick={this.props.saveProject}>Save Project</MenuItem>
        <MenuItem onClick={this.props.exportSapo}>Export Sapo SIL</MenuItem>
    <MenuDivider />
        <MenuItem>Plot Sapo Results</MenuItem>
    <MenuDivider />
        <SubMenu label="Examples">
            <MenuItem onClick={() => {this.fetchExample('Ebola');}}>Ebola</MenuItem>
            <MenuItem onClick={() => {this.fetchExample('Influenza-splits');}}>Influenza (with splits)</MenuItem>
        </SubMenu>
        <MenuItem onClick={this.props.about}>About webSapo...</MenuItem>
      </Menu>
    );
  }
}
