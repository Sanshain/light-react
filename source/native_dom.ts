
import {FormData} from "./native_dom.d"
export {FormData} from "./native_dom.d"





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




