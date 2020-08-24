import { vom } from "./base";


type Dom = Document & { 
	elem?: (elementId: string) => HTMLElement | null;
	get?: <K extends keyof HTMLElementTagNameMap>(selectors: K) => HTMLElementTagNameMap[K] | null;
};

// export var dom = {...window.document, obj: document.getElementById, get: document.querySelector};
export var dom: Dom = window.document;
dom.elem = document.getElementById;
dom.get = document.querySelector;

export var loc = document.location;



declare global{
	interface HTMLLIElement{
		appendChilds(): void;
	}

	interface HTMLElement{
		vs(dict: Object): HTMLElement;
	}

	interface DOMTokenList{
		Toggle(old: String, recent: String): void;
	}
}

HTMLLIElement.prototype.appendChilds = function () {

  for ( var i = 0 ; i < arguments.length ; i++ )

    this.appendChild( arguments[ i ] );

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
		
		if (typeof arguments[i] == "string") acts[i](arguments[i]);
		else if (Array.isArray(arguments[i])) 
		{
			for (var j=0;j< arguments[i].length;j++) acts[i](arguments[i][j]);
		} 
		else {
			throw new Error("Unexpected type param " + arguments[i]);			
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
export function search_fixed(container : HTMLElement, deep? : number){
	
	if (deep == 0) return null;
	else 
		deep = deep || 3;
	
	var childs=container.children; // ie9+,- childNodes 
	
	var i=0; while(i<childs.length)
	{
		var elem = childs[i++] as HTMLElement;
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


type TName = HTMLElementTagNameMap;

/** Создает HTML-элемент
 * 
 * @param type_name 
 * @param txt 
 * @param css_cls 
 */
//export function Elem<tag extends keyof TName>(type_name: tag, txt: string, css_cls?: string): TName[tag]{			
export function Elem(type_name: keyof HTMLElementTagNameMap, txt: string, css_cls?: string){			

	var elem = document.createElement(type_name);	
	elem.innerText = txt;	//value
	
	if (css_cls) {
		elem.className = css_cls;
	}
	
	return elem;	
}



HTMLElement.prototype.vs = function (dict: object) {

	for (var key in dict){
		this.setAttribute(key, dict[key]);
	}

	return this;
};

