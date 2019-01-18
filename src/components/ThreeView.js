import React, { Component } from 'react';
import * as dat from 'dat.gui';
import * as THREE from 'three';
import OrbitControls from 'orbit-controls-es6';
import { clamp,find,max} from 'lodash';
//import {TweenLite,Power2} from 'gsap/TweenLite';
import {TweenMax,Power2, Elastic, TimelineLite} from "gsap/TweenMax";


//import {TweenMax, CSSPlugin, ScrollToPlugin, Draggable, Elastic} from "gsap/all";


class ThreeView extends Component{


  constructor(props) {
    super(props);
    this.data= props.data;
    this.canvas = React.createRef();
    this.palette={
      color1: '#FF0000', // CSS string
      color2: [ 12, 54, 71 ], // RGB array
      color3: [ 0, 128, 255, 0.3 ], // RGB with alpha
      color4: { h: 350, s: 0.9, v: 0.3 } // Hue, saturation, value
    }

    this.gui = new dat.GUI();
    this.gui.addColor(this.palette, 'color1');
    this.gui.addColor(this.palette, 'color2');
    this.gui.addColor(this.palette, 'color3');
    this.gui.addColor(this.palette, 'color4');
    this.gui.close();

    this.mouseX = 0; 
    this.mouseY = 0;

    this.currentId =0;
    this.currentNumberOfItems= 0;
    this.visibleLimit = 17;
    this.startPoint= 200;
    this.endPoint = -600
    this.lines = [];
    this.font = null;
    this.level = null;
    this.selectedItem = null;

    this.toolTip = null;

    //this.oldDelta;

  }


  degreesToRadians=(degrees)=>{

    let pi = Math.PI;
    return degrees * (pi/180);

  }

  loadFont=()=>{

    let loader = new THREE.FontLoader();
    loader.load("fonts/optimer_bold.typeface.json", (response) =>{
      this.font= response;
      this.createTexts();
      this.createOneLiner();
      this.level =0;
    })
  }

  componentDidMount = () => {
    THREE.Cache.enabled = true;
    this.createRenderer();
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog( 0x000000, 80, 200 );
    this.camera = new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
    this.camera.position.x = 101;
	  this.camera.position.z = 34;
    this.camera.position.y = 55;

    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;

    this.loadFont();

    this.raycaster = new THREE.Raycaster();
    this.intersects =  null ;
    this.mouse ={};
    
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;
    this.controls.maxDistance = 1500;
    this.controls.minDistance = 0;

    this.createToolTip();
    this.createLights();
    this.createSomeInterface();

    let floorGeometry = new THREE.PlaneGeometry(400,400,1,1);
    let floorMaterial = new THREE.MeshStandardMaterial( {color: 0x66666} );
    let floor = new THREE.Mesh( floorGeometry, floorMaterial );
    floor.rotation.x=this.degreesToRadians(270);
    floor.receiveShadow = true;
    this.scene.add( floor );

    let canvasDom = this.canvas.current;
    canvasDom.appendChild(this.renderer.domElement);
    window.addEventListener("resize",this.resizeHandler,false);

    document.addEventListener( 'mousemove', this.onDocumentMouseMove, false );
    document.addEventListener('mousedown', this.onDocumentMouseDown, false);

    if(canvasDom.addEventListener){
      canvasDom.addEventListener("mousewheel", this.mouseWheelHandler, false);
      canvasDom.addEventListener("DOMMouseScroll", this.mouseWheelHandler, false);
    }else{
      canvasDom.attachEvent("onmousewheel", this.mouseWheelHandler);
    }
    this.addKeyBoardInteraction();
    this.start();
    
  }



