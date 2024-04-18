'use strict';

import {Album} from "./Images.js";
import {BattleAnimationAlbum as BAChest} from "./BattleAnimationAlbum.js";
import {ImageModifier} from "./ImageModifier.js";

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
  async addAnim( name, anim, recolor )
  { 
    let loaded = await BAChest.load(name, anim);
    this.animations[name] = new BattleAnimation(this, loaded, recolor);
    this.animations[name].init();
  }
  tickAnim()
  { 
    if (this.pauseAnim == false)
    {
      if (this.curAnim() == undefined)
	console.log(this)
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
  constructor( unit, info, recolor, onDone = null)
  {
    this.unit = unit;
    this.opts = info.options;

    this.weights = info.program;
    this.age = 0;
    this.curFrame = 0;
    this.recolor = recolor;
    this.numFrame = parseInt(info.options.frames);
    this.loops = (info.loops == "true");
    this.done = false;
    this._onHit = null;
    this._onHit_resolve = null;
    this.onDone = onDone;
  }
  init()
  {
    try
    {
	this.img = Album.get(this.opts.usrc);
	if (this.recolor !== null)
	  this.img = ImageModifier.recolor_nosave(this.img, this.recolor);
	//this.wimg = Album.get(info.options.wsrc);
	this.w = this.img.width/this.numFrame;
	this.h = this.img.height;
    }
    catch(e)
    {
        console.log("BattleAnimation.js: error loading " + this.opts.usrc)
        throw e
    }
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
  onHit(f)
  {
    this._onHit = f;
    return new Promise( (resolve) => {this._onHit_resolve = resolve;} );
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
    case "hit":
      this._onHit(this._onHit_resolve);
      break;
    case "projectile":
      this.unit.createProjectile();
	this.x += this.v;
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

