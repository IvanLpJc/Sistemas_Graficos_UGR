 
// En esta ocasión, la escena es física y deriva de Physijs.Scene

class MyPhysiScene extends Physijs.Scene {
  constructor (myCanvas) {
    
    // El gestor de hebras
    Physijs.scripts.worker = './physijs/physijs_worker.js'
    // El motor de física de bajo nivel, en el cual se apoya Physijs
    Physijs.scripts.ammo   = './ammo.js'
    
    // Las dos líneas anteriores DEBEN ejecutarse antes de inicializar Physijs.Scene. En este caso, antes de llamar a super
    super();
    
    // Lo primero, crear el visualizador, pasándole el lienzo sobre el que realizar los renderizados.
    this.createRenderer(myCanvas);
    
    // Se establece el valor de la gravedad, negativo, los objetos caen hacia abajo
    this.setGravity (new THREE.Vector3 (0, -10, 0));
    
    // Para almacenar las figuras que caen
    this.boxes = [];
    this.spheres = [];
    this.todos = [];
    
    // Raycaster que se usará para elegir (pick) las figuras para impulsarlas
    this.raycaster = new THREE.Raycaster();
    
    // Se crea la gui
    this.createGUI ();
    
    // Construimos los distinos elementos que tendremos en la escena
    
    // Se crean y añaden luces a la escena
    this.createLights ();
    
    // Tendremos una cámara con un control de movimiento con el ratón
    this.createCamera ();
    
    // IMPORTANTE: Los elementos que se desee sean tenidos en cuenta en la FISICA deben colgar DIRECTAMENTE de la escena. NO deben colgar de otros nodos.
    
    // Un suelo 
    this.createGround ();
    
    // Unas cajas que van a caer
    this.createBoxes (MyPhysiScene.MAXBOXES);
  }
  
  createRenderer (myCanvas) {
    // Se recibe el lienzo sobre el que se van a hacer los renderizados. Un div definido en el html.
    
    // Se instancia un Renderer   WebGL
    this.renderer = new THREE.WebGLRenderer();
    
    // Se establece un color de fondo en las imágenes que genera el render
    this.renderer.setClearColor(new THREE.Color(0xEEEEEE), 1.0);
    
    // Se establece el tamaño, se aprovecha la totalidad de la ventana del navegador
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // La visualización se muestra en el lienzo recibido
    $(myCanvas).append(this.renderer.domElement);
  }
  
  /// Método que actualiza la razón de aspecto de la cámara y el tamaño de la imagen que genera el renderer en función del tamaño que tenga la ventana
  onWindowResize () {
    this.setCameraAspect (window.innerWidth / window.innerHeight);
    this.renderer.setSize (window.innerWidth, window.innerHeight);
  }

  // Se procesa, o el movimiento de cámara, con Ctrl; o los impulsos a las figuras.
  onMouseDown (event) {
    if (event.ctrlKey) {
      // Para hacer órbita hay que mantener pulsado Ctrl
      this.cameraControl.enabled = true;
    } else {
      this.cameraControl.enabled = false;
      // Se usa el clic para impulsar cajas y esferas
      this.pushBox (event);
    }
  }

