
import {dom, search_fixed, loc } from "./common"
import { renderPage } from "./render";
import { Ajax } from "./ajax";

// import {vom} from "./base"

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

/** Выполняет частичную перезагрузку страницы
 * @param event - событие, в контексте которого происходит вызов
 * 
 * @see vom.reInit назначает его обработчиком для элементов с атрибутом *_refresh*
 */
export function fragmentRefresh(event: Event){

	var rm = null;
	if (rm = RefreshManager.Initialize(event))
	{		
		rm.Commit();
	}
}	


/**
 * Управляет формированием списков блоков (*up_elems* и *nec_blocks*) 
 * для запроса на сервер и их анимацией на время ожидания ответа
 * 
 * Вызывается внутри *fragmentRefresh()* через статический конструктор *Initialize*
 */
export class RefreshManager{
	
	/**
	 * Считывает и формирует ссылку для запроса на сервер и для перехода (это не обязательно одна и та же)
	 * 
	 * 
	 * - Адрес для навигации (перехода) - берется из атрибута *formAction* кнопки либо формируется из 
	 * аттрибута `href` ссылки
	 * 
	 * - Адрес запроса - из атрибута `name` ссылки или кнопки либо атрибута data-to. 
	 * Если эти атрибуты пусты, то адрес для запроса совпадает с адресом для навигации (либо заменяет его)
	 * 
	 * @param event - expected event object, в контексте которого происходит вызов
	 */
	public static Initialize (event: Event){	

		var e = event;
		
		/** Находит ссылку для перехода для ie8-
		 * @param elem - текущий HTMLElement, в контексте которого происходит вызов
		 * @param deep - глубина рекурсии
		 * @returns ссылку для запроса на сервер
		 */
		//:ie8+
		var data_to___get: (elem: HTMLElement, deep?: number) => UrlString|false = function(elem, deep=0){
	
			var dtto = elem.getAttribute('data-to');
	
			if (dtto) return dtto;
			if (!dtto && (deep--) > 0) return data_to___get(elem.parentElement, deep);
			else
				return false;
		}
	
		var e_target = (e.currentTarget || e.srcElement) as HTMLRouteElement;	//target
				
	
		/** Строка (ссылка) для навигации в строке браузера */	
		var clientUrl : UrlString = null;
		 /** строка (ссылка) для запроса на сервер 
		 * - если это ссылка, берем из адреса
		 * - если нет, то берем из data-to
		 * @type urlString */
		var serverUrl: UrlString|false = e_target.name 				
			? '/'+ e_target.name.replace('-','/') +'/'			// postUrl берем из атрибута name
			: data_to___get(e_target, 2);						// если пустой, то - из `data-to` 
		
		let _url = (e_target as HTMLAnchorElement).href 
			? (e_target as HTMLAnchorElement).href.substr(location.origin.length) 
			: (e_target as (HTMLInputElement|HTMLButtonElement)).formAction;

		if (serverUrl) clientUrl = _url || '';					// если serverUrl задан, назначем clientUrl
		else 													// если нет, то будет только serverUrl
			serverUrl = _url;									
		
		if (!serverUrl) throw new Error("Leaser can't be initialized w/o `serverUrl` definition");
	
		//:ie8+ - прямой переход:
		if (!window.atob) document.location.href= clientUrl||serverUrl;
		//:ie10+
		else {
			e.preventDefault();										
			var rManager = new RefreshManager(e);	
			return rManager.Init(serverUrl as UrlString, clientUrl);			//если нет, кастомизируем
		};
	}

	/**
	 * 
	 * @param serverUrl - строка (ссылка) для запроса на сервер 
	 * @param clientUrl - Строка (ссылка) для навигации в строке браузера
	 */
	public Init(serverUrl: UrlString, clientUrl: UrlString){

		this.target = serverUrl;
		this.clientUrl = clientUrl;	
		return this;	
	}

	/**
	 * список id блоков для запроса 
	 */
	up_elems: Id[];			
	private e_target : HTMLElement;
	
	private responsed_content : any = null;	
	private root_elem : string;			// =root_elem || 'content';   	//obsolete

	private unique_templates: Id[];

	nec_blocks: string[];
	target: string;
	/**
	 * Строка (ссылка) для навигации в строке браузера
	 */
	clientUrl: UrlString;

