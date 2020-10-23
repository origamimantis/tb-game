'use strict';

import {triggerEvent} from "./Utils.js";
import {C_WIDTH, C_HEIGHT} from "./Constants.js";

const TOLOAD = 25;

class Album
{
  static init(m)
  {
    this.m = m;
    this.images = {};
  }
  static reset()
  {
    this.images = {};
  }
  static get( artName )
  {
    return this.images[artName];
  }
  static draw(ctx, art, x, y, w, h)
  {
    try
    {
      if ( w == null || h == null )
	this.m.ctx[ctx].drawImage(this.get(art), x, y);
      else
	this.m.ctx[ctx].drawImage(this.get(art), x, y, w, h);
    }
    catch(e)
    {
      console.error("Could not draw '" + art + "'.");
      console.error(this.images);
    }
  }
  static drawHealthBar(ctx, percent, x, y, w=184, h=10)
  {
    this.m.ctx[ctx].globalAlpha = 1;
    this.m.ctx[ctx].fillStyle = "#c0c0c0";
    this.m.ctx[ctx].fillRect(x, y, w, h);

    this.m.ctx[ctx].fillStyle = "grey";
    this.m.ctx[ctx].fillRect(x+2, y+2, w-4, h-4);

    this.m.ctx[ctx].fillStyle = "red";

    this.m.ctx[ctx].fillRect(x+2, y+2, (w-4)*percent, h-4);
  }

  static clearCtx(n)
  {
    this.m.ctx[n].clearRect(0,0,C_WIDTH, C_HEIGHT);
  }
  static clearAllCtx(g)
  {
    for (let i = 0; i <= 5; ++i)
      this.clearCtx(i);
  }
  static setTextColor(ctx, color)
  {
    this.m.ctx[ctx].fillStyle = color;
  }
  static setTextFont(ctx, font)
  {
    this.m.ctx[ctx].font = font;
  }
  static setTextJustify(ctx, justify)
  {
    this.m.ctx[ctx].textAlign = justify;
  }
  static setTextProperty(ctx, color=null, font=null, justify=null)
  {
    let c = this.m.ctx[ctx];
    if (color !== null)
      c.fillStyle = color;
    if (font !== null)
      c.font = font;
    if (justify !== null)
      c.textAlign = justify;
  }


  static drawOutlinedText(ctx, text, x, y, font, incolor, outcolor, maxwidth = undefined)
  {
    this.setTextFont(ctx, font);
    this.setTextColor(ctx, incolor);
    this.drawText(ctx, text, x, y, maxwidth);
    this.setTextColor(ctx, outcolor);
    this.strokeText(ctx, text, x, y, maxwidth);
  }
  static drawText(ctx, text, x, y, maxWidth = undefined)
  {
    if (typeof text == "string")
    {
      let height = this.m.ctx[ctx].font.substring(0,2)*1.5;
      let lines = text.split('\n');
      for (let i = 0; i<lines.length; ++i)
        this.m.ctx[ctx].fillText(lines[i], x, y + i*height, maxWidth);
    }
    else
    {
      this.m.ctx[ctx].fillText(text, x, y, maxWidth);
    }

  }
  static strokeText(ctx, text, x, y)
  {
    this.m.ctx[ctx].strokeText(text, x, y);
  }

}

class ImageLoader
{
  constructor()
  {
    this.toload = TOLOAD;
    this.loaded = 0;
    this.album = Album;
  }
  
  loadImgs(images)
  {
    return new Promise( async (resolve) =>
    {
      for (let img of images)
      {
	await this.loadImg(img);
      }
      resolve()
    })
  }

  loadImg(artName)
  {
    return new Promise((resolve) =>
      {
	this.album.images[artName] = new Image();
	this.album.images[artName].onload = () =>
	{
	  ++ this.loaded;
	  triggerEvent("load_progress", `Loaded image ${artName}.png`);
	  resolve()
	};

	this.album.images[artName].src = 'assets/sprite/' + artName + '.png';
      })
  }
}


export {Album, ImageLoader};

