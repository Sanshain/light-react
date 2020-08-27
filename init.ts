
export var config = {

}


// vom.reInit ~=> fragmentRefresh => RefreshManager(vom) => renderPage => Viewer
//                                     ||              /\             ||      
//                                     \/              ||             \/
//                                    Ajax --------> _resp_        vom.reInit




import { Ajax } from "./source/ajax";
import { fragmentRefresh, RefreshManager, vom } from "./source/snippet";
import { renderPage, Viewer } from "./source/render";

vom.init();

