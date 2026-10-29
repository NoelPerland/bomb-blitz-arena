import assert from 'node:assert/strict';
import { movePlayer } from '../src/game/playerMovement';
import type { Direction } from '../src/game/types';

const move = (x:number,y:number,desired:Direction,current:Direction,dt=.016,free=(c:number,r:number)=>c>=0&&c<6&&r>=0&&r<6) => movePlayer(x,y,desired,current,180,dt,48,72,free);
assert.equal(move(83,144,'none','right').x,83,'release stops immediately');
assert.equal(move(72,144,'left','right').x,69.12,'reverse without waiting for center');
assert.equal(move(72,144,'right','right',.05,(c)=>c!==2).x,72,'solid tile blocks movement');
assert.equal(move(72,144,'right','none',2).x,81,'slow frame travel is bounded');
let p={x:88,y:144,direction:'right' as Direction};
for(let i=0;i<30;i++) p=move(p.x,p.y,'down',p.direction);
assert.equal(p.x,120,'held corner turn reaches the exact next column');
assert(p.y>144,'held corner input turns without hitting a tiny frame window');
assert.equal(move(115,144,'down','right').x,120,'near corner assist');
for(const dt of [.008,.016,.033,.05]) {
 let p={x:72,y:144,direction:'right' as Direction};
 for(let i=0;i<100;i++)p=move(p.x,p.y,'right',p.direction,dt,c=>c<3);
 assert.equal(p.x,120,'never steps into a blocked neighbor at any frame rate');
}
console.log('Player movement passed: stop, reverse, buffered turns, corner assist, walls and slow frames.');
