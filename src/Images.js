'use strict';
const TOLOAD = 25;

class Album
{
  static init()
  {
    this.images = {};
  }
  static get( artName )
  {
    return this.images[artName];
  }
  static draw(g, ctx, art, x, y, w, h)
  {
    try
    {
      if ( w == null || h == null )
	g.ctx[ctx].drawImage(this.get(art), x, y);
      else
	g.ctx[ctx].drawImage(this.get(art), x, y, w, h);
    }
    catch(e)
    {
      console.error("Could not draw '" + art + "'.");
      console.error(this.images);
    }
  }
  static drawHealthBar(g, ctx, percent, x, y, w=184, h=10)
  {
    g.ctx[ctx].globalAlpha = 1;
    g.ctx[ctx].fillStyle = "#c0c0c0";
    g.ctx[ctx].fillRect(x, y, w, h);

    g.ctx[ctx].fillStyle = "grey";
    g.ctx[ctx].fillRect(x+2, y+2, w-4, h-4);

    g.ctx[ctx].fillStyle = "red";

    g.ctx[ctx].fillRect(x+2, y+2, (w-4)*percent, h-4);
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
	this.album.images[artName].onload = (() => {++ this.loaded; resolve()})

	this.album.images[artName].src = 'assets/sprite/' + artName + '.png';
      })
  }
}


export {Album, ImageLoader};

