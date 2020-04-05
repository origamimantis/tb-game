'use strict';

import {Album} from "./Images.js";
import {BattleAnimationAlbum as BAChest} from "./BattleAnimationAlbum.js";

export class BattleSprite
{
  constructor( g, weapon, x = null, y = null )
  {
    this.g = g;
    this.x = x;
    this.y = y;
    this.hx = 0;
    this.hy = 0;
    this.ha = 0;
    this.ws = weapon;
    this.animations = {};
    this.curAnimName = 0;
    this.pauseAnim = false;
  }
  curAnim()
  {
    return this.animations[this.curAnimName];
  } 
  curFrame() 
  { 
    return this.curAnim().curFrame;
  } 
  curImg()
  { 
    return this.curAnim().image;
  } 
  setAnim( name, onDone = () => {})
  {
    this.curAnimName = name;
    this.curAnim().reset();
    this.curAnim().onDone = onDone;
  }
  draw( g, ctx, x = this.x, y = this.y, s = 1, snapGrid = true)
  { 
    this.curAnim().draw(g, ctx, x, y, s);
  }
  addAnim( name, anim )
  { 
    this.animations[name] = new BattleAnimation(this, BAChest.get(anim));
  }
  tickAnim()
  { 
    if (this.pauseAnim == false)
    {
      this.curAnim().tick();
      this.ws.update(this);
    }
  }
  pauseAnimation()
  {
    this.pauseAnim = true;
    this.curAnim().reset();
  }
  resumeAnimation()
  {
    this.pauseAnim = false;
  }

}


export class BattleAnimation
{
  constructor( unit, info, loops = true, onDone = null)
  {
    this.unit = unit;

    this.weights = info.program;
    this.age = 0;
    this.curFrame = 0;
    this.numFrame = parseInt(info.options.frames);
    this.loops = (info.loops == "true");
    this.done = false;
    this.onDone = onDone;

    this.img = Album.get(info.options.usrc);
    this.wimg = Album.get(info.options.wsrc);
    this.w = this.img.width/this.numFrame;
    this.h = this.img.height;
  }
  
  tick()
  {
    if (this.done == false)
    {
      let exec = this.weights[this.age];
      if ( exec != undefined )
      {
	for (let line of exec)
	{
	  let cmd = line[0];
	  this.execute(cmd, line.slice(1));
	}
      }
      ++ this.age;
    }
  }
  reset()
  {
    this.age = 0;
    this.curFrame = 0;
    this.done = false;
  }
  draw(g, layer, x, y, s, snapGrid)
  {
    g.ctx[layer].drawImage(this.img, this.w*this.curFrame, 0, this.w, this.h, x, y, this.w*s, this.h*s);
  }
  execute( cmd, args)
  {
    switch (cmd)
    {
    case "uframe":
      this.curFrame = parseInt(args[0]);
      this.unit.hx = parseInt(args[2]);
      this.unit.hy = parseInt(args[3]);
      this.unit.ha = parseInt(args[4]);
      break;
    case "wframe":
      this.unit.ws.curAnim = parseInt(args[0]);
	break;
    case "loop":
      this.age = parseInt(args[0]);
      let poss = this.weights[this.age];
      if (poss != undefined)
      {
	for (let line of poss)
	{
	  let cmd2 = line[0];
	  this.execute(cmd2, line.slice(1));
	}
      }
      break;
    case "end":
      this.done = true;
	if (this.onDone != null)
	{
	  this.onDone();
	}
    }
  }
}

