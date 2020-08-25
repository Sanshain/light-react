
import { dom, Elem } from "./common";
import {fragmentRefresh} from "./snippet";


// ((elem : HTMLElement) => {state? : string}) 
/**
 * Тип для vom
 */
type Extension = {	

	spa?: boolean;

	reInit? : (elem: HTMLElement) => void;

	add? : (container : string| HTMLElement, elem:string|HTMLElement, cls?:string) => HTMLElement;
	create? : (tagname: string, attrs: object) => HTMLElement;		
	parent_container? : (cfield:HTMLElement) => HTMLElement;
};//*/

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
		
	/**
	 * Ищет родительский контейнер с заданным id. 
	 * Как вариант еще добавить поиск по атрибуту data-_refresh	
	 * @param cfield 
	 */
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
	vom.reInit = function(elem?: HTMLElement){

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


type StateObject = {state? : string, elem: HTMLElement, kernel?: HTMLElement};
/** Возвращает объект с состоянием элемента
 * 
 * @param elem - элемент, для которого необходимо определить состояние
 * @description - **состояние** - это содержимое атрибута *data-state* текущего элемента либо одного из дочерних
 * [либо (id || class) дочерних]
 * 
 * @static - содержит статические методы, в тч *reInit*, который по сути инициализирует всю библу
 */
export var vom: ((elem : HTMLElement) => {state? : string, elem: HTMLElement}) & Extension = function(elem){

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



/** render for part of page..
 * 
 * Рендерит необходимую часть страницы после получения ответа от сервера
 * @param data - ответ от сервера (данные для рендеринга)
 * @param url - url для изменения в адресной строке браузера
 * 
 * @summary Вызывается в методе `_await__animate` *RefreshManager*-a
 */
export var renderPage = function(data: jsonString, url: string){					

	while(typeof data == "string") data = JSON.parse(data);
	
	var view = new Viewer(data).render();	
	
	view.routers_initialize(vom.reInit);
	
	
	if (url)// если это не происходит здесь, то остается (для несущ изм)
	{
		
		var closed_page = view.create_stored_page_and_go(url);
		/*
		alert('меняем адрес в render_pagу: '
			+ JSON.stringify(Object.keys(closed_page)));
		*/
	}
};



class AbstractViewer {
	
	/*! Get or find property_name for replacement its value
		
		Имя свойства для переопределения может быть разное. Эта функция определяет его для каждого конкретного элемента
		
		по дефолту используется для анимации
	*/	
	property(field : HTMLElement, view?: string){ //		

		var contentAttr = view
			? (view.trim().startsWith('<')?'innerHTML':'innerText')
			: (field.children ? 'innerHTML' : 'innerText');
		
		var i=-1; var attr = ''; var attrs = ['src', 'href', 'value', contentAttr];				// don't chanage the order src and href for ie support

		while(field[ attr=attrs[++i] ] == void 0) if (i == attr.length - 1) break;

		return attr;
	}	
}

// function Renderer(boxes: any){ return render_page; }


/** Class for present new part of page...
 * 
 * Рендерит поля страницы на основе входных данных *data*.
 * Вызывается внутри *renderPage(data, url)*
 */
export class Viewer extends AbstractViewer{
	
	private _containers: HTMLElement[] = [];
	private __container_rebuild(){
		var container = document.getElementById('content');
		
		return vom.add(container, vom.create('div',{
			id:'main'
		})); 
	}

	private new_view: object;
	private stored_data: object = {};

	/**
	 * 
	 * @param data - содержит id элементов в качестве ключей и их новые представления в качестве значений
	 */
	constructor(data: object){			
		
		super();					
		this.new_view = data as object;
	}

	/**
	 * Рендер при переходе "назад"
	 */
	render_back(){
	
		//alert(0);
		console.log(history.state);
		
		for(let key in history.state) {
			
			var field=document.getElementById(key.toLowerCase());
			var view = history.state[key];			
			
			if (typeof view == "string") 
				
				field[this.property(field, view)] = view;
				
			else if (typeof view == "object")
			{
				for (let k in view) 
				{

					if (k.startsWith('on')) field.setAttribute(k, view[k]);
					else 
						field[k] = view[k];
				}
			}			
		}		
		
	}	

	/**
	 * Рендер всех полей, указанных в `new_view`
	 */
	public render (){

		for (let key in this.new_view) this.render_field(key, this.new_view[key]);
		
		return this;
	}

	/**
	 * Сохраняет состояния текущих объектов в history и добавляет туда текущий адрес без данных
	 * @param to_url - ссылка для перехода
	 */
	public create_stored_page_and_go (to_url : UrlString){		

		if (this.stored_data){

			history.replaceState(this.stored_data, null, document.location.pathname);				
			history.pushState(null, null, to_url);			
		}
		else 
			new Error('stored_data is not defined. Call `render` first');
		
		return this.stored_data;
	}



	/**
	 * Render certain field:
	 * 
	 * Ищет элемент key на странице и заполняет его содержимым
	 * @param key - специально сформированная строка, содержащая id элемента, который нужно отрендерить
	 * @param view - новое содержимое элемента
	 * @param component - элемент, куда должен быть размещен описательный тег при создании
	 */
	private render_field(key: string, view: string, component?: HTMLElement): void{
		
		var field: HTMLElement = this.find_field(key);					// находим component	
		
		//#if DEBUG
			if (!field) console.log('Component not found and must be recreated');
		//#endif

		if (!field){	// если компонент не найден, но ключ содержит одну из метод создания
			
			if (/link\*/.test(key)) this.__createLinks(view, component);	// это для тега <link>
			else if (key.startsWith('dynamic_c')){						// это для тега <script>

				if (dom.elem(key)) return;

				let script = Elem("script", "").vs({src : view, type: "text/javascript", id: key});
				(component || document.head).appendChild(script);					
			}
		}
		else if(field){
			
			if(typeof view == "string"){

				var attr = this.property(field, view);						
				this.stored_data[key] = field[attr]; 			
				field[attr] = view;
							
				if (attr=='innerHTML') this._containers.push(field);				
			}
			else if(typeof view == "object"){

				this.stored_data[key] = {};
				for (let k in view as String) 
				{
					if (1+['object','function'].indexOf(typeof field[k]))
					{
						this.stored_data[key][k]=field.getAttribute(k);
					} else this.stored_data[key][k]=field[k];
					
					if (k.search(/^(on|data-)/) == 0)
					{
						field.setAttribute(k, view[k]);
					} 
					else 
						field[k] = view[k];
				}				
			}
		}
		//#if DEBUG
		else throw new Error('unexpected field on key = ' + key)		
		//#endif

	};		
	
	/**  Создает теги link и помещает их в "голову" документа
	 * 
	 * @param view - содержимое href в формате "<path> <filename> <filename> ..."
	 * для генерации тегов <link>. Наример для "style/ 1 2" будут сгенерированы:
	 * 
	 * <link href="style/1.css" rel="stylesheet"></link>
	 * <link href="style/2.css" rel="stylesheet"></link>
	 */
	private __createLinks(view: string, component?: HTMLElement) {		

		var views: string[] = view.split(' '), i = 1; 

		while (i < views.length) {

			var istyle = Elem('link','').vs({
				href: views[0] + views[i++] + '.css',
				rel : "stylesheet"});

			(component || document.head).appendChild(istyle);
		}
	}



	private find_field(key: string) {
		var field: HTMLElement = null;

		if (key[0] == '<') { // если присутствует ключ контейнера,

			let cfield = dom.elem(key.slice(1).toLowerCase());
			field = vom.parent_container(cfield); // то ищем компонент-контейнер;
		}
		else
			field = document.getElementById(key.toLowerCase()); // иначе просто берем компонент.
		return field;
	}

	routers_initialize (func: (elem: HTMLElement) => void)
	{
		
		if (!vom.spa)  vom.spa = true; 
		
		for(var i=0;i<this._containers.length;i++) func(
			this._containers[i]
		);
	}		

}





//vom = {};
//vom(elem).state





/*!
	Собирает данные со страницы для анимации во время
	подгрузки данных с сервера и их рендеринга	
*/
function preview_loader(){
	
	//TODO
}
