'use strict';

import {Album} from "./Images.js";


class Animation
{
  //obj( image, weights = [], loops = true, onDone = null)
  constructor( obj )
  {
    this.numFrame = obj.weights.length;

    this.baseweights = obj.weights.slice();
    this.weights = this.baseweights;
    this.baseimage = obj.image;
    this.image = obj.image;
    this.age = 0;
    this.curFrame = 0;
    this.numFrame = obj.weights.length;
    this.loops = obj.loops;
    this.direction = 1;
    this.onDone = obj.onDone;
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
	if (this.onDone !== undefined)
	{
	  this.onDone();
	}
      }
    }
  }
  reset()
  {
    this.age = 0;
    this.curFrame = 0;
  }
  draw(g, layer, x, y, s, append = "")
  {
    let img = Album.get(this.image + append)
    
    if (img === undefined)
      throw (this.image + append)
    let w = img.width/this.numFrame;
    let h = img.height;

    x += (g.gx - w*s)/2;
    y += (g.gy - h*s)/2;

    g.ctx[layer].drawImage(img, w*this.curFrame, 0, w, h, x, y, w*s, h*s);
  }

  reset()
  {
    this.age = 0;
    this.curFrame = 0;
  }

  copy()
  {
    let newA = new Animation(
      { image: this.image,
	weights: this.baseweights.slice(),
	loops: this.loops,
	onDone: this.onDone
      });

    return newA;
  }


}


export {Animation};
