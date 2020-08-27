

import { fragmentRefresh } from "./snippet";

namespace om{	

	/*! 
		функции инициализации фрагментов
	*/
	lPage.spa = false;
	
	lPage.add = function(container : string| HTMLElement, elem:string|HTMLElement, cls?:string):HTMLElement
	{
		if (typeof container == 'string') container = document.querySelector(container) as HTMLElement;
		
		if (typeof elem == 'string'){
			
			elem = document.createElement(elem);
			if (cls) elem.className = cls;
			
		}
		
		container.appendChild(elem);
		
		return elem;		
	};


	lPage.create = function(tagname: string, attrs: object):HTMLElement{
		var elem = document.createElement(tagname);
		for (var attr in attrs){
			elem[attr]=attrs[attr];
		}
		return elem;
	}
		

	lPage.parent_container = function(cfield: HTMLElement){
		
		var _root = cfield.parentElement;
		
		if (_root.id) return _root;
		else 
			return lPage.parent_container(_root);

	}	

	

	/** Назначает обработчик события для компонентов навигации
	 * @static 
	 * @param elem - элемент-контейнер, внутри которого нужно сделать переинициализацию компонентов навигации
	 */
	lPage.init = function(elem?: HTMLElement){

		var routes = (elem || document).querySelectorAll('[data-_refresh]') as NodeListOf<HTMLElement>;
		
		for (var way in routes){
			if (!routes[way].onclick){
				
				routes[way].onclick = fragmentRefresh;
			}						
		}
		
		/* setTimeout(function(){			
			var activeElem = (elem || document).querySelector('[autofocus]');			
			//if (activeElem) activeElem.focus();			
		}, 1000);//*/			
	}
}	


lPage = function(elem: HTMLElement){

	var robj: {state? : string, elem: HTMLElement} = {elem: elem};
	
	var _state = function(container?: HTMLElement, deep: number = 3){
		
		if (deep === 0) return null;

		container = container || robj.elem;				
		var state = container.getAttribute('data-state');
		
		if (!state){			// for recursive:
						
			var rc = container.firstElementChild as HTMLElement;
			if (rc) state = rc.getAttribute('data-state') || rc.id || rc.className 
				? rc.className.split(' ')[0] 
				: _state(rc, deep - 1)														
			else 
				return null;
		}
		return state;
	}
	
	
	if (window.atob) Object.defineProperty(robj, 'state', { get: _state})	;
	else 		
		robj.state = _state(elem);
	
	return robj;
}

export var vom = lPage;

// function Renderer(boxes: any){ return render_page; }

//vom = {};
//vom(elem).state


/*!
	Собирает данные со страницы для анимации во время
	подгрузки данных с сервера и их рендеринга	
*/
function preview_loader(){
	
	//TODO
}


