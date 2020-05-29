'use strict';

const BANNER_DISPLAY_TIME = 500;
const BANNER_SPEED = 0.04;
const BANNER_LAYER = 5;

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
  flyBanner(text, bg)
  {
    return new Promise((resolve) =>
      {
	this.flyBannerAsync(text, bg, resolve);
      }
    );
  }
  flyBannerAsync(text, bg, onDone = ()=>{})
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
    let olda = this.g.ctx[BANNER_LAYER].globalAlpha;
    let oldf = this.g.ctx[BANNER_LAYER].fillStyle;
    this.g.ctx[BANNER_LAYER].globalAlpha = this.a;
    this.g.ctx[BANNER_LAYER].fillStyle = this.bg;

    this.g.ctx[BANNER_LAYER].fillRect(0, 798/6-20, g.windowx, 32+20);
    this.g.Fonts.drawText(this.g, BANNER_LAYER, this.text, this.x*512, 768/6, this.tscale, 2);

    this.g.ctx[BANNER_LAYER].globalAlpha = olda;
    this.g.ctx[BANNER_LAYER].fillStyle = oldf;
  }




}
