
// import {FormData} from "./native_dom.d"
// export {FormData} from "./native_dom.d"


export declare var FormData : {
	new(form?: HTMLFormElement): FormData;
	prototype: FormData;
	create: (key: string, value: string) => FormData;
}

declare global{
	type Input = HTMLInputElement | HTMLTextAreaElement	
	/**
	 * 
	 */
	interface HTMLFormElement{
		extract(data?: object) : object;
	}	
	/**
	 * содержит атрибут name
	 */
	type HTMLRouteElement = HTMLAnchorElement | HTMLButtonElement | HTMLInputElement; // (HTMLFormElement)
}

export function isIe(): boolean {
    //@ts-ignore
    return '\v'=='v'
}

namespace FormData_{

	FormData.create = function(key: string, value: string): FormData{
		var formData = new FormData();
		formData.append(key, value);
		return formData;
	}
}

namespace HTMLFormElement_{

	HTMLFormElement.prototype.extract = function (data?: object) : object{		

		var data = data || {};
		
		for(var i=1; i<this.elements.length - 1; i++)   
		{ 
			var elem = this.elements[i] as HTMLInputElement;     
			if (elem.id && elem.type != 'file') data[elem.id] = elem.value;
		}
		
		return data;
	};	
}