  createTexts =() =>{


    // CREATE 3D TEXT

    let text_0  = this.create3DText("10");
    text_0.position.z = 90;
    text_0.rotation.y = this.degreesToRadians(90);
    text_0.position.y= 10;
    text_0.position.x= 14;
    this.scene.add(text_0);

    let text_1  = this.create3DText("20");
    text_1.position.z = 90;
    text_1.rotation.y = this.degreesToRadians(90);
    text_1.position.y= 18;
    text_1.position.x= 14;
    this.scene.add(text_1);

    let text_3  = this.create3DText("30");
    text_3.position.z = 90;
    text_3.rotation.y = this.degreesToRadians(90);
    text_3.position.y= 26;
    text_3.position.x= 14;
    this.scene.add(text_3);

    let text_4  = this.create3DText("40");
    text_4.position.z = 90;
    text_4.rotation.y = this.degreesToRadians(90);
    text_4.position.y= 34;
    text_4.position.x= 14;
    this.scene.add(text_4);

    let text_5  = this.create3DText("50");
    text_5.position.z = 90;
    text_5.rotation.y = this.degreesToRadians(90);
    text_5.position.y= 42;
    text_5.position.x= 14;
    this.scene.add(text_5);


  }

  createFlatText = (txtString,color = 0x006699) =>{

    let shapes = this.font.generateShapes( txtString, 3 );
    let geometry = new THREE.ShapeBufferGeometry( shapes );
    geometry.computeBoundingBox();

    let matLite = new THREE.MeshBasicMaterial( {
      color: color,
      transparent: true,
      opacity: 0.5,
      //side: THREE.DoubleSide
    } );

    //matLite.castShadow = true;

    let text = new THREE.Mesh( geometry, matLite );
    text.castShadow = true;
    return text ;

  }

  create3DText = (textToCreate,size) =>{

    let materials = [
      new THREE.MeshPhongMaterial( { color: 0x66666, flatShading: true } ), // front
      new THREE.MeshPhongMaterial( { color: 0x66666 } ) // side
    ];

    let textGeometry = new THREE.TextGeometry(textToCreate,{

      font: this.font,
      size: 5,
      height: 1,
			curveSegments: 4,
			bevelThickness: 2,
			bevelSize: 1.5,
			bevelEnabled: false
    });

    textGeometry.computeBoundingBox();
    textGeometry.computeVertexNormals();
    
    
    textGeometry = new THREE.BufferGeometry().fromGeometry( textGeometry );
    let textMesh = new THREE.Mesh( textGeometry, materials );

    return textMesh;

  }

  createSomeInterface = () =>{

    for(let i= 0; i<6; i++){

      let levelMaterial = new THREE.MeshBasicMaterial( {
        color: 0x000000,
        transparent: true,
        opacity: 0.1,
        side: THREE.DoubleSide
      } );

      let levelGeometry = new THREE.PlaneGeometry(20,200,1,1);
      let level = new THREE.Mesh( levelGeometry, levelMaterial );
      level.rotation.x=this.degreesToRadians(270);
      level.position.y = 1+i*8;
      this.scene.add(level);

    }

  }


  addKeyBoardInteraction = () =>{
    document.addEventListener("keydown", this.handleKeyDown,false);
  }

  handleKeyDown=(e) =>{

    let keyCode = e.keyCode;

    if(keyCode===39){
      this.currentId++;
      this.currentId=clamp(this.currentId,0,this.currentNumberOfItems-1);
      this.scrollItems();
    }
    if(keyCode===37){
      this.currentId--;
      this.currentId=clamp(this.currentId,0,this.currentNumberOfItems-1);
      this.scrollItems();
    }

  }


  onDocumentMouseMove = (event) =>{

    this.mouseX = ( event.clientX - this.windowHalfX ) * 0.1;
    this.mouseY = ( event.clientY - this.windowHalfY ) * 0.1;

    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    if (this.intersects && this.intersects.length>0){
      



      console.log("intersects are ",this.intersects[0].object.parent.position.z);


      if(this.toolTip && this.level ===0){
        this.toolTip.visible=true;
        this.toolTip.position.z=this.intersects[0].object.parent.position.z+80;
        this.toolTip.position.x=this.intersects[0].object.parent.position.x+20;
        this.toolTip.position.y=this.intersects[0].object.parent.position.y+50;
      
      }
      
      this.intersects[0].object.material.opacity =0.1;
      document.body.style.cursor = "pointer";
     
      
    }else{

      if(this.toolTip){
        this.toolTip.visible=false;
      }


      if(this.lines.length>0 ){

        let container = this.lines[0];
        container.children.forEach(

          (child,i) =>{
            child.userData.mesh.material.opacity=1;
            child.getObjectByName("flatText").material.opacity=0.5;
          }
        );
      }

      document.body.style.cursor = "default";

    }
  }

