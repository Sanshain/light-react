<h2 align=center> softPage </h2>

**softPage** is lite weight, reactive client side library for **SPA** (single page applications) building with minimal effort on client side

### What is its charm?

The most important detail is that It works outside the virtual dom concept. 
The developers rejected this idea, because the *virtual DOM* does more work on data processing than the native one.
Thanks to this, sites working on *softPage* are more lightweight and fast on client side than sites working with virtual elements.

In addition, softPage has a very low entry threshold due to its architecture. 
From now on, simple **SPA** can be created by a person who doesn't know javascript absolutly. 
Instead, just need to learn a few html attributes used in **softPage**

### What is it good for?

The lack of a **virtual DOM** idea does not require deploying `SSR` on the server side for `SEO` purposes, whereas the content is loaded when the page itself is loaded. 
This one makes softpage a good solution for working in high-load projects on *golang*, *.NET*, and the like, 
where developers fight for every milli- and sometimes even a nano-second and do not want to spend it on extra http connections. 

Also for the same reason, the solution is a good for low-budget applications on limited hosting capabilities 
(without the ability to deploy `SSR` due to the lack of pre-installed nodejs and lack of rights to install it)


<h2 align=center> How it works? </h2>

The page consist of two types of element: `switches` and `containers`:

<h3 align=center> switches </h3>

`Switches` - is specific routes inside app. Each specific route contains address for request sending and a map of elements that need to be reinitialized after receiving the response from this address. 

Switches can be any HTML elements with the `data-to` attribute, links, or buttons (including input with the button type). However, for SEO purposes, when working with addresses accessible via get, it is recommended to give preference to the last two. All switches in Spa mode work using the post method and may contain up to three data attributes:

- `data-_refresh` - necessary. Contains elements map for server request
- `data-_require` - unnecessary. Contains optional elements map, required on updated page
- `data-to` - usually contains url-address inside HTML-elements, which does not consist of native attributes for url-address holding (like `href` for anchor and `formAction` for button)

<h3 align=center> How switches work </h3>

Attribute `data-_refresh` of some **switch** contains a map consisting of the following comma-separated blocks:

```
[<]section_name[>][[*|(subsection1[.subsection2[.subsection3]])].]subsection
```

The symbols used inside this block have the following meaning:

`.` - separator for specific neighboring blocks on page

`*` - indicates any existing neighboring blocks on page

`>`- indicates container id on left side of the mark and list of child id on right side of the mark

`<` - indicates unknown on render time parent element. It means any container element on top level

For example conisdes following switch:

`<a data-_refresh='mainsection>section1.section2'>Get some data</a>`

the map `mainsection>section1.section2` will be used to create a list of items to request to the server. For example for this html:

```html
<div id=mainsection>
  <div id=section1>
  <div id=section2>
    
</div>
```

Switch returns list of `section1` and `section2` elements to server request, because its exists

for this one: 

```html
<div id=mainsection>
  <div id=section2>
    
</div>
```
returns list of single `mainsection` element, because `section1` does not exists.

Nest example: `mainsection>*.section3` for following html-code: 

```html
<div id=mainsection>
  <div id=section1>
  <div id=section2>
  <div id=section3>
    
</div>
```
returns list of all child elements (`[section1,section2,section3]`) (look `*` meaning)

But for this one

```html
<div id=mainsection>
  <div id=section1>
    
</div>
```

returns just one `mainsection`

More samples:

`<section3`

```html
<div id=mainsection>
  <div id=section3>
    
</div>
```
also returns `mainsection` (the nearest parent container)

Attribute `data-_require` works like `data-_refresh`, but it has a slightly different meaning:
`data-_require` - send a request for each item in the list. If the element specified in it is not present, it will send a request to the nearest parent or root parent
`data-_refresh` - sends a request only to the elements specified in it that are not on the page or their state does not match the required one

For `data-_refresh` status mark assigns optional after mark `~`:

```aside~state>note_create```

Here `state` is the status of the element. For example look this:

```html
<div id=aside data-state=state>
  <div id=section3>
    
</div>
```

or 


```html
<div id='aside'>
  <div id='state'>
</div>
```

and even that

```html
<div id=aside>
  <div class="state ui">
</div>
```

In last case status is defined based on the first class of the child element


<h3 align=center> Containers </h3>

Containers is either elements having id. If container is not detected occurs appeal to root Container (by default id='content'). Otherwise, the page will be completely reloaded
