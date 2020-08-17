
type IDoc = { obj?: string; };
type Dom = Document & IDoc;

export var dom1: Dom = window.document;
// dom1.obj = "1";
dom1['obej'] = "1";