  createBoxes (n) {
    var element = null;
    for (var i = 0; i < n; i++) {
      // Una figura física se crea a partir de una geometría de THREE y un material físico. También hay que ponerle una masa a la caja.
      // Si la masa es 0, a la caja NO le afecta la gravedad.
      // Cuanto más ligera sea más se moverá en un rebote.
      // El material físico se crea a partir de un material THREE, dándole una capacidad de rozamiento y de rebote.
      if (Math.random() < MyPhysiScene.PROBBOX) { // Se crean cajas o esferas aleatoriamente
        element = new Physijs.BoxMesh (   // Caja física
          new THREE.BoxGeometry (1,1,1),   // Caja de Three
          Physijs.createMaterial (   // Material físico
            // Las figuras se crean en modo alambre, cuando colisionen con el suelo cambiarán a color sólido
            new THREE.MeshLambertMaterial ({color: 0xFFFFFF * Math.random(),  wireframe: true}),   // Material de Three
            0.1, 0.9),   // Rozamiento y rebote
          1.0   // Masa
        );
        element.scale.set(Math.random()+0.5, Math.random()+0.5, Math.random()+0.5);   // Tamaño final aleatorio
        this.boxes.push(element);      
        this.todos.push(element);
      } else {   // Con la esfera se hace lo mismo
        element = new Physijs.SphereMesh (
          new THREE.SphereGeometry (Math.random()*0.5 + 0.25),
          Physijs.createMaterial (
            new THREE.MeshLambertMaterial ({color: 0xFFFFFF * Math.random(), wireframe: true}), 
            0.5, 0.7),
          1.0
        );    
        this.spheres.push(element);
        this.todos.push(element);
      }
      // Las figuras empiezan en el aire en una posición aleatoria
      element.position.set (Math.random()*10-5, Math.random()*4+10, Math.random()*10-5);
      element.rotation.set (Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2);

      // A las figuras se le añaden un atributo  colisionable  para indicar que estas figuras son colisionables
      element.colisionable = true;
      // Las figuras con física deben estar DIRECTAMENTE colgadas en la escena.
      this.add (element);
    }
  }
  
  createCamera () {
    // Para crear una cámara le indicamos
    //   El ángulo del campo de visión en grados sexagesimales
    //   La razón de aspecto ancho/alto
    //   Los planos de recorte cercano y lejano
    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    // También se indica dónde se coloca
    this.camera.position.set (20, 10, 20);
    // Y hacia dónde mira
    var look = new THREE.Vector3 (0,0,0);
    this.camera.lookAt(look);
    this.add (this.camera);
    
    // Para el control de cámara usamos una clase que ya tiene implementado los movimientos de órbita
    this.cameraControl = new THREE.TrackballControls (this.camera, this.renderer.domElement);
    // Se configuran las velocidades de los movimientos
    this.cameraControl.rotateSpeed = 5;
    this.cameraControl.zoomSpeed = -2;
    this.cameraControl.panSpeed = 0.5;
    // Debe orbitar con respecto al punto de mira de la cámara
    this.cameraControl.target = look;
  }
  
