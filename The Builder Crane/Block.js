
class Block extends THREE.Mesh
{
    constructor()
    {
        super();
        var geometry = new THREE.BoxGeometry(7.5,5,7.5);
        var material = new THREE.TextureLoader().load('./imgs/wood.jpg');
        var textura = new THREE.MeshPhongMaterial({ map: material});
        this.bloqueBasicoCasa = new THREE.Mesh(geometry,textura);
        this.bloqueBasicoCasa.position.set(-37.5,2.5,0);
        this.add(this.bloqueBasicoCasa);
    }
}