
/*
type IDoc = { obj?: string; };
type Dom = Document & IDoc;

export var dom1: Dom = window.document;
// dom1.obj = "1";
dom1['obej'] = "1";
//*/



declare global{
	interface HTMLLIElement{
		appendChilds(): void;
	}
}//*/

HTMLLIElement.prototype.appendChilds = function () {

  for ( var i = 0 ; i < arguments.length ; i++ )

    this.appendChild( arguments[ i ] );

};

var el:HTMLLIElement = new HTMLLIElement();
el.appendChilds();

export var e = 9;