	/**
	 * 
	 * @param e - event, по которому происходит обновление 
	 * @param _root_elem - корневаой элемент, который будет обновлен в слуае ошибки (@todo or @deprecated)
	 */
	constructor(e: Event, _root_elem?: string){

		this.up_elems = [];			 

		/* блок инициализации: */
		this.root_elem = _root_elem || 'content';							//obsolete			

		this.e_target = e.currentTarget as HTMLElement;								
		this.unique_templates = this.e_target.dataset['_refresh'].replace(/[\s]+/,'').split(',');								
					
		
		/* блок выполнения: */			
		for (var key in this.unique_templates){
			
			// var result = this.find_boxes(this.unique_templates[key]);
			this.animate(this.unique_templates[key]);
		}

		this.nec_blocks = this.figoutNecBlocks();

		// не уверен, что нужна очистка. Поставил заглушку (307 error)

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

	/**
	 * @description
	 * генерирует список элементов, необходимых для отрисовки страницы по результатам запроса,
	 * а так же заносит список их id в **aim_blocks** для запроса на сервер
	 * 
	 * @param block_name - строка с картой элементов, которую необходимо построить по результатам запроса
	 * @returns список элементов, необходмых для отрисовки страницы (либо один элемент)
	 */
	private up_boxes(block_name: mapString): (NodeListOf<HTMLElement> | HTMLElement[]) | HTMLElement {

				
		var blockTree: string[] = block_name.split(">");
		var _box: HTMLElement = null;
		var _lazy_box: string = null;
		
		if (blockTree[0][0]=='<') {
									
			var _source_elem = dom.elem((_lazy_box = blockTree[0]).slice(1));				//doc.get
			_box = vom.parent_container(_source_elem);
		}
		else 
			_box = document.getElementById(blockTree[0]);
		
		if (!_box) throw new Error('root element is not fount');
		
		var aliveBoxes: NodeListOf<HTMLElement> | HTMLElement[] = []; 		// боксы для анимации
		
	
		if (blockTree[1]){									// если задан родительский контейнер через >
	
			var signs = blockTree[1].split('.');				
			var sign = signs.indexOf('*');
							
			if (sign==0){									//если не заданы одноуровневые поля
									
				//такого случая пока нет, но скорее всего брать все дочерние с id //(либо data-state)
				//вместо всего для бокса:
				
				aliveBoxes = _box.querySelectorAll('[id]');					
				this.up_elems.push('*'+_box.id);					
			}			
			else if(sign>0){

				var sample = _box.querySelector('#'+signs[0]);						

				if (sample){ 								//если типовой элемент найден
				
					// var _container = vom.parent_container(sample);//вставить ниже _container.querySelectorAll
					//вместо всего для бокса:
					
					aliveBoxes =_box.querySelectorAll('[id]');

					this.up_elems.push('*'+_box.id);
					//применяем content_waiting к каждому элементу
				}
				else{
					//значит надо обновить корневой элемент: ничего не делаем
				}					
			}				
			else{ 											// w/o `*`

				//если нет обощителя, значит ищем каждый указанный элемент
				for(var key in signs)
				{
					var line: HTMLElement = _box.querySelector('#'+signs[key]);

					if (line) {
						(aliveBoxes as HTMLElement[]).push(line);
						this.up_elems.push(signs[key]);
					}
					else{
						
						(aliveBoxes as HTMLElement[]).push(_box);
						this.up_elems.push(blockTree[0]);
						break;									
					}
				}								
			}		
		}

		if (!(aliveBoxes as HTMLElement[]).length) 
		{
			this.up_elems.push(_lazy_box ? _lazy_box : _box.id);		
			
			return _box;
		}
				
		return aliveBoxes; //_lazy_box			
	}
	


	/** Составляет и проверяет список дополнительных блоков для запроса к серверу, 
	 * которые должны быть на странице
	 * 
	 * Все ,как в обычном mapString для data-_refresh, + `|` и `~` - разделители элемента и состояния
	 * 
	 * // for example `aside~state>note_create,section`
	 * @returns - возвращает список id элементов, которые надо запросить дополнительно
	 */
	protected figoutNecBlocks(): string[]{				
	
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
	
	/**
	 * Проверяет состояние реального элемента на соответствие того, что указано в карте/
	 * Если состояние не соответствует, то добавляет в доп список запрашиваемых элементов
	 * @param currentBlock - кусок карты состояний текущего элемента в формате 
	 * `rootBlockDetail[>subElems]`. Sample: `rootBlockId~[state][>subb_id[.subb_id1]]`
	 */
	private checkRequire(currentBlock: mapString) {			

		var blocksTree: string[] = currentBlock.split('>'); // отделяем корневой компонент от подэлементов
		var rootBlockDetail: string[] = blocksTree.shift().split(/[\~\|]/); // отделяет название элемента от его состояния
		var rootBlockId: string = rootBlockDetail.pop(); //извлекаем id элемента			

		var requireBlock: HTMLElement = dom.elem(rootBlockId);			// получаем сам элемент
		var blockState = rootBlockDetail.length ? rootBlockDetail.pop() : '';	// извлекаем целевое состояние элемента
		var state = (requireBlock && blockState) ? vom(requireBlock).state : ''; // извлекаем текущее состояние

		//есть requireBlock и blockState:
		//для выполнения условия requireBlock должен быть thruthy, а state==blockState. 
		// Если не выполянется - добавляем в список для запроса:
		if (blockState && (blockState != state)) this.nec_blocks.push(rootBlockId + '|' + blockState);
		else if (!requireBlock || requireBlock.children.length == 0) {

			this.nec_blocks.push(rootBlockId);
		}
		else { 				// если выполняется, значит надо проверить под_элемент:					

			let subElems: string[] = blocksTree.pop().split('.')
			if (!subElems){								// если подэлементы не прудсмотрены

				throw new Error('307: Не указаны подэлементы для корневого элемента с id ' + rootBlockId)
			}
			else for(let subb_id of subElems) {

				let elem = dom.elem(subb_id);
				if (!elem){

					this.nec_blocks.push(rootBlockId); break;
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

				renderPage(
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

	/**
	 * Вычисляет и формирует блоки внутри элемента-контейнера для запроса на сервер 
	 * и запускает анимацию перехода для каждого из этих блоков
	 * @param elemId - id элемента-контейнера
	 */
	protected animate (elemId: string){
		
		var _boxes = this.up_boxes(elemId);
		
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
		
		/**
		 * каллбэк при ответе сервера
		 * @param resp - ответ с сервера
		 * @param set_url - адрес для браузера, который необходимо установить, по получении валидного ответа
		 */
		var box_onload:(resp: string, set_url?: UrlString) => void = function (resp, set_url?) 	
		{
			this.responsed_content = [this.set_url||set_url, resp];
		}
			
		var ajax = new Ajax(this.target, box_onload);
		
		ajax.set_url = this.clientUrl;
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
		var q = [args, this.nec_blocks, this.up_elems];
		
		ajax.submit_json(q);
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
}





