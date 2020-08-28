


import { isIe } from "./native_dom"
import { u } from "./native-lang"

import { dom } from "./common";
import { object } from "underscore";
// declare var isIe: () => boolean;


declare var FormData : {
	new(form?: HTMLFormElement): FormData;
	prototype: FormData;
	create: (key: string, value: string) => FormData;
}

var ENCTYPE = 'application/x-www-form-urlencoded';

//: ie8+
function getCookie(name: string) : null|string {
	var cookieValue = null;
	if (document.cookie && document.cookie != '') {
		var cookies = document.cookie.split(';');
		for (var i = 0; i < cookies.length; i++) {										

			var cookie = cookies[i].trim();										//совместимо с ie8
			
			// Does this cookie string begin with the name we want?
			if (cookie.substring(0, name.length + 1) == (name + '=')) {
				cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
				break;
			}//*/
		}
	}
	return cookieValue;
}

/*!
    Принимает в качестве data строку в виде get-параметров или объект, который преобрзуется в эту строку.
*/
function POST_AJAX(data: object|String, url : string){
					
	if (typeof data == typeof null) data = u.params(data);
	
	
	url = url || window.location.href;										// 1 подготовили url
	data = 'csrfmiddlewaretoken=' + getCookie('csrftoken') + '&' + data;	// 0 подготовили данные для отправки

	
	var xhr = new XMLHttpRequest();											// 1. Создаём новый объект XMLHttpRequest			
	
	// 2. Конфигурируем его: GET-запрос на URL /submit
	xhr.open("POST", url, true);											//метод, адрес, асинхрон/неасинхронный
		
	xhr.setRequestHeader('Content-Type', ENCTYPE);							// 3. Устанавливаем заголовк ENCTYPE
	
	xhr.timeout = 3000;
	
	xhr.onreadystatechange = function() {					
		
		if (XMLHttpRequest['status']){										//для ie8
			if (xhr.status != 200) 
			{
				//#if DEBUG
				console.warn("Не удалось отправить запрос: " + xhr.statusText + ' на ' + this.readyState + " этапе");					
				if (this.readyState == 4) alert("POST_AJAX " + xhr.statusText + ' : ' + this.readyState);
				//#endif
			}
		}			
		
		if (this.readyState == 4) {								

			var elem: HTMLElement = document.getElementById(this.responseText).querySelector('.to_friend');
			if (1 + elem.className.indexOf('sended') > 0)			  				//elem.classList.contains('sended')
			{
				elem.innerText = 'Дружить';
				elem.className = elem.className.replace('sended','').trim();		//elem.classList.remove('sended');
			}
			else
			{							
				elem.innerText = 'Раздумать';
				elem.className+= ' sended';											//elem.classList.add('sended');							
			}
			
		}						
			
	}		
	
	xhr.send(data as string);
	
}

//подробно https://learn.javascript.ru/ajax-xmlhttprequest
function POST(data: string|object, func: (response: string)=>void, csrftoken?:string){				
					
	csrftoken = csrftoken || getCookie('csrftoken');	
	data = 'csrfmiddlewaretoken=' + csrftoken + '&' + data;		

	var url = window.location.href;										// 0. получаем url

	var xhr = new XMLHttpRequest();										// 1. Создаём новый объект XMLHttpRequest			
	
	// 2. Конфигурируем его: GET-запрос на URL /submit
	xhr.open("POST", url, true);						//метод, адрес, асинхрон/неасинхронный
		
	xhr.setRequestHeader('Content-Type', ENCTYPE);						// 3. Устанавливаем заголовк ENCTYPE
	
	xhr.timeout = 30000;													// для лонг пул				
	
	var unresponsed = true;
	
	xhr.onreadystatechange = function() {							
				
		if (XMLHttpRequest['status']){										//для ie8
			if (xhr.status != 200) 
			{					
				console.warn("Не удалось отправить запрос: " + xhr.statusText + ' на ' + this.readyState + " этапе");	
				if (this.readyState == 4)  alert("POST " + xhr.statusText + ' : ' + this.readyState);				
			}
		}			
		
		if (this.readyState == 3) console.log('3: ' + this.responseText);

		if (this.readyState == 4 && unresponsed) {	
			
			console.log('4: ' + this.responseText);
			
			unresponsed = false;								
				
			func(this.responseText);
		}		
				
	}		
	
	xhr.send(data);
	
}




interface ContentTypes {
	"multipart/form-data": string;
	"application/x-www-form-urlencoded": string;
}

/**
 * вызывается внутри *refreshManager.Commit()* метода
 */
export class Ajax{

	url: string;
	csrftoken: string;
	callback: (resp: string, set_url?: UrlString) => void;		// функция принятия ответа
	contentType? : keyof ContentTypes;
	multipartJSON : boolean;
	public onfail: Function;
	public set_url: UrlString;

	/**
	 * 
	 * @param url - адрес ссылки для запроса
	 * @param callback - каллбэк функция, которая принмает в качестве параметра ответ от сервера
	 * @param csrftoken - csrftoken
	 */
	constructor(url?: string, callback?: (resp: string, set_url?: UrlString) => void, csrftoken?: string){		

		//#if DEBUG
		if (!isIe()) console.time('server_response_time');	
		//#endif

		this.url = url || document.location.href;			//целевйой урл		
		this.csrftoken = csrftoken;							// csrftoken-токен
		this.callback = callback;									// функция принятия ответа
		this.contentType = null;				
	}

