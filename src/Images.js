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
    g.ctx[ctx].drawImage(this.get(art), x, y, w, h);
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

