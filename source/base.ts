

import { fragmentRefresh, config as snippetConfig } from "./snippet";

snippetConfig.vom = vom;

declare global{
	// ((elem : HTMLElement) => {state? : string}) 
	/**
	 * Тип для vom
	 */
	type vExtension = {	

		spa?: boolean;

		/**
		 * функция инициализации фрамента (страницы). точка входа
		 */
		Init? : (elem?: HTMLElement) => void;

		/** Добавляет элемент (если это строка, то генерирует элемент на ее основе) в контейнер
		 * 
		 * @param container - контейнер или id контейнера
		 * @param elem - элемент или id элемента
		 * @param cls - имя класса
		 * @returns добавленный элемент
		 */
		add? : (container : string| HTMLElement, elem:string|HTMLElement, cls?:string) => HTMLElement;
		/** Создает элемент с соответствующими атрибутами
		 * @param tagname - тэг элемента
		 * @param attrs - атрибуты элемента
		 * @returns возвращает созданный элемент
		 */	
		create? : (tagname: string, attrs: object) => HTMLElement;		
		/** Ищет родительский контейнер с заданным id. 
		 * Как вариант еще добавить поиск по атрибуту data-_refresh	
		 * @param cfield 
		 */	
		parent_container? : (cfield:HTMLElement) => HTMLElement;
	};//*/

	type VDOM = ((elem : HTMLElement) => {state? : string, elem: HTMLElement}) & vExtension;

}



namespace om{

	/*! 
		функции инициализации фрагментов
	*/
	vom.spa = false;
	
	vom.add = function(container : string| HTMLElement, elem:string|HTMLElement, cls?:string):HTMLElement
	{
		if (typeof container == 'string') container = document.querySelector(container) as HTMLElement;
		
		if (typeof elem == 'string'){
			
			elem = document.createElement(elem);
			if (cls) elem.className = cls;
			
		}
		
		container.appendChild(elem);
		
		return elem;		
	};


	vom.create = function(tagname: string, attrs: object):HTMLElement{
		var elem = document.createElement(tagname);
		for (var attr in attrs){
			elem[attr]=attrs[attr];
		}
		return elem;
	}
		

	vom.parent_container = function(cfield: HTMLElement){
		
		var _root = cfield.parentElement;
		
		if (_root.id) return _root;
		else 
			return vom.parent_container(_root);

	}	

	

	/** Назначает обработчик события для компонентов навигации
	 * @static 
	 * @param elem - элемент-контейнер, внутри которого нужно сделать переинициализацию компонентов навигации
	 */
	vom.Init = function(elem?: HTMLElement){		

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

/** Возвращает объект с состоянием элемента
 * 
 * @param elem - элемент, для которого необходимо определить состояние
 * @description - **состояние** - это содержимое атрибута *data-state* текущего элемента либо одного из дочерних
 * [либо (id || class) дочерних]
 * 
 * @static - содержит статические методы, в тч *reInit*, который по сути инициализирует всю библу
 */
export var vom: VDOM = function(elem){

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

// export var vom = lPage;

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


