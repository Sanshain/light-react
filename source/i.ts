
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







interface MyType {
    instanceMethod();
}

interface MyTypeStatic {
	new():MyType;	
    staticMethod? :()=>void;
}


var vom1: MyTypeStatic;
vom1.staticMethod = () => {};
new vom1().instanceMethod();






type Vom = ((elem : HTMLElement) => {state? : string}) & {	
    reInit? : Function;
};


export var vom: Vom = function(elem : HTMLElement): {state? : string}{

	var robj: {state? : string} = {};
	
	var _state = function(){
		var r = elem.getAttribute('data-state');
		
		if (!r){
			
			/* for recursive:
			
			var rec = function(container, deep){
				
				var rc = container.firstElementChild;
				if (rc) r = rc.id || 
				(
					rc.className ? 
					rc.className.split(' ')[0] : 
					null
				);
				else return null;				
			}//*/
			
			var rc = elem.firstElementChild;
			if (rc) r = 
				rc.getAttribute('data-state') || rc.id || 
				(
					rc.className ? 
					rc.className.split(' ')[0] : 
					null
				);							
				
			else return null;
		}
		return r;
	}
	
	
	if (window.atob) Object.defineProperty(robj, 'state', {get: _state})	;
	else 		
		robj.state = _state();
	
	return robj;
}