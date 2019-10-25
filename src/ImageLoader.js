'use strict';
const TOLOAD = 25;

let ImageLoader = class
{
    async loadImgs()
    {
	this.loadImg("T_0", '../assets/sprite/tile0.png');
	this.loadImg("T_1", '../assets/sprite/tile1.png');
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
	this.loadImg("S_vmp0");
    }

    constructor()
    {
	this.toload = TOLOAD;
	this.loaded = 0;
	this.images = {};
    }
    loadImg(artName, fpath = null)
    {
	this.images[artName] = new Image();
	this.images[artName].onload = (() => {this.loaded ++;})
	if(fpath == null)
	{
	    this.images[artName].src = '../assets/sprite/' + artName + '.png';
	}
	else
	{
	    this.images[artName].src = fpath;
	}

    }
    getImg( artName )
    {
	return this.images[artName];
    }
}


export {ImageLoader};
