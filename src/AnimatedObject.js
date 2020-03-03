'use strict';

class AnimatedObject
{
  constructor( g, x = null, y = null )
  {
    this.g = g;
    this.x = x;
    this.y = y;
    this.drawx = x;
    this.drawy = y;
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
  setAnim( name )
  {
    this.curAnimName = name;
  }
  draw( g, ctx, x = null, y = null, s = 1 )
  {
    if (x == null || y == null)
    {
      x = this.x;
      y = this.y;
    }

    this.curAnim().draw(g, ctx, x, y, s);
    this.tickAnim();
  }
  addAnim( name, anim )
  {
    this.animations[name] = anim;
  }
  tickAnim()
  {
    if (this.pauseAnim == false)
    {
      this.curAnim().tick();
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

export {AnimatedObject};
