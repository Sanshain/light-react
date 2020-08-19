
/*
type IDoc = { obj?: string; };
type Dom = Document & IDoc;

export var dom1: Dom = window.document;
// dom1.obj = "1";
dom1['obej'] = "1";
//*/

import { object } from "underscore";



declare global{
	interface HTMLLIElement{
		appendChilds(): void;
	}
	interface Object{
		pop(key: string): any;
		// ik: number;
	}		
}//*/

HTMLLIElement.prototype.appendChilds = function () {

  for ( var i = 0 ; i < arguments.length ; i++ )

    this.appendChild( arguments[ i ] );

};

var el:HTMLLIElement = new HTMLLIElement();


Object.prototype.pop = function(key: string){

	if (this[key] === undefined) return key;
	else{
		let rez = this[key];
		this[key] = null;
		return rez;	
	}
}



declare var FormData : {
	new(): FormData;
	prototype: FormData;
	posti: number;
}	

var a = {a:5};
a.pop('a');


FormData.posti = 5;
console.log(FormData.posti);







export var e = 9;