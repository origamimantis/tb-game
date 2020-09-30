'use strict';

import {requestFile} from "./Utils.js";

const commentChar = "#";

export class BattleAnimationAlbum
{
  static init()
  {
    this.anims = {};
  }
  static load(name, scriptName)
  {
    return new Promise( async (resolve) =>
      {
	let script = await requestFile("assets/scripts/" + scriptName + ".txt");
	script = script.responseText;

	let lines = script.split("\n");

	let options = {};
	let program = {};
	while (lines[0] != "begin")
	{
	  let opt = lines.shift().split(" ");
	  options[opt[0]] = opt[1];
	}

	lines.shift();

	for (let line of lines)
	{
	  if (line.length == 0 || line[0] == commentChar)
	  {
	    continue;
	  }
	  let args = line.split(" ");
	  let time = args.shift();
	  if (program[time] == undefined)
	  {
	    program[time] = [];
	  }
	  program[time].push(args);
	}
	resolve({options: options, program: program});

      }
    );
  }

  static addAnim(name, scriptPath)
  {
    return new Promise( async (resolve) =>
      {
	let script = await requestFile(scriptPath);
	script = script.responseText;

	let lines = script.split("\n");

	let options = {};
	let program = {};
	while (lines[0] != "begin")
	{
	  let opt = lines.shift().split(" ");
	  options[opt[0]] = opt[1];
	}

	lines.shift();

	for (let line of lines)
	{
	  if (line.length == 0 || line[0] == commentChar)
	  {
	    continue;
	  }
	  let args = line.split(" ");
	  let time = args.shift();
	  if (program[time] == undefined)
	  {
	    program[time] = [];
	  }
	  program[time].push(args);
	}
	this.anims[name] = {options: options, program: program}
	resolve();

      }
    );
  }
  static get(name)
  {
    return this.anims[name];
  }
}

