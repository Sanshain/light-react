
import {dom, search_fixed, loc } from "./common"
import {vom, render_page} from "./base"
import { Ajax } from "./ajax";

var Leaser = {
	responseTime : 500,									// response time waiting
	animationTime : 500,								// animation time (must match vs in/out css)
	steps : 7,											// quantity of attempts to catch response

	showStyle:'come_in',
	hideStyle : 'come_out',	
	onErroStyle : 'resp_err',
	leafStyle : 'come',									// animation style

	onShowEvent : () => {},
	onHideEvent : () => {},
	onErrorEvent : () => {},
	
	Styles : {										// style for animation		
		onHide : 'come_out', 						
		onVisible : 'come_in',
		onLeaf : 'come'				
	},		
}


export function fragment_refresh(event: Event){

	var rm = null;
	if (rm = RefreshManager.Initialize(event)){
		
		rm.Commit();
	}
}	


/*!
	e - expected event object
*/
type HTMLRouteElement = HTMLAnchorElement | HTMLButtonElement | HTMLInputElement;
RefreshManager.Initialize = function(event: Event){	

	var e = event;


	/*! 
		Находит ссылку для перехода для ie8-
	
	*/
	var data_to___get = function(elem, deep){

		var dtto = elem.getAttribute('data-to');

		if (dtto) return dtto;
		if (!dtto && --deep>0)
			return data_to___get(
				elem.parentElement, deep
			);
		else
			return false;
	}	

	var e_target = (e.currentTarget || e.srcElement) as HTMLRouteElement;	//target
	
	//если это ссылка, берем из адреса
	// если нет, то берем из data-to	

	var set_url = null;
	var target = (e_target as HTMLAnchorElement).href ?
		(e_target as HTMLAnchorElement).href.substr(location.origin.length) :
		e_target.getAttribute('data-to');
	

	//если есть атрибут name, то адрес запроса на него
	if (!target && e_target.name) {
		
		target = e_target.name ? '/'+e_target.name+'/' : ''; 			
		set_url = (e_target as HTMLButtonElement).formAction;
	}
	
	//если есть атрибут formAction, берем из атрибута
	target = target || (e_target as HTMLButtonElement).formAction; // для ie8	
	target = target ||data_to___get(e_target, 3);  //(если e_target == esrcElement), ищем 'to'

	
	if (!target) throw new Error('Leaser cant be initialized without target specify');

	//исключительно для <ie10 - прямой переход:
	if (!window.atob) document.location.href= set_url||target;
	else {
		e.preventDefault();				

		
		var _rm = new irl.RefreshManager(e);
				
		_rm.target = target;
		_rm.set_url = set_url;

		return _rm;			//если нет, кастомизируем
	};
}







namespace irl{

	export class RefreshManager{
		
		aim_blocks:string[];			
		private e_target : HTMLElement;
		
		private responsed_content : any = null;	
		private root_elem : string;			// =root_elem || 'content';   	//obsolete

		private unique_templates: string[];

		nec_blocks: string[];
		target: string;
		set_url: urlString;

		constructor(e: Event, _root_elem?: string){

			this.root_elem = _root_elem || 'content';
		}

