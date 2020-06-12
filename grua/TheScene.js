
// The Model Facade class. The root node of the graph.
class TheScene extends THREE.Scene {
  
  constructor (myCanvas) {
    super();
    
    // Attributes
    this.applicationMode = TheScene.NO_ACTION;    
    this.renderer = this.createRenderer(myCanvas);
    this.gui = this.createGUI ();
    this.mouseDown = false;
    
    this.ambientLight = null;
    this.spotLight = null;
    this.camera = null;
    this.trackballControls = null;
    this.crane = null;
    this.ground = null;
  
    this.createLights ();
    this.createCamera ();
    this.axis = new THREE.AxesHelper (25);
    this.add (this.axis);
    this.model = this.createModel ();

    this.add (this.model);
  }
  
  // It creates the camera and adds it to the graph
  createCamera () {
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set (60, 30, 60);
    var look = new THREE.Vector3 (0,20,0);
    this.camera.lookAt(look);

    this.trackballControls = new THREE.TrackballControls (this.camera, this.renderer.domElement);
    this.trackballControls.rotateSpeed = 5;
    this.trackballControls.zoomSpeed = -2;
    this.trackballControls.panSpeed = 0.5;
    this.trackballControls.target = look;
    
    this.add(this.camera);
  }
  
  createGUI () {
    var that = this;
    var gui = new dat.GUI();
    this.GUIcontrols = new function() {
      this.axis = true;
      this.lightIntensity = 0.5;
      this.rotation = 6;
      this.distance = 10;
      this.height   = 10;
      this.addBox   = function () {
        that.setMessage ("Añadir cajas clicando en el suelo");
        that.applicationMode = TheScene.ADDING_BOXES;
      };
      this.moveBox  = function () {
        that.setMessage ("Mover y rotar cajas clicando en ellas");
        that.applicationMode = TheScene.MOVING_BOXES;
      };
      this.takeBox  = false;
    }
  
    var axisLights = gui.addFolder ('Axis and Lights');
      axisLights.add(this.GUIcontrols, 'axis').name('Axis on/off :');
      axisLights.add(this.GUIcontrols, 'lightIntensity', 0, 1.0).name('Light intensity :');
    
    var actions = gui.addFolder ('Actions');
      var addingBoxes = actions.add (this.GUIcontrols, 'addBox').name (': Adding boxes :');
      var movingBoxes = actions.add (this.GUIcontrols, 'moveBox').name (': Move and rotate boxes :');
      var takingBoxes = actions.add (this.GUIcontrols, 'takeBox').name ('Take the box below');
      takingBoxes.onChange (function (value) {
          if (value) {
            var newHeight = that.takeBox();
            if (newHeight > 0) {
                that.GUIcontrols.height = newHeight;
                that.GUIcontrols.takeBox = true; 
            } else {
                that.GUIcontrols.takeBox = false;  
            }
          } else {
            that.dropBox ();
          }
      });
    
    var craneControls = gui.addFolder ('Crane Controls');
      craneControls.add (this.GUIcontrols, 'rotation', 0, 12, 0.001).name('Rotation :');
      craneControls.add (this.GUIcontrols, 'distance', 0, 50, 0.1).name('Distance :');
      craneControls.add (this.GUIcontrols, 'height', 0, 50, 0.1).name('Height :').listen();
      // The method  listen()  allows the height attribute to be written, not only read
  }
  
  // It creates lights and adds them to the graph
  createLights () {
    // add subtle ambient lighting
    this.ambientLight = new THREE.AmbientLight(0xccddee, 0.35);
    this.add (this.ambientLight);
    
    // add spotlight for the shadows
    this.spotLight = new THREE.SpotLight( 0xffffff, this.GUIcontrols.lightIntensity);
    this.spotLight.position.set( 60, 60, 40 );
    this.spotLight.castShadow = true;
    // the shadow resolution
    this.spotLight.shadow.mapSize.width=2048
    this.spotLight.shadow.mapSize.height=2048;
    this.add (this.spotLight);
  }
  
  // It creates the geometric model: crane and ground
  createModel () {
    var model = new THREE.Object3D()
    this.crane = new Crane({});
    model.add (this.crane);
    var loader = new THREE.TextureLoader();
    var textura = loader.load ("../imgs/wood.jpg");
    this.ground = new Ground (this, 300, 300, new THREE.MeshPhongMaterial ({map: textura}), 4);
    model.add (this.ground);
    return model;
  }
  
