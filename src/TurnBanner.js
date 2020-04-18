'use strict';

const BANNER_DISPLAY_TIME = 500;
const BANNER_SPEED = 0.04;

export class TurnBanner
{
  constructor(g)
  {
    this.g = g;
    this.bg = "white";
    this.text = "";
    this.x = 1;
    this.a = 0;
    this.tscale = 3;

    this.update = () => {};
  }
  flyBanner(text, bg, onDone = ()=>{})
  {
    this.text = text;
    this.bg = bg;
    this.onDone = onDone;
    this.update = this.zoomIn;
    this.x = 1;
    this.a = 0;
  }

  zoomIn()
  {
    this.x -= BANNER_SPEED;
    this.a = 1-Math.abs(this.x - 0.5)*2
    if (this.x < 0.5)
    {
      this.x = 0.5;
      this.a = 1;
      this.update = this.display;
      setTimeout( () => {this.update = this.zoomOut;}, BANNER_DISPLAY_TIME );
    }
  }
  zoomOut()
  {
    this.x -= BANNER_SPEED;
    this.a = 1-Math.abs(this.x - 0.5)*2
    if (this.x < 0)
    {
      this.x = 0;
      this.a = 0;
      this.update = () => {};
      this.onDone();
    }
  }
  display()
  {
    // in case I need to put something here
  }
  draw(g)
  {
    let olda = this.g.ctx[3].globalAlpha;
    let oldf = this.g.ctx[3].fillStyle;
    this.g.ctx[3].globalAlpha = this.a;
    this.g.ctx[3].fillStyle = this.bg;

    this.g.ctx[3].fillRect(0, 798/6-20, 512, 32+20);
    this.g.Fonts.drawText(this.g, 3, this.text, {x:this.x*512, y:768/6}, this.tscale, 2);

    this.g.ctx[3].globalAlpha = olda;
    this.g.ctx[3].fillStyle = oldf;
  }




}
