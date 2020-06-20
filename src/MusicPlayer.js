'use strict';

import {respondToEvent, waitTime} from "./Utils.js";

const EXT = ".wav";

/*
play( name )
unmute( name )
mute( name )
setVol(name, vol)
fadeout( name , time = 500)
fadestop( name, time = 500)
playin( name, time = 500)
fadein( name, time = 500)
stop( name )
stopAll()
*/




class MusicPlayer
{
    
  constructor()
  {
    this.album = {};
    respondToEvent("sfx_play_beep_effect", () => {this.play("beep");});
    respondToEvent("sfx_play_cursormove_effect", () => {this.play("cbeep2");});
    respondToEvent("sfx_play_err_effect", () => {this.play("errbeep");});
  }
  async loadMusic()
  {
    // load(name, hasIntro = true, loops = false)
    await this.load("btl1", false);
    await this.load("btl_en", false);
    await this.load("fght",false);
    await this.load("fght2",false);
    //await this.load("rfgh");
    //await this.load("oss");
    //await this.loadFX("bad");
    await this.loadFX("errbeep");
    await this.loadFX("beep");
    await this.loadFX("cbeep2");
    //await this.loadFX("bad2");
    await this.loadFX("whack");
    await this.loadFX("FX_slash");
    await this.loadFX("FX_miss");
    await this.loadFX("FX_crit");
    await this.loadFX("FX_unitdeath");
  }
  
  async load( name, intro = true, loops = true)
  {
    this.album[name] = {l:[], fade:null, playing:false};

    let loop = await new Promise ( (resolve, reject) => 
      {
	let fullname = "assets/music/" + name + (loops ? "_L" : "") + EXT;
	let s = new WaudSound(fullname,
	  {
	    loop: loops,
	    volume: 0.5,
	    onload : () => {resolve(s);}
	  });
      });

    if (intro)
    {
      let intro = await new Promise( (resolve) =>
	{
	  let i = new WaudSound("assets/music/" + name + "_I" + EXT,
	    {
	      loop: false,
	      volume: 0.5,
	      onload : () => {resolve(i);}
	    })
	});
      intro.onEnd( ()=> {if (this.album[name].playing) this.album[name].l[1].play() } );
      
      this.album[name].l.push(intro);
    }
    this.album[name].l.push(loop);
    console.log(name + " loaded");
  }
  async loadFX( name )
  {
    this.album[name] = {l:[], fade:null};
    let loaded_sound = await new Promise ( (resolve, reject) => {
	let fullname = "assets/music/" + name + EXT;
	let s = new WaudSound(fullname,
	  {
	    loop: false,
	    volume: 0.5,
	    onload : () => {resolve(s);}
	  });
      });
    this.album[name].l.push(loaded_sound);
    console.log(name + " loaded");
  }
  play( name )
  {
    this.album[name].playing = true;
    this.album[name].l[0].play();
    this.unmute(name);
  }
  unmute( name )
  {
    this.setVol(name,0.5);
  }
  mute( name )
  {
    this.setVol(name,0);
  }
  setVol(name, vol)
  {
    for (let a of this.album[name].l)
    {
      a.setVolume(vol);
    }
  }
  fadeout( name , time = 500)
  {
    return new Promise( async (resolve)=>
      {
	let cvol = this.album[name].l[0]._options.volume;
	if (this.album[name].fade == null && cvol > 0)
	{
	  this.album[name].fade = "out";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	    this.setVol(name,cvol*(1-i/num));
	    await waitTime(100);;
	  }
	  this.setVol(name,0);
	  this.album[name].fade = null;
	}
	resolve();
      });
  }
  fadestop( name, time = 500)
  {
    return new Promise( async (resolve)=>
      {
	await this.fadeout(name, time);
	this.stop(name);
	resolve();
      }
    );
  }
  playin( name, time = 500)
  {
    return new Promise( async (resolve)=>
      {
	this.play(name);
	this.mute(name);
	await this.fadein(name, time);
	resolve();
      }
    );
  }
  fadein( name, time = 500)
  {
    return new Promise( async (resolve)=>
      {
	let cvol = this.album[name].l[0]._options.volume;
	if (this.album[name].fade == null && cvol < 0.5)
	{
	  this.album[name].fade = "in";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	    this.setVol(name, (0.5-cvol)*i/num );
	    await waitTime(100);;
	  }
	  this.setVol(name,0.5);
	  this.album[name].fade = null;
	}
	resolve();
      });

  }
  stop( name )
  {
    this.album[name].playing = false;
    for (let a of this.album[name].l)
    {
      a.stop();
    }
  }
  stopAll()
  {
    Waud.stop();
  }
}

export {MusicPlayer};