	/**
	 * 		
	 * @param data - данные, отправляемые на сервер
	 * @param func - функция каллбэк
	 * @param url - url для запроса на сервер
	 */
	private __post(data: Object|string, func?: (resp: string, set_url?: UrlString) => void, url? : string){
				
		var xhr = new XMLHttpRequest();						// 1. новый объект XMLHttpRequest					
		xhr.open("POST", url, true);						// 2. Конфигурируем: тип, URL, асинхрон/неасинхронный
		
		if (data instanceof Object) {  
								
			let csrf = u.pop(data, 'csrfmiddlewaretoken') || this.csrftoken ; // на случай в виде json		
			xhr.setRequestHeader("X-CSRFToken", csrf);	

			if (this.contentType == null){	// если только текст, например, и форма не предназначена для передачи файлов																								
				
				xhr.setRequestHeader('Content-Type', 'application/json');				
				data = JSON.stringify(data); 	// на случай json - без преобразования приходит [Object], который не декодируется из body, либо пустая строка				
			}
			else xhr.setRequestHeader('Content-Type', this.contentType || "multipart/form-data");	// для формдата с изображениями, музыкой и пр.			
						
		}
		else
			xhr.setRequestHeader('Content-Type', ENCTYPE);		// 3. Устанавливаем заголовк ENCTYPE

		var self = this;
		xhr.onreadystatechange = function() {					// получаем результат				
					
			if (this['status']){										//для ie8
				if (xhr.status != 200) {					

					let warnLog = "Проверьте соединение с интернетом: ";
					console.warn(warnLog + xhr.statusText + ' в статусе ' + this.readyState);
					
					if (this.readyState == 4) {

						alert(warnLog + xhr.statusText + ' в статусе ' + this.readyState);	
						if (self.onfail) self.onfail();
					}		

					return;
				}
	
			}
			
			if(this.readyState == 4 && this.status == 200)
			{				
				func(this.responseText, self.set_url || url);					

				//#if DEBUG
				if (!isIe()) console.timeEnd('server_response_time');
				//#endif
			}	
		
		}		
		
		xhr.send(data as string|FormData);	
	}




	/*! вернет объект js с полями формы либо
		FormData с полями формы в свойстве texts и полями File
		в зависимости от this.contentType
	*/
	private getdata(frm : HTMLFormElement) : FormData | object { 

		if (this.contentType == null || this.multipartJSON){
			
			let csrfToken = frm.elements[0] as HTMLInputElement;			
			
			var data: object = frm.extract();
						
			//: ie10+
			if(this.multipartJSON){		


				this.contentType = 'multipart/form-data';
				this.csrftoken = csrfToken.value;				
				
				let formData = FormData.create('texts', JSON.stringify(data));
				let files = (frm.querySelector('input[type="file"]') as HTMLInputElement).files;

				for (var i=0;i<files.length;i++) {
					formData.append('images', files[i], i + '.' + files[i].name.split('.')[1]);				
				}
			
				return formData;
			}

			//: ie8+							
			data['csrfmiddlewaretoken'] = csrfToken.value;
			return data;
											
		}

		if (!frm.querySelector('[type=hidden]')) this.csrftoken = getCookie('csrftoken');
		//data.csrfmiddlewaretoken = csrfToken.value;		

		return new FormData(frm);

	};



	/*!
		\brief Отправляет форму, содержащую только текст, как форму 
		
		@param frm - форма для отправки
	*/
	// ie8+
	submit_form (frm : HTMLFormElement) {
		//проход по всем полям формы и конкатирование их с &
		
		//нет плюсов перед JSON за исключением обработки через django-формы на сервере
		
		var data = 'csrfmiddlewaretoken=' + (this.csrftoken || getCookie('csrftoken'));
		
		for (var key=0;key<frm.children.length;key++){
			
			if (['input','textarea'].indexOf(frm.children[key].tagName.toLowerCase()) < 0) continue;
							
			data += '&' + (frm.children[key] as Input).name + '=';
			data += encodeURIComponent((frm.children[key] as Input).value);			
						
		}		
		
		this.__post(data, this.callback, this.url);
		
	}
		

	/*!
	
		\brief Отправляет js-объект, содержащий только текст, как форму
	
		@param data - js-объект для конвертации в json для отправки
	*/
	postData (data : string|Object, func : (resp: string, set_url?: UrlString) => void){
		
		//$("input[name=csrfmiddlewaretoken]").val()
		data = 'csrfmiddlewaretoken=' + 
			(this.csrftoken || getCookie('csrftoken')) + '&' + (this['data'] || data);	
		
		this.__post(data, this.callback || func, this.url);
	}
	
	
	
	/*!
		\brief Отправляет js-объект, содержащий только текст как JSON через ajax
		
		@param data - js-объект для конвертации в json для отправки
	*/
	submit_json (data: string|Object){
		
		this.csrftoken = this.csrftoken || getCookie('csrftoken');
		
		this.__post(data, this.callback, this.url);
	}	
	
	/*!	
		\brief Отправляет форму, содержащую что угодно, в виде JSON
	
		@param frm - форма
		
	
		Для обычного текста реобразуем данные формы в JSON-формат, добавляя CSRFToken как одно из значений
		(в дальнейшем он будет задан в заголовок 
		и удален из JSON-строки перед передачей)
		
		Для multipart - все содержимое будет отправлено как
		FormData (ie10+)		
		
	*/
	post_form (frm : HTMLFormElement, func : (resp: string, set_url?: UrlString) => void){		
		
		var data = this.getdata(frm);
						
		this.__post(data, this.callback || func, this.url || window.location.href);
		
	};	

}
