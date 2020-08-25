
declare global{
    /**
     * {key:value,...}   [val1, val2,...]
     */
    type jsonString = string;       
    /**
     * Sample: mainsetion>section1.section2, <nectSection, nectSection2>*.id_elem1, nectSection3...
     * 
     * description
     * 
     * `,` - перечисление независимых компонентов, которые должны быть отрендерены
     * 
     * `.` - перечиление взаимосвязанных компонентов в одном родительском блоке (контейнере)
     * 
     * `~` - испоьзуется только для требуемых блоков (не для запрашиваемых). Означает состояние
     * 
     * `*` - используется только для запрашиваемых блоков (не для требуемых). Означает сосендний элемент
     * 
     * @example
     * `<id_elem` - означает lazy контейнер, который заведомо неизвестен на этапе рендеринга, 
     * но является конейнером для элемента с `id_elem` 
     * 
     * `mainsetion>section1` - значит, что при отсутствии на странице section1 будет отрендерен mainsetion
     * 
     * `nectSection2>*.id_elem1` - значит "отрендерить id_elem1 и все соседние элементы с id". 
     * если id_elem1 не существует, то отрендерить nectSection2
     * 
     */
    type mapString = string;
    /**
     * /images/img.png
     */
    type UrlString = string;     
    /**
     * id HTML-элемента
     */
    type Id = string;   
}

export var u = {
	pop : function(dict: object, key: string) : undefined | any{

        if (dict[key] === undefined) return key;
                    
        let rez = dict[key];
        dict[key] = null;
        return rez;			
    },    

	params : function(dict: object) : string {

        let r = "";

        for(var key in dict) r += key + "=" + dict[key] + "&";
        if (r) r = r.slice(0,-1);
        return r;
    }    

}