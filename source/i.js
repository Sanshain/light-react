"use strict";
/*
type IDoc = { obj?: string; };
type Dom = Document & IDoc;

export var dom1: Dom = window.document;
// dom1.obj = "1";
dom1['obej'] = "1";
//*/
exports.__esModule = true;
exports.vom = exports.e = void 0;
HTMLLIElement.prototype.appendChilds = function () {
    for (var i = 0; i < arguments.length; i++)
        this.appendChild(arguments[i]);
};
var el = new HTMLLIElement();
Object.prototype.pop = function (key) {
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
var vom1;
vom1.staticMethod = function () { };
new vom1().instanceMethod();
exports.vom = function (elem) {
    var robj = {};
    var _state = function () {
        var r = elem.getAttribute('data-state');
        if (!r) {
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
            if (rc)
                r =
                    rc.getAttribute('data-state') || rc.id ||
                        (rc.className ?
                            rc.className.split(' ')[0] :
                            null);
            else
                return null;
        }
        return r;
    };
    if (window.atob)
        Object.defineProperty(robj, 'state', { get: _state });
    else
        robj.state = _state();
    return robj;
};