  createGround () {
    // Una figura es un Mesh
    // Un Mesh se compone de geometría y material
    var geometry = new THREE.BoxGeometry (35,0.2,35);
    // Las primitivas básicas se crean centradas en el origen
    // Se puede modificar su posición con respecto al sistema de coordenadas local con una transformación aplicada directamente a la geometría.
    geometry.translate(0,-0.1,0);
    // Como material se crea uno a partir de una textura
    var texture = new THREE.TextureLoader().load('../imgs/wood.jpg');
    var material = new THREE.MeshPhongMaterial ({map: texture});
    var materialDark = new THREE.MeshPhongMaterial ({map: texture, color: 0xbfbfbf});
    // Por último se añade el suelo a la escena
    var physiMaterial = Physijs.createMaterial (material, 0.2, 0.1);
    var physiMaterialDark = Physijs.createMaterial (materialDark, 0.2, 0.1);
    // Al suelo se le da masa 0 para que no caiga por la gravedad
    var ground = new Physijs.BoxMesh (geometry, physiMaterial, 0);
    
    // Al suelo se le añade un listener de colisiones
    ground.addEventListener ('collision',
      function (o,v,r,n) {
        // Si el objeto que colisiona con el suelo es colisionable, se le quita el modo alambre
        if (o.colisionable)
          o.material.wireframe = false;
      }
    );
    
    // Un par de paredes al suelo
    geometry = new THREE.BoxGeometry (35, 1, 0.2);
    geometry.translate(0,0.5,0);
    
    // IMPORTANTE, a las paredes se les pone masa cero, no les afecta la gravedad
    var physiPared = new Physijs.BoxMesh (geometry,physiMaterial,0);
    physiPared.position.z = 17.4;
    
    // A las paredes se le añade otro listener de colisiones
    physiPared.addEventListener ('collision',
      function (o,v,r,n) {
        // Los figuras colisionables que colisonen con las paredes se les pone otra vez en modo alambre
        if (o.colisionable)
          o.material.wireframe = true;
      }
    );
    // Para que los listener de colisiones de las paredes sean llamados, las paredes deben estar colgadas DIRECTAMENTE en la escena
    this.add (physiPared);
    
    // La otra pared lateral
    physiPared = new Physijs.BoxMesh (geometry,physiMaterial,0);
    physiPared.position.z = -17.4;
    physiPared.addEventListener ('collision',
      function (o,v,r,n) {
        if (o.colisionable)
          o.material.wireframe = true;
      }
    );
    this.add (physiPared);
    
    this.add (ground);
    
    // Ejemplo de figura con restricción de deslizamiento, la caja cuadrada baja
    // =========================================================================
    
    geometry = new THREE.BoxGeometry (3,1,3);
    var slider = new Physijs.BoxMesh (
      geometry, physiMaterialDark, 0.1
    );
    
    // Como no queremos que estas piezas se procesen como colisiones, también se le añade el atributo colisionable y lo ponemos a false.
    // En cualquier caso, se debe añadir el atributo para que cuando sea consultado desde los listeners no nos de un error de objeto no definido.
    slider.colisionable = false;
    slider.position.set (6,0.7,6);
    this.add (slider);   // PRIMERO se añade la pieza a la escena
    // LUEGO se construye su restricción
    var constraint = new Physijs.SliderConstraint (
      slider, ground, slider.position, new THREE.Vector3 (Math.PI/2,0,0));
    // DESPUES, se añade la restriccion a la escena
    this.addConstraint (constraint);
    // FINALMENTE, se configura
    constraint.setLimits (-10,10,0,0);

    // Ejemplo de figura con restricción de  bisagra
    // =============================================

    // El cilindro hace de bisagra
    geometry = new THREE.CylinderGeometry (0.35, 0.35, 1.4);
    var ref = new Physijs.CylinderMesh (
      geometry, physiMaterialDark, 0
    );
    ref.colisionable = false;
    ref.position.set (5,0.7,-5)
    this.add (ref);
    
    // La pieza que gira sobre la bisagra, una caja
    geometry = new THREE.BoxGeometry (5,1,1);
    var hinge = new Physijs.BoxMesh (
      geometry, physiMaterialDark, 1
    );
    hinge.colisionable = false;
    // La posición de la pieza móvil se pone con respecto a la posición de la pieza fija
    hinge.position.set (ref.position.x+2.5+0.35,0.7,ref.position.z);
    
    // PRIMERO se añade la figura a la escena 
    this.add (hinge);
    
    // LUEGO  se construye su restricción
    this.constraintHinge = new Physijs.HingeConstraint (
      hinge, ref, 
      ref.position, 
      new THREE.Vector3 (0,1,0)
    );
    // DESPUES, se añade la restriccion a la escena
    this.addConstraint (this.constraintHinge);
    // FINALMENTE, se configura
    this.constraintHinge.setLimits (-Math.PI/2, Math.PI/2, 0.5, 0.5);
    
    // Ejemplo de pieza con restricción de Péndulo
    // ===========================================
    
    // La pieza fija, una esfera
    geometry = new THREE.SphereGeometry (0.5);
    ref = new Physijs.SphereMesh (
      geometry, physiMaterialDark, 0
    );
    ref.colisionable = false;
    ref.position.set (0,6,-5);
    this.add (ref);
    
    // La pieza móvil, una caja
    geometry = new THREE.BoxGeometry (1,5,1);
    var twist = new Physijs.BoxMesh (
      geometry, physiMaterialDark, 1
    );
    twist.colisionable = false;
    // La posición de la parte movil se pone con relación a la fija
    twist.position.set (ref.position.x,ref.position.y-3,ref.position.z);
    this.add (twist);
    constraint = new Physijs.ConeTwistConstraint (
      twist, ref, ref.position
    );
    this.addConstraint (constraint);
    constraint.setLimit (Math.PI/2, 0, Math.PI/2);
  }
  