  onDocumentMouseDown = (event) =>{

    event.preventDefault();
    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


    console.log("this.lines.children is ",this.lines[0].children )
    
    if (this.intersects.length>0){

      if(this.level===0){
        this.zoomIn(this.intersects[0].object.parent.name);
      }else{
        this.zoomOut();
      }

    }else{
     
      console.log("this.lines.children is ",this.lines[0].children )
    }

  }


  zoomIn= (name) => {

    //this.oldDelta

    let container =  this.lines[0].children;
    this.selectedItem = find(container, function(o) { return o.name === name })
    let  delayedPositions = []; 

    this.level=1;

    container.forEach(

      (child,i) =>{
        if(child.name !== name && child.userData.inView === true){

          TweenMax.killTweensOf(child);
          let delayBasedOnPosition = Math.abs(this.selectedItem.position.z-child.position.z)/100;
          delayedPositions.push(delayBasedOnPosition);
          TweenMax.to(child.position, 1, { x: -50 , ease:Power2.easeInOut, delay:delayBasedOnPosition});
        }
      }
    );

    // 1 is the animation tim
    let maxDelay = max(delayedPositions);
    console.log("max delay is ",maxDelay+1);
    setTimeout( ()=>{this.zoomInCamera()},maxDelay*1000);

  
  }


  zoomOut =() =>{

    this.currentId = 0;
    this.zoomOutCamera();
    let containerToRemove = this.lines[1]
    this.scene.remove(containerToRemove);
    containerToRemove =null;
    this.lines.pop();
    this.level= 0;
    this.selectedItem.visible = true;
    let name = this.selectedItem.name;
    let container =  this.lines[0].children;
    container.forEach(

      (child,i) =>{
        if(child.name !== name && child.userData.inView === true){

          TweenMax.killTweensOf(child);
          TweenMax.to(child.position, 1, { x: 0 , ease:Power2.easeInOut, delay:0});
        }
      }
    );


  }



  zoomInCamera = () =>{

    TweenMax.killTweensOf(this.camera);
    TweenMax.to(this.camera.position, 2, { x: 120,z:50 , ease:Power2.easeInOut, delay:0,onComplete:this.createSecondLevel});
    
  }


  createSecondLevel = () =>{

    this.currentId =0;
    let container = new THREE.Group();
    this.selectedItem.visible = false;
    let selectedPosition= this.selectedItem.position;
    let selectedHeight = this.selectedItem.userData.height;
    let selectedItemName = Number(this.selectedItem.name.split("_")[1]);
    // always zero , i am lazy to fill the three data
    let data = this.data[0].elements;
    let depth_ID = "1";

    data.forEach(
      (item,i) =>{  
        
        let green = 0x6BD4C6;
        let lightGreen = 0xB898F8;

        //let color = i %2 ? 0x23190 : 0xe87b00;
        let color = i %2 ? green : lightGreen;
        let userData = {inView:false};

        let child;
        let destinationZ;
        let startZ;

        if (i>=this.visibleLimit){
          destinationZ= this.endPoint;
          child = this.createSingleBar(depth_ID+"_"+i,color,destinationZ,10,item.captions.value/3,6,userData,item.captions.text)
        }else{


          let startZ= selectedPosition.z;
          destinationZ = -i*10;

          userData.inView = true;
          child = this.createSingleBar(depth_ID+"_"+i,color,startZ,10,item.captions.value/3,6,userData,item.captions.text);

          let mesh = child.userData.mesh;
          let flatText = child.getObjectByName("flatText");
          
          //let initialScale = (item.captions.value/3)/selectedHeight;

          mesh.scale.y= selectedHeight;

          TweenMax.to(child.position, 1, { z: destinationZ, ease:Power2.easeOut, delay:0.3});
          TweenMax.to(mesh.scale, 1, { y: child.userData.height , ease:Power2.easeOut, delay:0.1*i});
          TweenMax.to(flatText.position, 1, { y: 5 , ease:Power2.easeOut, delay:0.1*i+0.5});
        }
        container.add(child);
      }

    ); 


   container.position.z=80;
   this.scene.add(container);
   this.lines.push(container);

  }


