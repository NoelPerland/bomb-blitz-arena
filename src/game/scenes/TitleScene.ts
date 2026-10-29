import Phaser from 'phaser';
import { arcadeAudio } from '../../audio/ArcadeAudio';
import { MuteToggle } from '../../ui/MuteToggle';
import { GAME_WIDTH } from '../config';
import { TEXT_STYLES } from '../theme';

export class TitleScene extends Phaser.Scene {
  constructor() { super('title'); }
  create(): void {
    this.game.events.emit('arena-title');
    arcadeAudio.bindUnlock(this); arcadeAudio.startTitleMusic(this);
    this.cameras.main.setBackgroundColor('#153c4a');
    if(this.textures.exists('hero-art')) this.add.image(GAME_WIDTH/2,230,'hero-art').setDisplaySize(GAME_WIDTH,416);
    this.add.graphics().fillStyle(0x113947,.68).fillRoundedRect(125,35,GAME_WIDTH-250,108,22);
    this.add.text(GAME_WIDTH/2,61,'BOMB BLITZ',{...TEXT_STYLES.title,fontSize:'44px'}).setOrigin(.5);
    this.add.text(GAME_WIDTH/2,111,'SMALL ARENA. BIG PLAYS.',{...TEXT_STYLES.subtitle,fontSize:'17px',color:'#fff2c3'}).setOrigin(.5);
    this.add.rectangle(GAME_WIDTH/2,505,GAME_WIDTH,190,0x153c4a);
    this.add.text(GAME_WIDTH/2,441,'Outsmart three rivals. Be the last blaster standing.',{...TEXT_STYLES.subtitle,fontSize:'18px'}).setOrigin(.5);
    const play=this.add.container(GAME_WIDTH/2,503);
    const button=this.add.graphics().fillStyle(0x8a4a29).fillRoundedRect(-160,-26,320,67,20).fillStyle(0xffbd68).fillRoundedRect(-160,-32,320,64,20).fillStyle(0xffe0a0).fillRoundedRect(-145,-25,290,8,5);
    const label=this.add.text(0,0,'LET’S PLAY',{...TEXT_STYLES.button,fontSize:'27px',color:'#17394b',strokeThickness:0}).setOrigin(.5);
    const hit=this.add.zone(0,0,320,72).setInteractive({useHandCursor:true});play.add([button,label,hit]);
    const start=()=>{arcadeAudio.playMenu(this);arcadeAudio.stopMusic();this.scene.start('game');};
    hit.on('pointerdown',()=>play.setScale(.97));hit.on('pointerup',start);hit.on('pointerout',()=>play.setScale(1));
    this.tweens.add({targets:play,y:500,duration:1100,yoyo:true,repeat:-1,ease:'Sine.InOut'});
    this.add.text(GAME_WIDTH/2,565,'MOVE  •  DROP  •  ESCAPE',{...TEXT_STYLES.subtitle,fontSize:'18px',color:'#9ce8d4'}).setOrigin(.5);
    new MuteToggle(this,GAME_WIDTH-59,26).setDepth(10);
    this.input.keyboard?.on('keydown-ENTER',start);this.input.keyboard?.on('keydown-SPACE',start);
  }
}
