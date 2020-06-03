
class Grua extends THREE.Mesh {
  constructor(gui,titleGui) {
    super();

    // Se crea la parte de la interfaz que corresponde a la caja
    // Se crea primero porque otros métodos usan las variables que se definen para la interfaz
    this.createGUI(gui,titleGui);

    // Un Mesh se compone de geometría y material
    var boxGeom = new THREE.BoxGeometry (4,1,4);
    // Como material se crea uno a partir de un color
    var boxMat = new THREE.MeshPhongMaterial({color: 0xCF0000});

    var cilindGeom = new THREE.CylinderGeometry(1,1,28);
    var box2Geom = new THREE.BoxGeometry (35,0.8,2);
    var cilind2Geom = new THREE.CylinderGeometry(0.1,0.1,20);
    var cilind3Geom = new THREE.CylinderGeometry(0.4,0.4,0.2);
    var box3Geom = new THREE.BoxGeometry(4,4,4);


    // Ya podemos construir el Mesh
    var base = new THREE.Mesh (boxGeom, boxMat);
    var cuerpo = new THREE.Mesh (cilindGeom, boxMat);
    var brazo = new THREE.Mesh (box2Geom, boxMat);
    var cable = new THREE.Mesh (cilind2Geom, boxMat);
    var gancho = new THREE.Mesh (cilind3Geom, boxMat);
    var contrapeso = new THREE.Mesh (box3Geom, boxMat);

    // Y añadirlo como hijo del Object3D (el this)
    this.add (base);
    this.add (cuerpo);
    this.add (brazo);
    this.add (cable);
    this.add (gancho);
    this.add (contrapeso);

    // Las geometrías se crean centradas en el origen.
    // Como queremos que el sistema de referencia esté en la base,
    // subimos el Mesh de la caja la mitad de su altura
    base.position.set (-22, 0.5, -22);

    cuerpo.position.set (-22, 15, -22);

    brazo.position.set (-12.5, 29, -22);

    cable.position.set (-5.5, 19, -22);

    gancho.position.set (-5.5, 9, -22);

    contrapeso.position.set (-26, 27, -22);

  }

  createGUI (gui,titleGui) {
    // Controles para el tamaño, la orientación y la posición de la caja
    this.guiControls = new function () {
      this.sizeX = 1.0;
      this.sizeY = 1.0;
      this.sizeZ = 1.0;

      this.rotX = 0.0;
      this.rotY = 0.0;
      this.rotZ = 0.0;

      this.posX = 0.0;
      this.posY = 0.0;
      this.posZ = 0.0;

      // Un botón para dejarlo todo en su posición inicial
      // Cuando se pulse se ejecutará esta función.
      this.reset = function () {
        this.sizeX = 1.0;
        this.sizeY = 1.0;
        this.sizeZ = 1.0;

        this.rotX = 0.0;
        this.rotY = 0.0;
        this.rotZ = 0.0;

        this.posX = 0.0;
        this.posY = 0.0;
        this.posZ = 0.0;
      }
    }

    // Se crea una sección para los controles de la caja
    var folder = gui.addFolder ('Controles Grua');
    // Estas lineas son las que añaden los componentes de la interfaz
    // Las tres cifras indican un valor mínimo, un máximo y el incremento
    // El método   listen()   permite que si se cambia el valor de la variable en código, el deslizador de la interfaz se actualice
    folder.add (this.guiControls, 'sizeX', 0.1, 5.0, 0.1).name ('Tamaño X : ').listen();
    folder.add (this.guiControls, 'sizeY', 0.1, 5.0, 0.1).name ('Tamaño Y : ').listen();
    folder.add (this.guiControls, 'sizeZ', 0.1, 5.0, 0.1).name ('Tamaño Z : ').listen();

    folder.add (this.guiControls, 'rotX', 0.0, Math.PI/2, 0.1).name ('Rotación X : ').listen();
    folder.add (this.guiControls, 'rotY', 0.0, Math.PI/2, 0.1).name ('Rotación Y : ').listen();
    folder.add (this.guiControls, 'rotZ', 0.0, Math.PI/2, 0.1).name ('Rotación Z : ').listen();

    folder.add (this.guiControls, 'posX', -20.0, 20.0, 0.1).name ('Posición X : ').listen();
    folder.add (this.guiControls, 'posY', 0.0, 10.0, 0.1).name ('Posición Y : ').listen();
    folder.add (this.guiControls, 'posZ', -20.0, 20.0, 0.1).name ('Posición Z : ').listen();

    folder.add (this.guiControls, 'reset').name ('[ Reset ]');
  }

  update () {
    // Con independencia de cómo se escriban las 3 siguientes líneas, el orden en el que se aplican las transformaciones es:
    // Primero, el escalado
    // Segundo, la rotación en Z
    // Después, la rotación en Y
    // Luego, la rotación en X
    // Y por último la traslación
    this.position.set (this.guiControls.posX,this.guiControls.posY,this.guiControls.posZ);
    this.rotation.set (this.guiControls.rotX,this.guiControls.rotY,this.guiControls.rotZ);
    this.scale.set (this.guiControls.sizeX,this.guiControls.sizeY,this.guiControls.sizeZ);
  }
}
