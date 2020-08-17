"use strict";
/*
type IDoc = { obj?: string; };
type Dom = Document & IDoc;

export var dom1: Dom = window.document;
// dom1.obj = "1";
dom1['obej'] = "1";
//*/
exports.__esModule = true;
exports.e = void 0;
/*
declare global{
    interface HTMLLIElement{
        appendChilds(): void;
    }
}//*/
HTMLLIElement.prototype.appendChilds = function () {
    for (var i = 0; i < arguments.length; i++)
        this.appendChild(arguments[i]);
};
var el = new HTMLLIElement();
el.appendChilds();
exports.e = 9;
