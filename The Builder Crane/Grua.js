
class Grua extends THREE.Mesh {
  constructor() {
    super();

    this.keyboard = new THREEx.KeyboardState();

    // Un Mesh se compone de geometría y material
    var boxGeom = new THREE.BoxGeometry(4, 1, 4);
    // Como material se crea uno a partir de un color
    var boxMat = new THREE.MeshPhysicalMaterial({ color: 0xFFBE01 });

    var cilindGeom = new THREE.CylinderGeometry(1, 1, 28);
    var box2Geom = new THREE.BoxGeometry(80, 0.8, 2);
    var cilind2Geom = new THREE.CylinderGeometry(0.1, 0.1, 20);
    var cilind3Geom = new THREE.CylinderGeometry(0.4, 0.4, 0.2);
    var box3Geom = new THREE.BoxGeometry(4, 4, 4);

    boxMat.metalness = 0.5;
    boxMat.roughness = 0.3;
    boxMat.envMapIntensity = 0.6;
    var textura1 = new THREE.TextureLoader().load('./imgs/cemento.jpg');
    var texturaContrapeso = new THREE.MeshPhongMaterial({ map: textura1 });
    var textura2 = new THREE.TextureLoader().load('./imgs/viga.jpg');
    var texturaViga = new THREE.MeshPhongMaterial({ map: textura2 });

    // Ya podemos construir el Mesh
    this.base = new THREE.Mesh(boxGeom, texturaContrapeso);
    this.cuerpo = new THREE.Mesh(cilindGeom, boxMat);
    this.brazo = new THREE.Mesh(box2Geom, texturaViga);
    this.cable = new THREE.Mesh(cilind2Geom, boxMat);
    this.gancho = new THREE.Mesh(cilind3Geom, boxMat);
    this.contrapeso = new THREE.Mesh(box3Geom, texturaContrapeso);

    // Y añadirlo como hijo del Object3D (el this)
    this.add(this.base);
    this.cuerpo.position.set(0, 14.45, 0);
    this.base.add(this.cuerpo);
    this.contrapeso.position.set(-35, -1, 0);
    this.brazo.add(this.contrapeso);
    this.brazo.position.set(31, 14, 0);
    this.cuerpo.add(this.brazo);
    this.cable.position.set(0, -10, 0);
    this.brazo.add(this.cable);
    this.gancho.position.set(0, -10, 0);
    this.cable.add(this.gancho);

    // Las geometrías se crean centradas en el origen.
    // Como queremos que el sistema de referencia esté en la base,
    // subimos el Mesh de la caja la mitad de su altura
    this.base.position.set(-22, 0.5, -22);

    this.giroGrua = 0;
    this.movimientoDelCable = 0
    this.movimientoDeGancho = 1;//this.base.children[0].children[0].children[1].position.y;

    // Tendremos una cámara
    this.createCamera();
    this.collision = false;

    this.coordenadasNuevoBloque = new THREE.Vector3();
  }


  createCamera() {
    // Para crear una cámara le indicamos
    //   El ángulo del campo de visión en grados sexagesimales
    //   La razón de aspecto ancho/alto
    //   Los planos de recorte cercano y lejano
    var camera1 = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var camera2 = camera1;
    var camera3 = camera1;

    // También se indica dónde se coloca
    camera1.position.set(-10, 30, -15);
    camera2.position.set(0, 0, 0);
    camera3.position.set(-10, 0, -15);

    // Y hacia dónde mira
    var x = this.base.children[0].children[0].children[1].children[0].position.x;
    var y = this.base.children[0].children[0].children[1].children[0].position.y;
    var z = this.base.children[0].children[0].children[1].children[0].position.z;

    var look = this.base.children[0].children[0].children[1].getWorldPosition(new THREE.Vector3(x, y, z));
    camera1.lookAt(look);
    camera2.lookAt(look);
    camera3.lookAt(look);
    this.cameras = [camera1, camera2, camera3];

    this.activeCamera = camera1;
    this.base.children[0].add(this.activeCamera);
  }

  getCamera() {
    // En principio se devuelve la única cámara que tenemos
    // Si hubiera varias cámaras, este método decidiría qué cámara devuelve cada vez que es consultado
    return this.activeCamera;
  }

  notifyCollision(haChocado, nuevoBloque) {
    this.collision = haChocado;
    this.nuevoBloque = nuevoBloque;
  }

  notifyGroundCollision(haTocadoSuelo){
    this.collisionGround = haTocadoSuelo ;
  }

  enganchaBloque() {
    this.estaEnganchado = true;
    this.nuevoBloque.position.set(0, -2.5, 0);
    this.gancho.add(this.nuevoBloque);
  }

  desenganchaBloque() {
    this.estaEnganchado = false;

    if (this.gancho.children.lenght != 0) {
      var nuevasCoordenadas = new THREE.Vector3();
      nuevasCoordenadas = this.gancho.getWorldPosition(this.gancho.children[0].position);
      this.coordenadasNuevoBloque = nuevasCoordenadas;
      this.gancho.remove(this.gancho.children[0]);
    }
  }

