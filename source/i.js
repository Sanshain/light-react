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
HTMLLIElement.prototype.appendChilds = function () {
    for (var i = 0; i < arguments.length; i++)
        this.appendChild(arguments[i]);
};
var el = new HTMLLIElement();
el.appendChilds();
Object.pop = function (key) {
    if (this[key] === undefined)
        return key;
    else {
        var rez = this[key];
        this[key] = null;
        return rez;
    }
};
var a = { a: 5 };
a.pop('a');
FormData.posti = 5;
console.log(FormData.posti);
exports.e = 9;