		get_boxes(block_name: mapString): (NodeListOf<HTMLElement> | HTMLElement[]) | HTMLElement {

					
			var details: string[] = block_name.split(">");
			var _box: HTMLElement = null;
			var _lazy_box: string = null;
			
			if (details[0][0]=='<') {
										
				var _source_elem = dom.elem((_lazy_box = details[0]).slice(1));				//doc.get
				_box = vom.parent_container(_source_elem);
			}
			else 
				_box = document.getElementById(details[0]);
			
			if (!_box) throw new Error('root element is not fount');
			
			var _boxes: NodeListOf<HTMLElement> | HTMLElement[] = []; 		// боксы для анимации
			
		
			if (details[1]){
		
				var signs = details[1].split('.');				
				var sign = signs.indexOf('*');
								
				if (sign==0){									//если не заданы одноуровневые поля
										
					//такого случая пока нет, но скорее всего брать все дочерние с id //(либо data-state)
					//вместо всего для бокса:
					
					_boxes=_box.querySelectorAll('[id]');					
					this.aim_blocks.push('*'+_box.id);					
				}			
				else if(sign>0){

					var sample = _box.querySelector('#'+signs[0]);						

					if (sample){ 								//если типовой элемент найден
					
						// var _container = vom.parent_container(sample);//вставить ниже _container.querySelectorAll
						//вместо всего для бокса:
						
						_boxes =_box.querySelectorAll('[id]');

						this.aim_blocks.push('*'+_box.id);
						//применяем content_waiting к каждому элементу
					}
					else{
						//значит надо обновить корневой элемент: ничего не делаем
					}					
				}				
				else{

					//если нет обощителя, значит ищем каждый указанный элемент
					for(var key in signs)
					{
						var line: HTMLElement = _box.querySelector('#'+signs[key]);

						if (line) {
							(_boxes as HTMLElement[]).push(line);
							this.aim_blocks.push(signs[key]);
						}
						else{
							
							(_boxes as HTMLElement[]).push(_box);
							this.aim_blocks.push(details[0]);break;											
						}
					}								
				}		
			}

			if (!(_boxes as HTMLElement[]).length) 
			{
				this.aim_blocks.push(_lazy_box ? _lazy_box : _box.id);		
				
				return _box;
			}
					
			return _boxes; //_lazy_box			
		}
		


		/** Составляет список дополнительных блоков для запроса к серверу, которые должны быть на странице
		 * 
		 * Все ,как в обычном mapString для data-_refresh, + `|` и `~` - разделители элемента и состояния
		 * 
		 * // for example `aside~state>note_create,section`
		 * 
		 */
		requested_blocks_by_require(){				
		
			var req_attr: mapString = this.e_target.getAttribute('data-_require'); // получаем схему элементов				

			var requared_blocks = req_attr ? req_attr.split(',') : [];	// разделяем схему на основные блоки
			
			// проходим каждый из них:
			for(var key in requared_blocks){
				
				// example: `aside~state>note_create`
				// example: `section~user_block,aside`
	
				this.checkRequire(requared_blocks[key]);
						
				/*итого: не запрашивает блок с сервера, 
					- если у контейнера есть дочерние элементы и не задан r_state либо 
					- если задан задан r_state, совпадающий с state 
				* не запрашивает подблоки: 
					- если они содержат дочерние элементы (пока так)
					//*/			
			}
			
			return this.nec_blocks;
			
		}
			
		private checkRequire(currentBlock: string) {			

			var tree: string[] = currentBlock.split('>'); // отделяем корневой компонент от подэлементов
			var blockDetail: string[] = tree.shift().split(/[\~\|]/); // отделяет название элемента от его состояния
			var r_blockId: string = blockDetail.pop(); //извлекаем id элемента			

			var requireBlock: HTMLElement = dom.elem(r_blockId);			// получаем сам элемент
			var blockState = blockDetail.length ? blockDetail.pop() : '';	// извлекаем целевое состояние элемента
			var state = (requireBlock && blockState) ? vom(requireBlock).state : ''; // извлекаем текущее состояние

			//есть requiredBlock и blockState:
			//для выполнения условия requiredBlock должен быть thruthy, а state==blockState. Если нет - делаем запрос
			if (blockState && (blockState != state)) this.nec_blocks.push(r_blockId + '|' + blockState);
			else if (!requireBlock || requireBlock.children.length == 0) {

				this.nec_blocks.push(r_blockId);
			}
			else { //здесь надо проверить под_элемент:					

				let subElems: string[] = tree.pop().split('.')
				if (!subElems){

				}
				else for(let subb_id of subElems) {

					let elem = dom.elem(subb_id);
					if (!elem){

						this.nec_blocks.push(r_blockId); break;
					}

					if (dom.elem(subb_id)?.children.length == 0) this.nec_blocks.push(subb_id);					
					
				};

			}
		}

