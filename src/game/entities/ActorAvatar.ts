import Phaser from 'phaser';
export class ActorAvatar extends Phaser.GameObjects.Container {
 constructor(scene:Phaser.Scene,x:number,y:number,tint:number,crown=false){
  super(scene,x,y);
  const shadow=scene.add.ellipse(0,17,32,10,0x102b3d,.3);
  const g=scene.add.graphics();g.fillStyle(0x152a43).fillRoundedRect(-16,-18,32,38,11);g.fillStyle(tint).fillRoundedRect(-13,-17,26,32,10);g.fillStyle(0xffffff,.35).fillRoundedRect(-9,-14,7,12,4);g.fillStyle(0x10283e).fillRoundedRect(-10,-5,20,11,5);g.fillStyle(0xffffff).fillCircle(-4,0,3).fillCircle(5,0,3);g.fillStyle(0x152a43).fillCircle(-3,1,1.5).fillCircle(6,1,1.5);g.fillStyle(0x172c43).fillRoundedRect(-13,12,10,9,3).fillRoundedRect(3,12,10,9,3);
  if(crown){g.fillStyle(0xffd35c).fillTriangle(-10,-20,-10,-29,0,-21).fillTriangle(0,-21,6,-31,10,-20).fillRect(-10,-23,20,5);}
  this.add([shadow,g]);scene.add.existing(this);this.setDepth(20);
  scene.tweens.add({targets:g,y:-2,duration:550,yoyo:true,repeat:-1,ease:'Sine.InOut'});
 }
 setAlive(alive:boolean):void{this.setAlpha(alive?1:.2);this.setScale(alive?1:.7);}
}