  zoomOutCamera = () =>{

    TweenMax.killTweensOf(this.camera);
    TweenMax.to(this.camera.position, 2, { x: 101,z:34 , ease:Power2.easeInOut, delay:0});
    
    
  }


  createSingleBar = (id,color,position,width=20,height=20,depth=4,userData,text)=>{


    let container = new THREE.Group();
    let geometry = new THREE.BoxGeometry (width,0,depth);
    let material = this.createMaterial(color);
    let mesh = new THREE.Mesh(geometry,material);
    
    container.add(mesh);

    container.userData = userData;
    container.userData.height = height;
    container.userData.mesh= mesh;
    mesh.castShadow = true;
    container.position.z= position;
    mesh.name="mesh";

    let flatText = this.createFlatText(text,0xfffff);
    flatText.rotation.x = this.degreesToRadians(-90);
    flatText.position.x=20;
    flatText.position.y=-2;
    //flatText.position.z=1;
    flatText.name = "flatText";
    container.add(flatText)

    container.name = id;

    return container;
  }

  createOneLiner = (depth=0,data=this.data) =>{

    this.currentNumberOfItems=  this.data.length;
    let container = new THREE.Group();

    let depth_ID = depth.toString();

    data.forEach(
      (item,i) =>{  
        
        let green = 0x6BD4C6;
        let lightGreen = 0xB898F8;

        let color = i %2 ? 0x23190 : 0xe87b00;
        //let color = i %2 ? green : lightGreen;
        let userData = {inView:false};

        let child;
        let destinationZ;

        if (i>=this.visibleLimit){
          destinationZ= this.endPoint;
          child = this.createSingleBar(depth_ID+"_"+i,color,destinationZ,10,item.captions.value/3,6,userData,item.captions.text)
        }else{
          destinationZ = -i*10;
          userData.inView = true;
          child = this.createSingleBar(depth_ID+"_"+i,color,destinationZ,10,item.captions.value/3,6,userData,item.captions.text)
          let mesh = child.userData.mesh;
          let flatText = child.getObjectByName("flatText");

          TweenMax.to(mesh.scale, 1, { y: child.userData.height , ease:Power2.easeOut, delay:0.1*i});
          TweenMax.to(flatText.position, 1, { y: 5 , ease:Power2.easeOut, delay:0.1*i+0.5});
        }
        container.add(child);
      }

    ); 
   container.position.z=80;
   this.scene.add(container);
   this.lines.push(container);
  }


  scrollItems = () =>{

    let container = this.lines[this.level];

    if(container && container.children && container.children.length>0){
      container.children.forEach(

        (child,i) =>{

          let mesh = child.userData.mesh;
          let flatText = child.getObjectByName("flatText");
  
          TweenMax.killTweensOf(child.position);
          TweenMax.killTweensOf(flatText.position);
          TweenMax.killTweensOf(mesh.scale);
  
          let destination;
          if(i<this.currentId){
            destination = this.startPoint;
            child.userData.inView= false;
            TweenMax.to(child.position, 1, { z: destination , ease:Power2.easeOut, delay:0});
            flatText.position.y=-5;
            mesh.scale.y= 1;
            //TweenMax.to(mesh.scale, 0.4, { y: 1 , ease:Power2.easeOut, delay:0});
          
          }else if ((i>=this.currentId)&&(i<this.currentId+this.visibleLimit)){
            let difference =i- this.currentId;
            destination = -difference*10;
            child.userData.inView= true;
            TweenMax.to(child.position, 1, { z: destination , ease:Power2.easeOut, delay:0});
            TweenMax.to(flatText.position, 1, { y: 5 , ease:Power2.easeOut, delay:0.5});
            TweenMax.to(mesh.scale, 1, { y: child.userData.height , ease:Power2.easeOut, delay:0.5});
  
  
          }else{
            destination = this.endPoint;
            child.userData.inView= false;
            flatText.position.y=-5;
            TweenMax.to(child.position, 1, { z: destination , ease:Power2.easeOut, delay:0});
            mesh.scale.y= 1;
            //TweenMax.to(mesh.scale, 0.4, { y: 1 , ease:Power2.easeOut, delay:0});
            
          }
  
        }
      );
    }
  }