		private _animate(elem: HTMLElement, visible: boolean){
			
			if (visible == false){ // скрываем			
				
				//назначаем класс трансформации:										
				elem.classList.Toggle(Leaser.showStyle, Leaser.hideStyle);
				
				//удаляем класс трансформации по истечении animationTime
				setTimeout(() => elem.classList.remove(Leaser.leafStyle), Leaser.animationTime);				
			}
			else if(visible) {		//показываем			
			
				var _content = null;
				
				//тут была идея написать спец ф-ю, которая ищет элементы с fixed до первого дерева с дочерними элементами больше 1. Эта реализация тоже неплоха:
								
				
				if (elem.id == 'main' || elem.id == 'content'){
	
					_content = search_fixed(elem, 3);				
					if (_content) var tmp_poser = new TmpPoser(_content);				
				}
	
				
				setTimeout(function(){
				//показывает информацию через 1 сек:
				
					//возврат в top после анимации, чтобы не скроллился				
					
					elem.classList.remove(Leaser.showStyle, Leaser.hideStyle);
					elem.classList.add(Leaser.Styles['none']);		//turn to none style transfer					
				
					if (_content) tmp_poser.revive();
					
					//вместо этого можно восстановить исходный: elem.style.transition = '';
					setTimeout(() => elem.style.transition = Leaser.animationTime + 's', 40); //for slow transfer!*/
					
				}, Leaser.animationTime * 2);						
	
				//назначаем класс трансформации in:				
				elem.classList.Toggle(Leaser.hideStyle, Leaser.showStyle);							
			}
		};							
			

		/** регулярует вызов функции анимации для каждого блока и подблока после получения данных
		 * @param deep - глубина ожидания
		 * @param box - блок, для которого ожидается анимация
		 */
		private _await__animate(deep: number, box: HTMLElement){

			console.log(deep + ' - waiting for ' + box.id);
			
			
			if (!deep) {
				//animation отсутствия интернета

				alert('нет соединения с сервером (здесь должна быть анимация ожидания)');				
				return false;
			}		
			
			let self = this;
			
			setTimeout(function(){
				
				if (self.responsed_content){

					render_page(
						self.responsed_content.pop() as string, 
						self.responsed_content.pop() as string
					);	
					
					//происходит анимация
					setTimeout(function(){ //box.style.opacity =1;
												
						//box.className = 'block';
						this._animate(box, true);
					}, 40);
				}
				else {
					
					self._await__animate(--deep, box);
				}

			//время ожидания сервера:
			}, (Leaser || {}).responseTime || 700);
		}	


		package_animate (block_name: string){
			
			var _boxes = this.get_boxes(block_name);
			
			if ((_boxes as (HTMLElement[]|NodeListOf<HTMLElement>)).length){
				
				for (var k=0;k<(_boxes as HTMLElement[]|NodeListOf<HTMLElement>).length;k++){
					
					this._animate(_boxes[k], false);					
					this._await__animate(Leaser.steps, _boxes[k]);
				}
			}
			else{

				this._animate(_boxes as HTMLElement, false);				
				this._await__animate((Leaser || {}).steps || 0, _boxes as HTMLElement);
					
				//! перенес внутрь 	get_boxes		
				//self.aim_blocks.push(_boxes.id);			
			}
			
		}


		public Commit (optional: string[]){
			
			//получаем аргументы:
			var ps = /(\d+)\/{0,1}$/i;
			
			var arg = this.target.match(ps)|| loc.pathname.match(ps);
			
			var args: string|(string[]) = arg ? arg.slice(1) : [];
			if (optional)
			{			
				args = (args as string[]).concat(optional);
			} 
			
			
			var box_onload = function (resp, set_url) //
			{
				this.responsed_content = [this.set_url||set_url, resp];
			}
				
			var ajax = new Ajax(this.target, box_onload);
			
			ajax.set_url = this.set_url;
			ajax.onfail = function(){
				//#if DEBUG
				//здесь может быть относительно 
				// навязчивое сообщение о том, что 
				//ваш браузер не поддерживает 
				//автоматические переходы
				console.trace();
				alert('ваш браузер не смог осуществить частичное обновление контента страницы.'+
				' Нажмите ок, чтобы перейти напрямую');	
				//#endif			
				document.location.href = this.target;
			};
			
			//var args = self.target.match(/\d+/g);//аргументы					
			var q = [args, this.nec_blocks, this.aim_blocks];
			
			ajax.submit_json(q);
		}		

	}
} 


/**
 * research option
 */
class TmpPoser {
	propy: string = 'top';
	originValue: number;
	transitionValue: number;				
	style: CSSStyleDeclaration;