  createGUI () {
    // Se crea una interfaz gráfica de usuario vacia
    var gui = new dat.GUI();
  
    var that = this;
    // Se definen los controles que se modificarán desde la GUI
    // En este caso la intensidad de la luz y si se muestran o no los ejes
    this.guiControls = new function() {
      // En el contexto de una función   this   alude a la función
      this.lightIntensity = 0.5;
      this.brake = true;   // Para frenar el rodamiento de las esferas
      this.flipper = false;   // Para mover la bisagra manualmente
      this.push = 1.0;   // La fuerza de los empujones que se le dan a las figuras
      
      this.boxesUp = function () {
        // Para dejar caer 'de nuevo' todas las figuras
        // Se le cambia la posición a mano y se le indica al motor de física que se ha hecho ese cambio manual
        // También se les pone la velocidad lineal a 0. Si no, las figuras que se habían caído del escenario y han adquirido una velocidad debido a la gravedad, la seguirían conservando y nada más ponerlas arriba, caerían bastante rápido.
        that.todos.forEach (function (element) {
          element.position.set (Math.random()*10-5, Math.random()*4+10, Math.random()*10-5);
          element.rotation.set (Math.random()*Math.PI*2,Math.random()*Math.PI*2,Math.random()*Math.PI*2); 
          element.setLinearVelocity (new THREE.Vector3());
          element.__dirtyPosition = true;
          element.__dirtyRotation = true;
          element.material.wireframe = false;
        });

      }
    }

    gui.add (this.guiControls, 'boxesUp').name ('[Cajas Arriba]');
    gui.add (this.guiControls, 'brake').name ('Frenar esferas');
    gui.add (this.guiControls, 'flipper').name ('Mover bisagra')
      .onChange(function (value) {
        if (value) {
          // Movimiento manual de la bisagra
          that.constraintHinge.enableAngularMotor (10, 10);
        } else {
          // Se apaga el motor para que se mueva con gravedad y colisiones
          that.constraintHinge.disableMotor();
        }
      });
    gui.add (this.guiControls, 'push', -10, 10, 1).name ('Fuerza');
    
    // Se crea una sección para los controles de esta clase
    var folder = gui.addFolder ('Luz y Ejes');
    
    // Se le añade un control para la intensidad de la luz
    folder.add (this.guiControls, 'lightIntensity', 0, 1, 0.1).name('Intensidad de la Luz : ');    
  }
  
  createLights () {
    // Se crea una luz ambiental, evita que se vean complentamente negras las zonas donde no incide de manera directa una fuente de luz
    // La luz ambiental solo tiene un color y una intensidad
    // Se declara como   var   y va a ser una variable local a este método
    //    se hace así puesto que no va a ser accedida desde otros métodos
    var ambientLight = new THREE.AmbientLight(0xccddee, 0.35);
    // La añadimos a la escena
    this.add (ambientLight);
    
    // Se crea una luz focal que va a ser la luz principal de la escena
    // La luz focal, además tiene una posición, y un punto de mira
    // Si no se le da punto de mira, apuntará al (0,0,0) en coordenadas del mundo
    // En este caso se declara como   this.atributo   para que sea un atributo accesible desde otros métodos.
    this.spotLight = new THREE.SpotLight( 0xffffff, 0.5 );
    this.spotLight.position.set( 60, 60, 40 );
    this.add (this.spotLight);
  }
  
  getCamera () {
    // En principio se devuelve la única cámara que tenemos
    // Si hubiera varias cámaras, este método decidiría qué cámara devuelve cada vez que es consultado
    return this.camera;
  }
  
  
  // Una función para empujar o tirar de las figuras
  