  getCoordenadasNuevoBloque() {
    return this.coordenadasNuevoBloque;
  }

  setCoordenadasNuevoBloque(vector3) {
    this.coordenadasNuevoBloque = vector3;
  }

  update() {
    // Con independencia de cómo se escriban las 3 siguientes líneas, el orden en el que se aplican las transformaciones es:
    // Primero, el escalado
    // Segundo, la rotación en Z
    // Después, la rotación en Y
    // Luego, la rotación en X
    // Y por último la traslación

    /*if (this.guiControls.perspectiva1) {
      this.guiControls.perspectiva2 = false;
      this.guiControls.perspectiva3 = false;
    }
    else if (this.guiControls.perspectiva2) {
      this.guiControls.perspectiva1 = false;
      this.guiControls.perspectiva3 = false;
    }
    else if (this.guiControls.perspectiva3) {
      this.guiControls.perspectiva1 = false;
      this.guiControls.perspectiva2 = false;
    }*/


    // Movimiento de la grua eje y
    if (this.keyboard.pressed("a") && ((!this.collision && !this.estaEnganchado) || (this.collision && this.estaEnganchado) ))
      this.giroGrua += 0.005;
    else if (this.keyboard.pressed("d") && ((!this.collision && !this.estaEnganchado) || (this.collision && this.estaEnganchado) ) )
      this.giroGrua -= 0.005;
    else if(this.keyboard.pressed("a") && this.collision && !this.estaEnganchado) {
        this.giroGrua -= 0.008;
    }
    else if(this.keyboard.pressed("d") && this.collision && !this.estaEnganchado) {
      this.giroGrua += 0.008;
    }

    this.base.children[0].rotation.set(0, this.giroGrua, 0);

    // Movimieto horizontal del cable de la grua
    if (this.keyboard.pressed("w") && ((!this.collision && !this.estaEnganchado) || (this.collision && this.estaEnganchado) )) {
      this.movimientoDelCable += 0.1;
      if (this.movimientoDelCable >= 35)
        this.movimientoDelCable = 35;
    }
    else if(this.keyboard.pressed("w") && this.collision && !this.estaEnganchado) {
      this.movimientoDelCable -= 0.5;
    }
    else if (this.keyboard.pressed("s") && ((!this.collision && !this.estaEnganchado) || (this.collision && this.estaEnganchado) )) {
      this.movimientoDelCable -= 0.1;
      if (this.movimientoDelCable <= -19)
        this.movimientoDelCable = -19;
    }
    else if(this.keyboard.pressed("s") && this.collision && !this.estaEnganchado) {
      this.movimientoDelCable += 0.5;
    }



    //Movimiento vertical del gancho
    if (this.keyboard.pressed("up") && (this.movimientoDeGancho >= 0.2)) {
      this.movimientoDeGancho -= 0.1;
    } else if (this.keyboard.pressed("down") && (this.movimientoDeGancho <= 2.8 && !this.collision)) {
      this.movimientoDeGancho += 0.1;
    }
    else if (this.keyboard.pressed("down") && (this.movimientoDeGancho <= 2.8 && this.collision && this.estaEnganchado && !this.collisionGround)) {
      this.movimientoDeGancho += 0.1;
    }

    if (this.keyboard.pressed("e")) {
      if (this.collision && !this.estaEnganchado)
        this.enganchaBloque();
    }

    if (this.keyboard.pressed("r")) {
      if (this.estaEnganchado)
        this.desenganchaBloque();
    }

    var x = this.base.children[0].children[0].children[1].position.x;
    var y = this.base.children[0].children[0].children[1].position.y;
    var z = this.base.children[0].children[0].children[1].position.z;

    this.base.children[0].children[0].children[1].position.set(0, 0, 0);
    this.base.children[0].children[0].children[1].scale.set(1, this.movimientoDeGancho / 2, 1);
    this.base.children[0].children[0].children[1].position.set(this.movimientoDelCable, -10 * (this.movimientoDeGancho / 2), z)
    this.base.children[0].children[0].children[1].children[0].scale.set(1, 1 / (this.movimientoDeGancho / 2), 1);
    this.updateCamera(this.base.children[0].children[0].children[1].children[0].position);
  }

  updateCamera(newPosition) {
    var x = newPosition.x;
    var y = newPosition.y;
    var z = newPosition.z;

    var position = this.base.children[0].children[0].children[1].getWorldPosition(new THREE.Vector3(x, y, z));
    var look = position;
    this.getCamera().lookAt(look);

    /*console.log(this.guiControls.perspectivaActiva);
    if (this.guiControls.perspectivaActiva === 1) {
      this.remove(this.activeCamera);
      this.activeCamera = this.cameras[0];
      this.add(this.activeCamera);
    } else if (this.guiControls.perspectivaActiva === 2) {
      this.activeCamera = this.cameras[1];
    } else if (this.guiControls.perspectivaActiva === 3) {
      this.activeCamera = this.cameras[2];
    }*/

    //this.base.children[0].add(this.activeCamera);
  }
}