  mouseWheelHandler= (event) =>{
    let e = window.event || event;
    let delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
    this.currentId+=-(delta/10);
    this.currentId = clamp(this.currentId,0,this.currentNumberOfItems-1);
    this.scrollItems();
    return false;
    
  }

  start = () => {
    if (!this.frameId) {
      this.frameId = requestAnimationFrame(this.animate)
    }
  }

  stop = () => {
    cancelAnimationFrame(this.frameId)
  }


  animate = () =>{
  
    this.renderScene();
    this.frameId = window.requestAnimationFrame(this.animate);
  }


  renderScene= () =>{
 
    this.renderer.render(this.scene,this.camera);   
    this.scene.rotation.y = -(  -this.mouseX- this.scene.rotation.y ) * .0025-0.2;

    if(this.lines.length>0){
      this.camera.updateMatrixWorld();
      this.raycaster.setFromCamera( this.mouse, this.camera );

      if(this.lines[0]){
        this.intersects = this.raycaster.intersectObjects( this.lines[0].children,true);
      }

      //this.camera.lookAt(this.lines[0].position)
    }
    
  }


 

  createLights = () =>{

    let hemisphereLight = new THREE.HemisphereLight (0xaaaaaa,0x000000, 0.8);
    let ambientLight = new THREE.AmbientLight( 0x404040 );
    let shadowLight = new THREE.DirectionalLight(0xffffff, 1.0);
    shadowLight.position.set(150, 350, 350);
    shadowLight.castShadow = true;
    shadowLight.shadow.camera.left = -400;
	  shadowLight.shadow.camera.right = 400;
	  shadowLight.shadow.camera.top = 400;
	  shadowLight.shadow.camera.bottom = -400;
	  shadowLight.shadow.camera.near = 1;
	  shadowLight.shadow.camera.far = 1000;
  	shadowLight.shadow.mapSize.width = 2048;
	  shadowLight.shadow.mapSize.height = 2048;
	  this.scene.add(ambientLight);  
    this.scene.add(shadowLight);
    this.scene.add(hemisphereLight);
  }



  resizeHandler = (e) =>{
    this.windowHalfX = window.innerWidth / 2;
    this.windowHalfY = window.innerHeight / 2;
    this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize( window.innerWidth, window.innerHeight );
  }

  createMaterial= (color=0x23190f)=>{

    let material = new THREE.MeshPhongMaterial({color:color,flatShading: true});
    //let material = new THREE.MeshStandardMaterial({color:color});
    material.castShadow = true;
    material.receiveShadow = true;
    return material;
  }


  createRenderer = () =>{
    this.renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.domElement.style.zIndex = 5;
  }

 
  createToolTip = () =>{



    let spriteMap = new THREE.TextureLoader().load( 'andrea.jpg' );
    let spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );
    this.toolTip = new THREE.Sprite( spriteMaterial );
    this.toolTip.scale.set(20, 20, 1);
    //this.toolTip.position.x = 20;
    //this.toolTip.position.y = 20;
    this.toolTip.visible = false;
    this.scene.add( this.toolTip );




 /*    let spriteMap = new THREE.TextureLoader().load('andrea.jpg',
    
    (texture) =>{
      alert("texture loaded");
      let spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, color: 0xffffff } );


    }
  
    ); */


  }

  showToolTip = (position) => {


  }


  render(){
    return(
      <div ref={this.canvas}/>
    )
  }

}
  
export default ThreeView