	/** Берет элемент со статическим позиционированием и его свойство, 
		заданное в style и соответствующее tmp_poser.propy из его style, 
		(возможны два варианта: top и bottom), получает его значение в пикселях.
		Вычисляют разницу его с глобальным значением в пикселях temp, 
		сохраняет старое значение в origin и назначает свойству propy 
		значение temp в пикселях						
	 * @param _content - элемент, имеющий фиксрованное позиционирование
	 */
	constructor(_content: HTMLElement){
						
		this.propy ='bottom' ? _content.style['bottom'] : 'top';		
		
		var sampleValue: number = parseInt(window.getComputedStyle(_content)[this.propy]);
		var computedValue = this.propy == 'bottom'
			? window.innerHeight - _content.offsetTop - _content.offsetHeight
			: _content.getBoundingClientRect().top;

		this.transitionValue = sampleValue - computedValue;
		

		if (_content.style[this.propy]) this.originValue = _content.style[this.propy];
		else{
			
			// this.originValue = window.getComputedStyle(_content)[this.propy];
		}
		
		_content.style[this.propy] = this.transitionValue + 'px';
		// _content.style[this.propy] = transitionStyle
		this.style = _content.style;				
	};
	revive() {
		
		this.style[this.propy] = this.originValue;
		// _content.style[this.propy] = no_transitionStyle

	};
};




