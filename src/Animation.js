'use strict';

import {AnimFrame} from "./AnimFrame.js";


class Animation
{
  constructor( artName, weights = [], loops = true, onDone = () => {})
  {
    this.numFrame = weights.length;

    this.baseweights = weights.slice();
    this.weights = this.baseweights;
    this.baseimage = artName;
    this.image = artName;
    this.age = 0;
    this.curFrame = 0;
    this.numFrame = weights.length;
    this.loops = loops;
    this.direction = 1;
    this.onDone = onDone;
  }
  pushFrame( frame )
  {
    this.frames.push( frame );
  }
  reverse()
  {
    this.direction *= -1;
    this.weights = this.weights.reverse();
    this.curFrame = this.weights.length - this.curFrame - 1;
  }
  tick()
  {
    if ( ++this.age >= this.weights[this.curFrame])
    {
      this.age = 0;
      ++this.curFrame;
      if (this.curFrame >= this.numFrame)
      {
	if (this.loops == true)
	{
	  this.curFrame = 0;
	}
	else
	{
	  this.curFrame = this.numFrame - 1;
	}
	this.onDone();
      }
    }
  }
  reset()
  {
    this.age = 0;
    this.curFrame = 0;
  }
  draw(g, layer, x, y, s, snapGrid)
  {
    let img = g.Album.get(this.image)
    
    let w = img.width/this.numFrame;
    let h = img.height;

    if (snapGrid == true)
    {
      x = x*g.grid.x + (g.grid.x - w*s)/2;
      y = y*g.grid.y + (g.grid.y - h*s)/2;
    }

    g.ctx[layer].drawImage(img, w*this.curFrame, 0, w, h, x, y, w*s, h*s);
  }

  reset()
  {
    this.age = 0;
    this.curFrame = 0;
  }

  copy()
  {
    let newA = new Animation(this.image, this.baseweights.slice(), this.loops);
    return newA;
  }


}


export {Animation};
