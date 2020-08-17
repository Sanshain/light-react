

type Dom = Document & { 
	obj?: (elementId: string) => HTMLElement | null;
	get?: <K extends keyof HTMLElementTagNameMap>(selectors: K) => HTMLElementTagNameMap[K] | null;
};

export var dom: Dom = window.document;

dom.obj = document.getElementById;
dom.get = document.querySelector;
var loc = document.location;

interface HTMLLIElement {
    appendChilds(): void;
}

HTMLLIElement.prototype.appendChilds = function (): void {

  for ( var i = 0 ; i < arguments.length ; i++ )

    this.appendChild( arguments[ i ] );

};

/*!
	 class
	
*/
HTMLElement.prototype.vs = function (dict) {

	for (var key in dict){
		this.setAttribute(key, dict[key]);
	}

	return this;
};

/*!
	
	\brief

	
	\require 
	
		ie10+
		
	\ status
	
		not checked
		
*/
DOMTokenList.prototype.Toggle = function(old, recent){

	var acts = [this.remove, this.add];

	for (var i=0;i<acts.length;i++) {
	
	
		if (typeof arguments[i] == "string") {

			acts[i](arguments[i]);			
		} 
		else if (Array.isArray(arguments[i])) {

			for (var j=0;j< arguments[i].length;j++) {

				acts[i](arguments[i][j]);
			}			
		} 
		else {
	
			throw new 
			   Error("Unexpected type param " + arguments[i]);			
		}

	}
		
}





/*! 

 __upload_images user.js
	
	\using 
	
	\require ie10+
*/
function get_maxim(enumble, field_in){ //get_maximum
	
	//Array.from
	if (field_in) enumble = [].slice.call(enumble).map(
		function(item) //
		{
		  return item[field_in];
		});
	var m = Math.max.apply(null, enumble);
	
	return m > 0 ? m : 0;

}

/*!
	\brief fixed
	
	\using  base 

	\required ie10+
*/
function search_fixed(container, deep){
	
	if (deep == 0) return null;
	else 
		deep = deep || 3;
	
	var childs=container.children; // ie9+,- childNodes 
	
	var i=0; while(i<childs.length)
	{
		var elem = childs[i++];
		if (window.getComputedStyle(elem).position == 'fixed'){						//ie9+, 
			return elem;
		}
		else if (deep > 1){
			
			var r = search_fixed(elem, deep - 1);
			
			if (r != null) return r;			
		}
		
	}
	
	//  firstElementChild - ie9+
}











/*	
	 left:calc(100vw - 250px);   aside
	
	
	
	\using Obsolete
*/
function get_scroll_wide(elem){
	//var elem = document.body || elem;
	
	return window.innerWidth - document.body.clientWidth;
}





/*!!
	 ie10+. 
*/
if (!String.prototype.startsWith) {
	
	String.prototype.startsWith = function(search, pos)
	{
		  position = pos || 0;
		  var r = this.substr(pos, search.length) === search;
		  /*
		  if (r){
			console.log(r);
		  }//*/
		  return r;
			
	};

}//*/


/*!
	 css
*/
function Elem(type_name, txt, css_cls){		
	var elem = document.createElement(type_name);	
	elem.innerText = txt;	//value
	
	if (css_cls) {
		elem.className = css_cls;
	}
	
	return elem;	
}

