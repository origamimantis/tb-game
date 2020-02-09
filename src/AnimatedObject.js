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
  draw( g, ctx, s = 1, x = null, y = null )
  {
    if (x == null || y == null)
    {
      x = this.x;
      y = this.y;
    }

    x = x*g.grid.x;
    y = y*g.grid.y;

    this.curAnim().draw(g, ctx, x, y);
  }
  addAnim( name, anim )
  {
    this.animations[name] = anim;
  }
  tickAnim()
  {
    if (!this.pauseAnim)
    {
      this.curAnim().tick();
    }
  }

}

export {AnimatedObject};
