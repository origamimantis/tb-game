'use strict';

const EXT = ".wav";


class MusicPlayer
{
    
  constructor()
  {
      this.album = {};
  }
  loadMusic()
  {
      this.load("btl1", false);
      this.load("fght",false);
      this.load("fght2",false);
      this.load("oss");
  }

  load( name, intro = true, loops = true )
  {
      let s = new WaudSound("assets/music/" + name + "_L" + EXT, {loop:loops, volume:0.5});
      this.album[name] = {l:[], fade:null};
      if (intro)
      {
	  let i = new WaudSound("assets/music/" + name + "_I" + EXT, {loop:false, volume:0.5});
	  i.onEnd( ()=> {this.album[name].l[1].play() });
	  this.album[name].l.push(i);
      }
      this.album[name].l.push(s);
  }
  
  play( name )
  {
      this.album[name].l[0].play();
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
      let cvol = this.album[name].l[0]._options.volume;
      if (cvol > 0)
      {
	  this.album[name].fade = "out";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	      setTimeout(()=>{
		  if (this.album[name].fade == "out")
		  {
		      this.setVol(name,cvol-i*(cvol/num));
		  }
			     }, i*100);
	  }
	  setTimeout(()=>{
	      if (this.album[name].fade == "out")
	      {
		  this.album[name].fade = null;
		  this.setVol(name,0);
	      }
			 }, time);
      }
  }
  fadestop( name, time = 500)
  {
      this.fadeout(name, time);
      setTimeout(()=> {this.stop(name)}, time);
  }
  playin( name, time = 500)
  {
      this.play(name);
      this.mute(name);
      this.fadein(name, time);
  }
  fadein( name, time = 500)
  {
      if (this.album[name].l[0]._options.volume == 0)
      {
	  this.album[name].fade = "in";
	  let num = time/100;
	  for (let i = 0; i < num; i++)
	  {
	      setTimeout(()=>{
		  if (this.album[name].fade == "in")
		  {
		      this.setVol(name,i*(0.5/num));
		  }
			     }, i*100);
	  }
	  setTimeout(()=>{
	      if (this.album[name].fade == "in")
	      {
		  this.album[name].fade = null;
		  this.setVol(name,0.5);
	      }
			 }, time);
      }
  }
  stop( name )
  {
      for (let a of this.album[name].l)
      {
	  a.stop();
      }
      //this.album[name][0].stop();
  }
  stopAll()
  {
      Waud.stop();
  }
}

export {MusicPlayer};
