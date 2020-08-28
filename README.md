<h1 align=center> Soft Page </h1>

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

Main and necessary attribute of **switch** is `data-_refresh`. This attribute contains elements `id`s in DOM needed to be refreshed. For example:

```html
<a href='{% url %}' data-_refresh='content'>Refresh Content</a>
```

This means that on click on `<a>` element portion of the page by id='content' will be reloaded from server side.

More difficult sample of switch: 

```html
<a data-_refresh='main>age.city,section,header'>Some Refresh</a>
```

This means that on click on `<a>` element elements by id equal to 'section','header' and (attention!) 'age' and 'city' contained inside 'main' if its exists (else  'main'). If there are too many inside elements to reloaded, available next note:

```
<a data-_refresh='main>age.*,section,header'>Some Refresh</a>
```

It means all elements inside element with id='main'on the same level with id='age' will be reloaded.

Server address for request is defined:
- for `<a>` in attribute `href`
- for `HTMLButton` inside attribute `formAction`
- for other elements inside custom attribute `data-to`

Example: 

```
<div data-to='/users/' data-_refresh='content,header'>Click me</div>
```

The `data-to` is equivalent `onclick` event calling inside job. 

Except this two attributes **switches** may contain thirth - `data-_require`. This attribute similar `data-_refresh`, but consists of elements that's necessary for requested page, but has not necessity for be updated. its will requested optoonally.
