
export declare var FormData : {
	new(form?: HTMLFormElement): FormData;
	prototype: FormData;
	create: (key: string, value: string) => FormData;
}



declare global{
	type Input = HTMLInputElement | HTMLTextAreaElement	
		
	interface HTMLFormElement{
		extract(data?: object) : object;
	}	
}



