'use strict';

import {Album} from "./Images.js";

export class BAFrame
{
  constructor(weight, x, y, a)
  {
    this.weight = weight;
    this.x = x;
    this.y = y;
    this.a = a;
  }
}


export class BattleAnimation
{
  //			[BAFrame]
  constructor( art, weights = [], loops = true, onDone = null)
  {
    this.numFrame = weights.length;

    this.weights = weights;
    this.age = 0;
    this.curFrame = 0;
    this.numFrame = weights.length;
    this.loops = loops;
    this.onDone = onDone;

    this.img = Album.get(art);
    this.w = this.img.width/this.numFrame;
    this.h = this.img.height;
  }
  
  tick()
  {
    if ( ++this.age >= this.weights[this.curFrame].weight)
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
	if (this.onDone != null)
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
  draw(g, layer, x, y, s, snapGrid)
  {
    g.ctx[layer].drawImage(this.img, this.w*this.curFrame, 0, this.w, this.h, x, y, this.w*s, this.h*s);
  }

  reset()
  {
    this.age = 0;
    this.curFrame = 0;
  }
}

