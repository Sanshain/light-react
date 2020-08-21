import { dom } from "./common";



namespace om{

	// ((elem : HTMLElement) => {state? : string}) 
	export type Extension = {	
	
		spa?: boolean;
		reInit? : Function;
		
		add? : (container : string| HTMLElement, elem:string|HTMLElement, cls?:string) => HTMLElement;
		create? : (tagname: string, attrs: object) => HTMLElement;
		parent_container? : (cfield:HTMLElement) => HTMLElement;
	};//*/
	

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

	/*!
		Ищет родительский контейнер. Как вариант еще добавить поиск по атрибуту data-_refresh
	*/
	vom.parent_container = function(cfield:HTMLElement){
		
		var _root = cfield.parentElement;
		
		if (_root.id) {
			
			return _root;
		}		
		else 
			return vom.parent_container(_root);

	}
}


export var vom: ((elem : HTMLElement) => {state? : string}) & om.Extension = function(elem){

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



/*! render for part of page...

	@param data - ответ от сервера (данные для рендеринга)
	@param url - url для изменения в адресной строке браузера
*/
export var render_page = function(data: jsonString, url: string){					

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




						/* class Viewer*/

/*! Class for present new part of page...

	Рендерит поля страницы на основе входных данных
*/

namespace irt{

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

		constructor(data: object){			
			
			super();					
			this.new_view = data as object;
		}

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

		render (){

			for (let key in this.new_view) this.render_field(key, this.new_view[key]);
			
			return this;
		}

		create_stored_page_and_go (to_url : string){
		
			if (this.stored_data){

				history.replaceState(this.stored_data, null, document.location.pathname);				
				history.pushState(null, null, to_url);			
			}
			else 
				new Error('stored_data is not defined. Call `render` first');
			
			return this.stored_data;
		}


		/*! Render certain/definite fielt for view	
			Ищет эелемент key на странице и заполняет его view
		*/
		render_field(key:string, view: string){
			
			var field=null;
			
			if (key[0] == '<')
			{
				let cfield = dom.obj(key.slice(1).toLowerCase());

				field = vom.parent_container(cfield);
			}
			else
				field =document.getElementById(key.toLowerCase());
			
			
			if (!field) 
				console.log('rebiuld_container on server');
			
			if (!field && /link\*/.test(key)){
				
				var views = view.split(' ');
				var i=1;while(i<views.length){
					
					var istyle = document.createElement('link');
					istyle.href = views[0] + views[i++] + '.css';
					istyle.rel = "stylesheet";
					document.head.appendChild(istyle);	
				}
				
				return;
				
			}
			else if (!field && key.startsWith('dynamic_c')){
				//если не найден скрипт
				
				if (dom.obj(key)) return;

				var script = document.createElement('script');

				//if (key.indexOf('in_head') < 0)
				{

					script.src = view;
					script.type = "text/javascript";
				
				}
				//else script.innerText = view;
				
				
				script.id = key;
				document.head.appendChild(script);		
				
				return;
				
			}
			else if (typeof view == "string")
			{	
				
				var attr = this.property(field, view);
							
				this.stored_data[key] = field[attr]; 
				
				field[attr] = view;
				
				
				if (attr=='innerHTML') 
					this._containers.push(field);
					// здесь, по идее, можно еще eval(<script>), но это плохой стиль. Пока откажусь
				
			} 
			else if (typeof view == "object"){
				
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
			
			
			
			else{
				console.log('not find field for key - ' + key);
			}
			
			
		};		
			
		routers_initialize (func: (elem: HTMLElement) => void)
		{
			
			if (!vom.spa)  vom.spa = true; 
			
			for(var i=0;i<this._containers.length;i++) func(
				this._containers[i]
			);
		}		
	
	}
}


/*!


*/
Viewer.prototype = AbstractViewer;
export function Viewer(data: object){
	
	this._containers = [];											//элементы для reInit

	this.__container_rebuild = function(){ /**/
		var container = document.getElementById('content');
		
		return vom.add(container, vom.create('div',{
			id:'main'
		})); 
	}
	
	/*! render part of page from history.state...
	when user back transfer 
	
		Рендерит при возврате назад на основе history.state
		
		(в отличие от render+render_field не сохраняет историю)
	*/
	this.render_back = function(){
		
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
	
	/*! render part of page vs history.state saving...
	
		Ключевой метод этого класса
	*/
	this.render = function(){

		for (let key in new_view) this.render_field(key, new_view[key]);
		
		return this;
	}
	
	/*!	Save history.state before setting/going to next view
	
		@brief create_stored_page_and_go
	*/
	this.create_stored_page_and_go = function(to_url){
		
		if (stored_data){
			history.replaceState(stored_data,null,document.location.pathname);
			
			history.pushState(null, null, to_url);			
		}else 
			new Error('stored_data is not defined. Call `render` first');
		
		return stored_data;
	}

	
	/*! Render certain/definite fielt for view
	
		Ищет эелемент key на странице и заполняет его view
	*/
	this.render_field = function(key:string, view: string){
		
		var field=null;
		
		if (key[0] == '<')
		{
			let cfield = dom.obj(key.slice(1).toLowerCase());

			field = vom.parent_container(cfield);
		}
		else
			field =document.getElementById(key.toLowerCase());
		
		
		if (!field) 
			console.log('rebiuld_container on server');
		
		if (!field && /link\*/.test(key)){
			
			var views = view.split(' ');
			var i=1;while(i<views.length){
				
				var istyle = document.createElement('link');
				istyle.href = views[0] + views[i++] + '.css';
				istyle.rel = "stylesheet";
				document.head.appendChild(istyle);	
			}
			
			return;
			
		}
		else if (!field && key.startsWith('dynamic_c')){
			//если не найден скрипт
			
			if (dom.obj(key)) return;

			var script = document.createElement('script');

			//if (key.indexOf('in_head') < 0)
			{

				script.src = view;
				script.type = "text/javascript";
			
			}
			//else script.innerText = view;
			
			
			script.id = key;
			document.head.appendChild(script);		
			
			return;
			
		}
		else if (typeof view == "string")
		{	
			
			var attr = this.property(field, view);
			
			stored_data[key] = field[attr]; 
			
			field[attr] = view;
			
			
			if (attr=='innerHTML') 
				this._containers.push(field);
				// здесь, по идее, можно еще eval(<script>), но это плохой стиль. Пока откажусь
			
		} 
		else if (typeof view == "object"){
			
			stored_data[key] = {};
			for (let k in view as String) 
			{
				if (1+['object','function'].indexOf(typeof field[k]))
				{
					stored_data[key][k]=field.getAttribute(k);
				} else stored_data[key][k]=field[k];
				
				if (k.search(/^(on|data-)/) == 0)
				{
					field.setAttribute(k, view[k]);
				} 
				else 
					field[k] = view[k];
			}
		}
		
		
		
		else{
			console.log('not find field for key - ' + key);
		}
		
		
	};		
	
	/*! Get or find property_name for replacement its value
		
		Имя свойства для переопределения может быть разное. Эта функция определяет его для каждого конкретного элемента
	*/	
	var property = function(field, view){
		//don't chanage the order src and href for ie support:
		var i=-1; var attr = ''; var attrs = [
			'src',
			'href',
			view.trim().startsWith('<')?'innerHTML':'innerText'
		];
					
		while(!(field[ attr=attrs[++i] ])) if (i>1) break;	

		return attr;		
	};	//*/
	
	
	this.routers_initialize = function(func)
	{
		
		if (!vom.spa)  vom.spa = true; 
		
		for(var i=0;i<this._containers.length;i++) func(
			this._containers[i]
		);
	}
	
	var stored_data = {};
	var new_view = data as object;
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
