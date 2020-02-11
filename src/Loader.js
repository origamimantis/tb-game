'use strict';

import {requestFile} from "./Utils.js";
import {TileMap} from "./TileMap.js";
import {Album, ImageLoader} from "./Images.js";
import {MusicPlayer} from "./MusicPlayer.js";


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
		  Album : new Album(),
		  Music : new MusicPlayer()
		};

    return new Promise( async (resolve, reject) => 
      {
	// load map
	let mapFile = await requestFile(thingsToLoad.MapPath);
	thingy.Map.generate(mapFile.responseText);
	
	// load images
	let i = new ImageLoader(thingy.Album);
	await i.loadImgs( thingsToLoad.ImgLoad );

	// load sound library
	Waud.init();
	Waud.autoMute();
	await thingy.Music.loadMusic();

	let script = await requestFile(thingsToLoad.MapScript);
	script = script.responseText;
	
	// "return"
	resolve({assets: thingy, script: script});
      });
  }


export {load};
