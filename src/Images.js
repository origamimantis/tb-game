'use strict';
const TOLOAD = 25;

class Album
{
  constructor()
  {
    this.images = {};
  }
  get( artName )
  {
    return this.images[artName];
  }
  draw(g, ctx, art, x, y, w, h)
  {
    g.ctx[ctx].drawImage(this.get(art), x, y, w, h);
  }
}

class ImageLoader
{
  constructor(album)
  {
    this.toload = TOLOAD;
    this.loaded = 0;
    this.album = album;
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

