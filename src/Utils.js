'use strict'

import {PathFinder} from "./PathFinder.js";


function nextFrameDo(f)
{
  requestAnimationFrame(f);
  //setTimeout( () => {requestAnimationFrame(() => {this.mainloop()});}, TICK_RATE);
}


async function generatePath(g, x0, y0, xf, yf, cost)
{
  return new Promise( (resolve, reject) => 
    {
      PathFinder.setMap(g.Map.pather);
      PathFinder.findPath(x0, y0, xf, yf, cost)
      .then( (thing) => 
	{
	  resolve(thing);
	}
      );
    }
  );
}

function coordEqual(c1, c2)
{
  return (c1.x == c2.x && c1.y == c2.y);
}


let requestFile = function (url, method)
{
  // Create the XHR request
  let request = new XMLHttpRequest();

  // Return it as a Promise
  return new Promise( (resolve, reject) =>
    {
      request.onreadystatechange = () =>
      {
	if (request.readyState !== 4)
	{
	  return;
	}

	if (request.status >= 200 && request.status < 300)
	{
	  resolve(request);
	}
	else
	{
	  reject(
	    {
	      status: request.status,
	      statusText: request.statusText
	    });
	}

      };

      request.open('GET', url, true);

      request.send();

    });
};

function triggerEvent(name, detail)
{
  document.dispatchEvent(new CustomEvent(name, {detail: detail}));
}


export {requestFile, triggerEvent, generatePath, coordEqual, nextFrameDo};