  pushBox (event) {
    // Es el ratón el que empuja o tira
    
    // Se construye un rayo a partir de la posición del ratón (igual que se hacía con el Picking)
    var mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = 1 - 2 * (event.clientY / window.innerHeight);
    this.raycaster.setFromCamera (mouse, this.getCamera());
    
    // Se busca si hay alguna figura apuntada por el ratón, igual que el Picking
    var pickedObjects = this.raycaster.intersectObjects(this.todos);
    if (pickedObjects.length > 0) {
      // Hay un objeto apuntado por el ratón
      var objeto = pickedObjects[0].object;
      // Se obtiene en qué punto de su superficie se ha clicado
      var pickedPoint = pickedObjects[0].point.clone();
      // Con ese punto y el centro del objeto se hace el vector que determina la dirección del impulso
      var offset = pickedPoint.sub(objeto.position).negate();
      // La fuerza la obtenemos de la interfaz, un escalar, lo usamos para hacer que el vector del impulso tenga la dirección calculada pero que su módulo sea la fuerza leída de la gui
      var effect = offset.normalize().multiplyScalar(this.guiControls.push);
      objeto.applyCentralImpulse (effect);
    }
      
  }
  
  setCameraAspect (ratio) {
    this.camera.aspect = ratio;
    this.camera.updateProjectionMatrix();
  }
  
  update () {
    // Se solicita que La próxima vez que haya que refrescar la ventana se ejecute una determinada función, en este caso la funcion render.
    // La propia función render es la que indica que quiere ejecutarse la proxima vez
    // Por tanto, esta instrucción es la que hace posible que la función  render  se ejecute continuamente y por tanto podamos crear imágenes que tengan en cuenta los cambios que se la hayan hecho a la escena después de un render.
    requestAnimationFrame(() => this.update());
    
    // Se actualizan los elementos de la escena para cada frame
    // Se actualiza la intensidad de la luz con lo que haya indicado el usuario en la gui
    this.spotLight.intensity = this.guiControls.lightIntensity;
    
    // Se actualiza la posición de la cámara según su controlador
    this.cameraControl.update();
    
    // Se actualiza el resto del modelo
    if (this.guiControls.brake) {
      // El procesamiento del frenado de las esferas
      // Las eferas tienden a rodar infinitamente, para darles más realismo hay que ir disminuyendo su velocidad angular
      var velocity = null;
//       var brake = MyPhysiScene.BRAKE;
      // El frenado se consigue leyendo la velocidad angular y volviéndola a poner disminuida en un porcentaje
      this.spheres.forEach (function (e) {
        velocity = e.getAngularVelocity();
        e.setAngularVelocity (velocity.multiplyScalar(MyPhysiScene.BRAKE));
      });
    }
    
    // Se le pide al motor de física que actualice las figuras según sus leyes
    this.simulate ();
    
    // Por último, se le pide al renderer que renderice la escena que capta una determinada cámara, que nos la proporciona la propia escena.
    this.renderer.render(this, this.getCamera());
  }
}

// Constantes que se usan en la clase
MyPhysiScene.MAXBOXES=30;
MyPhysiScene.PROBBOX=0.5;
MyPhysiScene.BRAKE=0.95; // En cada frame se reduce la velocidad angular de las esferas un 5%

/// La función principal
$(function () {
  // Se crea la escena
  var scene = new MyPhysiScene ("#WebGL-output");
  
  // listeners
  // Cada vez que el usuario cambie el tamaño de la ventana se llama a la función que actualiza la cámara y el renderer
  window.addEventListener ("resize", () => scene.onWindowResize());
  
  // Definimos un listener para el mouse down del ratón para los impulsos a las figuras
  window.addEventListener ("mousedown", () => scene.onMouseDown(event), true);
  
  // Finalmente, realizamos el primer renderizado.
  scene.update();
});

