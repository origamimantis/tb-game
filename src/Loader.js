'use strict';

import {requestFile} from "./Utils.js";
import {TileMap} from "./TileMap.js";
import {Album, ImageLoader} from "./Images.js";
import {MusicPlayer} from "./MusicPlayer.js";
import {ImageModifier} from "./ImageModifier.js";
import {BattleAnimationAlbum} from "./BattleAnimationAlbum.js";


// thingsToLoad = {
//		    MapPath : string,	ie "assets/tilemaps/lvl1.txt"
//		    ImgLoad : [string], ie ["P_gen", "S_kn0"]
//
//
//
//
//		  }

function load(thingsToLoad)
  {
    let thingy = {
		  Map : new TileMap(),
		  Music : new MusicPlayer(),
		};

    return new Promise( async (resolve, reject) => 
      {
	// load map
	let mapFile = await requestFile(thingsToLoad.MapPath);
	thingy.Map.generate(mapFile.responseText);
	
	// load images
	Album.init();
	let i = new ImageLoader();
	await i.loadImgs( thingsToLoad.ImgLoad );

	let imscript = await requestFile(thingsToLoad.ImgMod);
	imscript = imscript.responseText;

	ImageModifier.init(Album);
	ImageModifier.execute(imscript)

	// TODO make this an argument from main
	BattleAnimationAlbum.init();
	await BattleAnimationAlbum.addAnim("anim0", "assets/scripts/anim0.txt");
	await BattleAnimationAlbum.addAnim("anim1", "assets/scripts/anim1.txt");
	await BattleAnimationAlbum.addAnim("anim2", "assets/scripts/anim2.txt");
	await BattleAnimationAlbum.addAnim("anim3", "assets/scripts/anim3.txt");

	// load sound library
	Waud.init();
	Waud.autoMute();
	await thingy.Music.loadMusic();

	let script = await requestFile(thingsToLoad.MapScript);
	script = script.responseText;

	document.fonts.load("11px ABCD Mono");
	document.fonts.load("11px ABCD Mono Bold");
	document.fonts.load("16.5px ABCD Mono");
	document.fonts.load("16.5px ABCD Mono Bold");
	document.fonts.load("22px ABCD Mono");
	document.fonts.load("22px ABCD Mono Bold");
	
	// "return"
	resolve({assets: thingy, script: script});
      });
  }


export {load};