  createRenderer (myCanvas) {
    var renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0xEEEEEE), 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    $(myCanvas).append(renderer.domElement);    
    return renderer;  
  }
  
  onMouseDown (event) {
    if (event.ctrlKey) {
      // The Trackballcontrol only works if Ctrl key is pressed
      this.getCameraControls().enabled = true;
    } else {  
      this.getCameraControls().enabled = false;
      if (event.button === 0) {   // Left button
        this.mouseDown = true;
        switch (this.applicationMode) {
          case TheScene.ADDING_BOXES :
            this.addBox (event, TheScene.NEW_BOX);
            break;
          case TheScene.MOVING_BOXES :
            this.moveBox (event, TheScene.SELECT_BOX);
            break;
          default :
            this.applicationMode = TheScene.NO_ACTION;
            break;
        }
      } else {
        this.setMessage ("");
        this.applicationMode = TheScene.NO_ACTION;
      }
    }
  }
  
  onMouseMove (event) {
    if (this.mouseDown) {
      switch (this.applicationMode) {
        case TheScene.ADDING_BOXES :
        case TheScene.MOVING_BOXES :
          this.moveBox (event, TheScene.MOVE_BOX);
          break;
        default :
          this.applicationMode = TheScene.NO_ACTION;
          break;
      }
    }
  }

  onMouseUp (event) {
    if (this.mouseDown) {
      switch (this.applicationMode) {
        case TheScene.ADDING_BOXES :
          this.addBox (event, TheScene.END_ACTION);
          break;
        case TheScene.MOVING_BOXES :
          this.moveBox (event, TheScene.END_ACTION);
          break;
        default :
          this.applicationMode = TheScene.NO_ACTION;
          break;
      }
      this.mouseDown = false;
    }
  }
  
  onMouseWheel (event) {
    if (event.ctrlKey) {
      // The Trackballcontrol only works if Ctrl key is pressed
      this.getCameraControls().enabled = true;
    } else {  
      this.getCameraControls().enabled = false;
      if (this.mouseDown) {
        switch (this.applicationMode) {
          case TheScene.MOVING_BOXES :
            this.moveBox (event, TheScene.ROTATE_BOX);
            break;
        }
      }
    }
  }
  
  onWindowResize () {
    // Este método es llamado cada vez que el usuario modifica el tamapo de la ventana de la aplicación
    // Hay que actualizar el ratio de aspecto de la cámara
    this.setCameraAspect (window.innerWidth / window.innerHeight);
    
    // Y también el tamaño del renderizador
    this.renderer.setSize (window.innerWidth, window.innerHeight);
  }

  setMessage (str) {
    document.getElementById ("Messages").innerHTML = "<h2>"+str+"</h2>";
  }
  
  // It adds a new box, or finish the action
  addBox (event, action) {
    this.ground.addBox(event, action);
  }
  
  // It moves or rotates a box on the ground
  moveBox (event, action) {
    this.ground.moveBox (event, action);
  }
  
  // The crane can take a box
  takeBox () { 
    var box = this.ground.takeBox (this.crane.getHookPosition());
    if (box === null)
      return 0; 
    else 
      return this.crane.takeBox (box); 
    // The retuned height set the new limit to down the hook
  }
  
  // The crane drops its taken box
  dropBox () {
    var box = this.crane.dropBox ();
    if (box !== null) {
      box.position.copy (this.crane.getHookPosition());
      box.position.y = 0;
      this.ground.dropBox (box);
    }
  }
    
  // It returns the camera
  getCamera () {
    return this.camera;
  }
  
  // It returns the camera controls
  getCameraControls () {
    return this.trackballControls;
  }
  
  // It updates the aspect ratio of the camera
  setCameraAspect (anAspectRatio) {
    this.camera.aspect = anAspectRatio;
    this.camera.updateProjectionMatrix();
  }
  
  update () {
    // Este método debe ser llamado cada vez que queramos visualizar la escena de nuevo.
    
    // Literalmente le decimos al navegador: "La próxima vez que haya que refrescar la pantalla, llama al método que te indico".
    // Si no existiera esta línea,  update()  se ejecutaría solo la primera vez.
    requestAnimationFrame(() => this.update())
    
    // Le decimos al renderizador "visualiza la escena que te indico usando la cámara que te estoy pasando"
    this.renderer.render (this, this.getCamera());

    // Se actualizan los elementos de la escena para cada frame
    // Se actualiza la intensidad de la luz con lo que haya indicado el usuario en la gui
    this.spotLight.intensity = this.GUIcontrols.lightIntensity;
    
    // Se muestran o no los ejes según lo que idique la GUI
    this.axis.visible = this.GUIcontrols.axis;
    
    // Se actualiza la posición de la cámara según su controlador
    this.trackballControls.update();
    
    // Se actualiza el resto del modelo
    this.crane.update(this.GUIcontrols);
  }
  
  
}

  // class variables
  
  // Application modes
  TheScene.NO_ACTION = 0;
  TheScene.ADDING_BOXES = 1;
  TheScene.MOVING_BOXES = 2;
  
  // Actions
  TheScene.NEW_BOX = 0;
  TheScene.MOVE_BOX = 1;
  TheScene.SELECT_BOX = 2;
  TheScene.ROTATE_BOX = 3;
  TheScene.END_ACTION = 10;
  
/// La función   main
$(function () {
  
  // Se instancia la escena pasándole el  div  que se ha creado en el html para visualizar
  var scene = new TheScene("#WebGL-output");

  // Se añaden los listener de la aplicación. En este caso, el que va a comprobar cuándo se modifica el tamaño de la ventana de la aplicación.
  window.addEventListener ("resize", () => scene.onWindowResize());
  window.addEventListener ("mousemove", (event) => scene.onMouseMove(event), true);
  window.addEventListener ("mousedown", (event) => scene.onMouseDown(event), true);
  window.addEventListener ("mouseup", (event) => scene.onMouseUp(event), true);
  window.addEventListener ("mousewheel", (event) => scene.onMouseWheel(event), true);   // For Chrome an others
  window.addEventListener ("DOMMouseScroll", (event) => scene.onMouseWheel(event), true); // For Firefox
  
  // Que no se nos olvide, la primera visualización.
  scene.update();
});



