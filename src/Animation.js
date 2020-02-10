'use strict';

import {AnimFrame} from "./AnimFrame.js";


class Animation
{
  constructor( artName, weights = [], loops = true, offset = [0,0] )
  {
    this.weights = weights.slice();
    this.numFrame = weights.length;

    this.image = artName;
    this.age = 0;
    this.curFrame = 0;
    this.numFrame = weights.length;
    this.loops = loops;
    this.offset = {x: offset[0], y: offset[1]};
  }
  pushFrame( frame )
  {
    this.frames.push( frame );
  }
  tick()
  {
    if (++this.age >= this.weights[this.curFrame])
    {
      this.age = 0;
      this.curFrame = (this.curFrame + 1) % (this.numFrame);
    }
  }
  reset()
  {
    this.age = 0;
    this.curFrame = 0;
  }
  draw(g, layer, x, y, s)
  {
    let img = g.Album.get(this.image)
    
    let w = img.width/this.numFrame;
    let h = img.height;

    //let x = this.x*g.grid.x;
    //let y = this.y*g.grid.y;

    g.ctx[layer].drawImage(img, w*this.curFrame, 0, w, h, x, y, g.grid.x*s, g.grid.y*s);

    this.tick();

  }



}


export {Animation};