function RefreshManager(e: Event, root_elem?: HTMLElement){
	
	
	
	/*!
		Возвращает боксы для анимации (если есть)
		и пополняет aim_blocks
	*/
	this.get_boxes = function(block_name: mapString){
		
		
		var details = block_name.split(">");

		var _box = null;
		var _lazy_box = null;
		
        // 
		if (details[0][0]=='<') {
			
			_lazy_box = details[0];
			
			var _source_elem = dom.elem(_lazy_box.slice(1));	//doc.get
			_box = vom.parent_container(_source_elem);
		}
		else 
			_box = document.getElementById(details[0]);
		
		if (!_box)
			throw new Error('root element not found');
	
		var _boxes = []; 		// боксы для анимации		
		
		if (details[1]){
		
			var signs = details[1].split('.');
			
			var sign = signs.indexOf('*');
			
			if (sign>=0){
				if (sign==0){
					//если не заданы одноуровневые поля
					
					//такого случая пока нет, но скорее всего брать все дочерние с id //(либо data-state)
					//вместо всего для бокса:
					
					_boxes=_box.querySelectorAll('[id]');
					
					self.aim_blocks.push('*'+_box.id);					
				}			
				else{
					var sample = _box.querySelector('#'+signs[0]);	
					
					
					if (sample){
					//если типовой элемент найден
					
						// var _container = vom.parent_container(sample);//вставить ниже _container.querySelectorAll
						//вместо всего для бокса:
						
						_boxes=_box.querySelectorAll(
							'[id]'
						);
						self.aim_blocks.push('*'+_box.id);
						//применяем content_waiting к каждому элементу
					}
					else{
						//значит надо обновить корневой элемент: ничего не делаем
					}					
				}
			}
			else{
				//если нет обощителя, значит ищем каждый указанный элемент
				for(var key in signs)
				{
					var line = _box.querySelector(
						'#'+signs[key]
					);
					if (line) {
						_boxes.push(line);
						self.aim_blocks.push(signs[key]);
					}
					else{
						
						_boxes.push(_box);
						self.aim_blocks.push(details[0]);break;				
						
					}
				}								
			}		
		}

		if (!_boxes.length) 
		{
			self.aim_blocks.push(_lazy_box ? _lazy_box : _box.id);		
			
			return _box;
		}
				
		return _boxes; //_lazy_box
	}
	
	

	function requested_blocks_by_require(){	
	
		// for example `aside|state>note_create.section`
	
		var req_attr = this.e_target.dataset['_require'];
		
		var r_blocks = [];	
		
		var requared_blocks = 
			req_attr ? req_attr.split('.') : [];
		
		
		for(var key in requared_blocks)
		{
			// example: `aside|state>note_create`
			// example: `section~user_block.aside`

			var tree = requared_blocks[key].split('>');
			var detail = tree.shift().split(/[\~\|]/);
			var b_id = detail.pop(); //id элемента			

			
			var	required_block = dom.elem(b_id);
			
			
			
//!			
			var r_state =detail.length ? detail.pop(): '';
			var state = '';			
			
			if (required_block && r_state){
				
				//получили блок / теперь необходимо получить его состояние:				
				state = vom(required_block).state;
//!
				
			}
			
			//теперь у нас есть required_block и r_state:
			//для выполнения условия required_block должен быть thruthy, а state==r_state
			
			

			
			if (r_state && (r_state != state)){ 	
			//тогда id с состоянием
			
				r_blocks.push(b_id + '|' + r_state);
			}
			else if(!required_block ||
				!required_block.children.length)
			{
				r_blocks.push(b_id);
			}
			else {
			//здесь надо проверить под_элемент:
				
				var subb_id = tree.length ? tree.pop() : null;
				
				if (!subb_id) {
				//если нет требуемых подэлементов,то чистим все подэлементы требуемого блока:
					
					var contnr = required_block.querySelector(
						'[data-state]'
					);					
					
					if (contnr) contnr.innerHTML = '';   
				}
				else if (!dom.elem(subb_id).children.length){
//! ?					
					let sub_block = dom.elem(subb_id); // ?!?!?!
					r_blocks.push(sub_block);
				}
				
			}

				
			/*итого: не запрашивает блок с сервера, 
				- если у контейнера есть дочерние элементы и не задан r_state либо 
				- если задан задан r_state, совпадающий с state 
			* не запрашивает подблоки: 
				- если они содержат дочерние элементы (пока так)
				//*/
		
		}
		
		return r_blocks;
		
	}
		
						
	function _animate(elem, visible){
		if (!visible){ // скрываем			
			
//!			
			//назначаем класс трансформации in:			
			//elem.classList.add('a_hide');
			
			elem.classList.remove(Leaser.Styles['in'],Leaser.Styles['none']);
			elem.classList.add(Leaser.Styles['out']);
				
			var _content = search_fixed(elem);
			
			var tmp = 0;
			
			if (!_content) return;
			else 
				tmp = _content.style.top;
				_content.style.top = '0';
				
			setTimeout(function(){
				
				//удаляем класс трансформации in:
				//elem.classList.remove('a_hide');
				
				_content.style.top = tmp;
			}, Leaser.animationTime);
			
		}
		else{
		//показываем:
		
			var _content = null;
			
			//тут была идея написать спец ф-ю, которая ищет элементы с fixed до первого дерева с дочерними элементами больше 1. Эта реализация тоже неплоха:
			
			//var stor_style = {}; 			//null
			var tmp_poser = {
				propy : 'top',						
				origin : 0,						
				_cstyle : null,
				/*!
					\brief
						Берет элемент со статическим позиционированием и его свойство, 
						заданное в style и соответствующее tmp_poser.propy из его style, 
						(возможны два варианта: top и bottom), получает его значение в пикселях.
						Вычисляют разницу его с глобальным значением в пикселях temp, 
						сохраняет старое значение в origin и назначает свойству propy 
						значение temp в пикселях
					
					\param
						 _content - элемент, имеющий фиксрованное позиционирование			
				*/
				init : function(_content){
					var cstyle = _content.style;
					
					if (cstyle['bottom'])this.propy ='bottom';
					
					
					var temp = null;
					var diff = parseInt(
						window.getComputedStyle(
							_content
						)[this.propy]
					);
					
					
					if (this.propy == 'bottom'){
						temp = diff - 
							(window.innerHeight - 
							(elem.offsetTop + 
							elem.offsetHeight));
					}
					else{					
						
						temp = diff - elem.getBoundingClientRect().top; //offsetTop? - почему-то 0 для ava
					} 					
					
					if (cstyle[this.propy]){
						this.origin = cstyle[this.propy];
					}else
					{
						this.origin = 
							window.getComputedStyle(
								_content
							)[this.propy];
					}
					
					cstyle[this.propy] = temp + 'px';
					this._cstyle = cstyle;
					
					return temp;
				},
				revive : function() 
				{
					this._cstyle[this.propy] = this.origin;
				},
			}
			
			if (elem.id == 'main' || elem.id == 'content'){

				_content = search_fixed(elem, 3);				
				if (_content){
//!
					tmp_poser.init(_content);
				}				
			}

			
			setTimeout(function(){
			//показывает информацию через 1 сек:
			
				//возврат в top после анимации, чтобы не скроллился
				
				//убираем класс out
				//elem.classList.remove('a_show');
				
				
				elem.classList.remove(Leaser.Styles['in'],Leaser.Styles['out']);
				elem.classList.add(Leaser.Styles['none']);		//turn to none style transfer
				//*/
			
				if (_content) tmp_poser.revive();
				
				setTimeout(function(){
//!					
					//вместо этого можно восстановить исходный: elem.style.transition = '';
					
					// elem.style.transition = '0.5s';
				}, 40);//for slow transfer!*/
				
			}, Leaser.animationTime * 2);						

			//назначаем класс трансформации in:
			

			elem.classList.remove(Leaser.Styles['out']);
			elem.classList.add(Leaser.Styles['in']);					
			
			//*/		
			

		}
	}							
	
	
	/*!  регулярует вызов функции анимации...
	
		\brief регулярует вызов функции анимации для каждого..
		блока и подблока после получения данных
		
		@param deep - глубина ожидания
		@param box - блок, для которого ожидается анимация
		
	*/
	function _await__animate(deep, box){
	
		console.log(deep + ' - waiting for ' + box.id);
		
		
		if (!deep) {
			 //animation отсутствия интернета

			alert('нет соединения с сервером (здесь должна быть анимация ожидания)');
			
			return false;
		}										
	
		setTimeout(function(){
			
			if (responsed_content){

				render_page(
					responsed_content.pop(), 
					responsed_content.pop() 
				);	
				
				//происходит анимация
				setTimeout(function(){ //box.style.opacity =1;
					
					
					//box.className = 'block';
					_animate(box, true);
				}, 40);
			}
			else {
				
				_await__animate(--deep, box);
			}			

		//время ожидания сервера:
		}, (Leaser || {}).responseTime || 700);
	}	
	
	
	this.package_animate = function(block_name){
		
		var _boxes = this.get_boxes(block_name);
		
		if (_boxes.length){
			
			for (var k=0;k<_boxes.length;k++){
				
				_animate(_boxes[k], false);
				
				_await__animate(Leaser.steps, _boxes[k]);
			}
		}
		else{
			_animate(_boxes, false);
			
			_await__animate((Leaser || {}).steps || 0, _boxes);
				

//! перенес внутрь 	get_boxes		
			//self.aim_blocks.push(_boxes.id);			
		}
		
	}
	

	this.Commit = function(optional){
		
		//получаем аргументы:
		var ps = /(\d+)\/{0,1}$/i;
		
		var arg = 
			self.target.match(ps)||
			loc.pathname.match(ps);
		
		var args = arg ? arg.slice(1) : [];
		if (optional)
		{			
			args = args.concat(optional);
		} 
		
		
		var box_onload = function (resp, set_url) //
		{
			responsed_content = [self.set_url||set_url, resp];
		}
			
		var ajax = new Ajax(this.target, box_onload);
		
		ajax.set_url = self.set_url;		
		ajax.onfail = function(){
			//здесь может быть относительно 
			// навязчивое сообщение о том, что 
			//ваш браузер не поддерживает 
			//автоматические переходы
			alert('ваш браузер не смог осуществить частичное обновление контента страницы.'+
			' Нажмите ок, чтобы перейти напрямую');
			document.location.href = this.target;
		};
		
		//var args = self.target.match(/\d+/g);//аргументы
		
		
		var q = [args, nec_blocks, self.aim_blocks];
		
		ajax.submit_json(q);		
	}
	
	



				/* блок инициализации: */

	var self = this;
	
	var e_target = e.currentTarget;
	
	var responsed_content = null;	
	var root_elem=root_elem || 'content';   	//obsolete
	
	var unique_templates = e_target.dataset['_refresh']
			.replace(/[\s]+/,'')
			.split(',');	
	
	
	this.aim_blocks = [];			// id блоков для запроса 
	
	
	
					/* блок выполнения: */
	
	for (var key in unique_templates){
		
		this.package_animate(unique_templates[key]);
	}
		
	var nec_blocks = requested_blocks_by_require();

	//внутри этих блоков проверяем и удаляем лишние элементы:
	/* 
	//вроде как это реализовано в requested_blocks_by_require
	
	for(var key in nec_blocks){
		
		var contnr = nec_blocks[key].querySelector(
			'[data-state]'
		);
		contnr.innerHTML = '';
		
	}//*/
	

	//var blocks = aim_blocks.concat(nec_blocks);
	
		
	
}





