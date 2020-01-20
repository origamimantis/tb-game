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
/*
	    this.loadImg("T_0");
	    this.loadImg("T_1");
	    this.loadImg("T_2");
	    this.loadImg("T_3");
	    this.loadImg("T_4");
	    this.loadImg("T_5");
	    this.loadImg("C_c0");
	    this.loadImg("C_h0");
	    this.loadImg("C_h1");
	    this.loadImg("C_move");
	    this.loadImg("C_walk");
	    this.loadImg("C_atk");
	    this.loadImg("C_usm");
	    
	    this.loadImg("C_menutl");
	    this.loadImg("C_menutr");
	    this.loadImg("C_menubl");
	    this.loadImg("C_menubr");
	    this.loadImg("C_menuel");
	    this.loadImg("C_menuer");
	    this.loadImg("C_menuet");
	    this.loadImg("C_menueb");
	    this.loadImg("C_menucn");
	    
	    this.loadImg("P_gen");
	    this.loadImg("P_kn");
	    this.loadImg("P_kna");
	    this.loadImg("P_lead");
	    this.loadImg("P_vmp");
	    this.loadImg("P_janitor");
	    
	    this.loadImg("S_spr0");
	    this.loadImg("S_ptt0");
	    this.loadImg("S_boi0");
	    this.loadImg("S_kn0");
	    this.loadImg("S_kna0");
	    this.loadImg("S_kn1");
	    this.loadImg("S_kn2");
	    this.loadImg("S_kn4");
	    this.loadImg("S_knh0");
	    this.loadImg("S_bad0");
	    this.loadImg("S_lead0");
	    this.loadImg("S_lead1");
	   */
