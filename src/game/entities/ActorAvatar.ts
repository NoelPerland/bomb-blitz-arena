import Phaser from 'phaser';
export class ActorAvatar extends Phaser.GameObjects.Container {
 private art!: Phaser.GameObjects.Graphics;
 constructor(scene:Phaser.Scene,x:number,y:number,tint:number,crown=false){
  super(scene,x,y);
  const shadow=scene.add.ellipse(0,17,32,10,0x102b3d,.3);
  const g=scene.add.graphics();this.art=g;
  g.fillStyle(0x173347).fillRoundedRect(-11,6,22,14,6);
  g.fillStyle(tint).fillRoundedRect(-9,6,18,11,5);
  g.fillStyle(0xe4f1dc).fillCircle(-15,7,4).fillCircle(15,7,4);
  g.fillStyle(0x173347).fillRoundedRect(-11,16,9,7,3).fillRoundedRect(2,16,9,7,3);
  g.fillStyle(0xeaf4dd).fillRoundedRect(-17,-19,34,29,12);
  g.fillStyle(tint).fillRoundedRect(-16,-20,32,27,11);
  g.fillStyle(0xffffff,.45).fillRoundedRect(-11,-17,19,4,3);
  g.fillStyle(0x102d40).fillRoundedRect(-13,-11,26,15,7);
  g.fillStyle(0xa8f6dd).fillRoundedRect(-8,-7,5,7,2).fillRoundedRect(3,-7,5,7,2);
  g.fillStyle(0xffffff,.2).fillRoundedRect(-10,-10,20,3,2);
  g.fillStyle(0xe5c781).fillCircle(-17,-6,3).fillCircle(17,-6,3);
  if(crown){g.fillStyle(0xffd35c).fillTriangle(-10,-20,-10,-29,0,-21).fillTriangle(0,-21,6,-31,10,-20).fillRect(-10,-23,20,5);}
  this.add([shadow,g]);scene.add.existing(this);this.setDepth(20);

 }
 setMotion(direction:string,moving:boolean):void {
  const time=this.scene.time.now/1000;
  this.art.y=moving?Math.sin(time*18)*1.6:Math.sin(time*3)*.6;
  this.art.rotation=moving?(direction==='left'?-.05:direction==='right'?.05:0):0;
 }
 setAlive(alive:boolean):void{this.setAlpha(alive?1:.2);this.setScale(alive?1:.7);}
}
