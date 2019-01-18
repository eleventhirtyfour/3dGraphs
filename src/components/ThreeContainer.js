import React, { Component } from 'react';
//import * as THREE from 'three';
//import {TweenMax, CSSPlugin, ScrollToPlugin, Draggable, Elastic} from "gsap/all";
import ThreeView from "./ThreeView";
import ThreeData from "../data/ThreeData";


class ThreeContainer extends Component{
    render(){
      return(
        <div id='CanvasContainer'>
            <ThreeView data={ThreeData} > </ThreeView>
        </div>
      )
    }
  }
  
  export default ThreeContainer


