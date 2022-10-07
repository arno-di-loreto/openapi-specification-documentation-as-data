class SpecificationViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  _getCss() {
    let style = document.createElement("style");
    style.textContent = `
    :host {
      --root: #8dccad;
      --leaf: #f5cc7f;
      --node: #7b9fe0;
      --connector-color: green;
      --connector-size: 1px;
      --space: 10px;
    }
    
    .tree {
      display: inline-flex;
    }
    
    .tree ul {
      padding-left: var(--space);
    }
    
    .tree ul .closed {
      visibility:hidden;
      display: none;
    }
    
    .tree , .tree ul, .tree li {
      list-style: none;
    }
    
    .tree li {
      display: flex;
    }
    
    .tree li:first-child {
      margin-top: 2rem;
    }
    
    /* All nodes */
    
    .tree li > div:first-of-type {
      border: var( --connector-size) solid var( --connector-color);
      border-radius: .4em;
      padding: 0.5rem;
      margin-top: 0.5rem;
      max-width: 500px;
      z-index:1;
    }
    
    .tree pre {
      white-space:pre-wrap;
      max-height: 150px;
      overflow:auto;
    }
    
    .tree ul {
      margin: 0;
      padding: 0;
    }
    
    /* Connectors */
    
    .tree li:before {
      background: var( --connector-color);
      content: "";
      width: 20px;
      height: var( --connector-size);
      top: 25px;
      margin:0;
      left:0;
      position: relative;
    }
    
    .tree > li:before {
      content: none;
    }
    
    /* OpenAPI documentation */
    
    .tree .property {
      color: green;
    }
    
    .tree .type {
      color: orange;
    }
    
    .tree .description {
      padding-top: 0.2rem;
      color: lightgrey;
      font-family: monaco, Consolas, 'Lucida Console', monospace;
      font-size: 0.8rem;
      text-align: justify;
    }
    
    .tree .array-item {
      color: blue;
    }
    
    .tree h1 {
      font-family: monaco, Consolas, 'Lucida Console', monospace;
      font-size: 1.2rem;
    }
    .tree .required {
      font-family: monaco, Consolas, 'Lucida Console', monospace;
      font-size: 0.8rem;
      color: red
    }

    .tree .extensible {
      font-family: monaco, Consolas, 'Lucida Console', monospace;
      font-size: 0.8rem;
      background-color: green;
      color: white;
      padding: 0.3rem;
      margin-left: 0.4rem;
      border-radius: 8px;
      vertical-align: middle;
      text-transform: uppercase;
    }

    .tree .rich-text {
      font-family: monaco, Consolas, 'Lucida Console', monospace;
      font-size: 0.6rem;
      background-color: brown;
      color: white;
      padding: 0.2rem;
      margin-left: 0.2rem;
      border-radius: 5px;
      vertical-align: middle;
      text-transform: uppercase;
    }

    .tree .patterned {
      font-family: monaco, Consolas, 'Lucida Console', monospace;
      font-size: 0.6rem;
      background-color: cadetblue;
      color: white;
      padding: 0.2rem;
      margin-left: 0.2rem;
      border-radius: 5px;
      vertical-align: middle;
      text-transform: uppercase;
    }

    .tree .root {
      font-family: monaco, Consolas, 'Lucida Console', monospace;
      font-size: 0.8rem;
      background-color: red;
      color: white;
      padding: 0.3rem;
      margin-left: 0.4rem;
      border-radius: 8px;
      vertical-align: middle;
      text-transform: uppercase;
    }

    .tree .title {
      position: -webkit-sticky; /* Safari */
      position: sticky;
      top: 90px;
      margin-top:10px;
      background: white;
      display: inline-flex;
      align-items: center;
      width: 100%;
    }

    .navigation {
      margin-left:auto;
    }

    .nav-button-children {
      display: inline-block;
      margin: 4px;
      padding: 2px;
      text-align: center;
      background: lightgreen;
      border: solid;
      border-color: black;
      cursor: pointer;
      border: var( --connector-size) solid var( --connector-color);
      border-radius: .6em;
      position:relative;
      left: 20px;
      padding-bottom: 4px;
    }

    .nav-button-children-fields {
      top: 12px;
    }

    .nav-button-children-schemas {
      top: 4px;
    }

    .nav-button-children-section {
      top: 4px;
    }

    .links {
      margin-top: 0.5rem;
    }

    .links > a {
      text-decoration: none;
      font-size: 0.8rem;
      background: darkseagreen;
      color: black;
      padding: 0.3rem;
      margin-right: 0.4rem;
      border-radius: 8px;
      vertical-align: middle;
    }

    .opened {
      background: red;
    }

    [data-type="events"] table {
      border-collapse: collapse;
      margin: 0;
      font-size: 0.7rem;
    }

    [data-type="events"] th,td {
      padding: 3px;;
    }

    [data-type="events"] td,th {
      border: solid;
      border-color: grey;
      border-width: thin;
      margin: 0;
    }
    `;

    return style;
  }

  _getHtmlSpecification() {
    const htmlSpecification = document.createElement('ul');
    htmlSpecification.setAttribute('data-type', 'specification');
    htmlSpecification.setAttribute('data-name', this.specification.version);
    htmlSpecification.setAttribute('class', 'tree');
    const url_md = this.specification.urls.find(url => url.type === 'markdown').url;
    const url_schema = this.specification.urls.find(url => url.type === 'schema').url;
    htmlSpecification.innerHTML = `
      <li>
        <div>
          <div class="title"><h1>OpenAPI ${this.specification.version} Specification</h1></div>
          <div class="content">
          <div class="description">${this.specification.description}</div>
          <div class="links">
            <a href="${url_md}" target="MD_${this.specification.version}">Original Documentation&nbsp;🔗</a>
            <a href="${url_schema}" target="SCHEMA_${this.specification.version}">JSON Schema&nbsp;🔗</a>
          </div>
        </div>
      </li>
    `;
    const sections = document.createElement('ul');
    sections.appendChild(this._getHtmlHistorySection());
    sections.appendChild(this._getHtmlSchemaSection());
    htmlSpecification.appendChild(sections);
    return htmlSpecification;
  }

  _getHtmlHistoryEvents(){
    const events = document.createElement('ul');
    events.setAttribute('data-type', 'children');
    const li = document.createElement('li');
    li.setAttribute('data-type', 'events');
    events.appendChild(li);
    let lines = '';
    console.log(this.specification.history);
    this.specification.history.forEach(event => {
      lines += `
        <tr>
          <td>${event.date}</td>
          <td>${event.type}</td>
          <td>${event.version}</td>
          <td>${event.notes}</td>
        </tr>
      `
    });
    li.innerHTML = `
      <div>
        <div class="content">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Event type</th>
                <th>Version</th>
                <th>Notes</th>
              </tr>
            <thead>
            <tbody>
            ${lines}
            <tbody>
          </table>
        </div>
      </div>
    `;
    return events;
  }

  _getHtmlSection(dataName, title, children){
    const section = document.createElement('li');
    section.setAttribute('data-type', 'section');
    section.setAttribute('data-name', dataName);
    section.setAttribute('class', 'node');
    let navigationChildren = ''
    if(children.length > 0){
      navigationChildren = `
        <span class="nav-button-children nav-button-children-section" data-action="children">→</span>
      `
    }
    section.innerHTML = `
        <div>
          <div class="title">
            <h1>${title}</h1>
            <div class="navigation">
            ${navigationChildren}
            </div>
          </div>
        </div>
    `;
    //schemaSection.appendChild(this._getAllHtmlSchemas());
    return section;
  }

  _getHtmlHistorySection() {
    return this._getHtmlSection('history', 'History', this.specification.history);
  }

  _getHtmlSchemaSection() {
    return this._getHtmlSection('schema', 'Schema', this.specification.history);
  }

  _getAllHtmlSchemas(){
    const types = [];
    this.specification.schemas.forEach(schema => {
      types.push(schema.name);
    })
    const htmlSchemas = this._getHtmlSchemas(types);
    return htmlSchemas;
  }

  _getHtmlSchema(schema) {
    const htmlSchema = document.createElement('li');
    let extensible = '';
    if(schema.extensible) {
      extensible = `<span class="extensible">Extensible</span>`
    }
    let root = '';
    if(schema.root) {
      root = `<span class="root">Root</span>`
    }
    const url_md = schema.urls.find(url => url.type === 'markdown').url;
    htmlSchema.innerHTML = `
        <div class="node" data-type="schema" data-name="${schema.name}">
          <div class="title">
            <h1>${schema.name}${root}${extensible}</h1>
            <div class="navigation">
              <span class="nav-button-children nav-button-children-schemas" data-action="children">→</span>
            </div>
          </div>
          <div class="description">${schema.description}</div>
          <div class="links">
            <a href="${url_md}" target="MD_${this.specification.version}">Original Documentation&nbsp;🔗</a>
          </div>
        </div>
    `;
    return htmlSchema;
  }

  _getHtmlSchemas(types) {
    const htmlSchemas = document.createElement('ul');
    htmlSchemas.setAttribute('data-type', 'children');
    types.forEach(type => {
      const schema = this.specification.schemas.find(s => s.name === type);
      if(schema){ // atomic types will not be found but we do not care
          htmlSchemas.appendChild(this._getHtmlSchema(schema));
      }
    });
    if(htmlSchemas.childElementCount > 0){
      return htmlSchemas;
    }
    else {
      return null;
    }
  }

  _getHtmlFields(schema) {
    const htmlFields = document.createElement('ul');
    htmlFields.setAttribute('data-type', 'children');
    schema.fields.forEach((field) => {
      const htmlField = document.createElement('li');
      let required = '';
      if(field.required){
        required = '<span class="required">*</span>';
      }
      let richText = '';
      if(field.richText){
        richText = '<span class="rich-text">Rich Text</span>';
      }
      let patterned = '';
      if(field.nameType == 'patterned'){
        patterned = '<span class="patterned">Patterned</span>';
      }
      let dataChildren = false;
      let navigationChildren = '';
      field.type.types.forEach(type => {
        if(type.includes('Object')){
          dataChildren = true;
        }
      });
      if(dataChildren){
        navigationChildren = `
          <span class="nav-button-children nav-button-children-fields" data-action="children">→</span>
        `
      }
      const url_md = field.urls.find(url => url.type === 'markdown').url;
      let fieldType = '<span class="type">'+field.type.types.join('</span><span class="syntax">&nbsp;or&nbsp;</span><span class="type">')+'</span>';
      if(field.type.listType === 'array'){
        fieldType = `<span class="syntax">[</span>${fieldType}<span class="syntax">]</span>`;
      }
      else if (field.type.listType === 'map'){
        fieldType = `<span class="syntax">{ * : </span>${fieldType}<span class="syntax">}</span>`;
      }
      htmlField.innerHTML = `
      <div class="node" data-type="field" data-name="${schema.name};${field.name}" data-children="${dataChildren}">
        <div class="title">
          <code class="openapi">
            <span class="property">${field.name}${patterned}</span>${required}
            <span class="syntax">:<span>
            <span class="type">${fieldType}</span>${richText}
          </code>
          <div class="navigation">
            ${navigationChildren}
          </div>
        </div>
        <div class="description">${field.description}</div>
        <div class="links">
          <a href="${url_md}" target="MD_${this.specification.version}">Original Documentation&nbsp;🔗</a>
        </div>
      </div>
      `;
      htmlFields.appendChild(htmlField);
    });
    return htmlFields;
  }

  getSchema(schemaName) {
    const schema = this.specification.schemas.find(schema => schema.name === schemaName);
    return schema;
  }

  getField(fieldId) {
    const split = fieldId.split(';');
    const schemaName = split[0];
    const fieldName = split[1];
    const schema = this.getSchema(schemaName);
    const field = schema.fields.find(field => field.name === fieldName);
    return field;
  }

  hasDataChildren(element){
    let result = false;
    const dataChildrenAttribute = element.getAttribute('data-children');
    if(dataChildrenAttribute===null || dataChildrenAttribute === "true"){
      result = true;
    }
    return result;
  }

  showHideChildren(elementClicked) {
    const dataParent = elementClicked.closest('[data-type]');
    if(this.hasDataChildren(dataParent)){
      console.log('dataParent', dataParent);
      const node = dataParent.parentElement;
      const dataType = dataParent.getAttribute('data-type');
      const dataName = dataParent.getAttribute('data-name');
      console.log(dataType, dataName);
      let openedChildren;
      if(dataType == "section"){
        openedChildren = dataParent.querySelector("[data-type=children]");// replace by css class?
      }
      else {
        openedChildren = node.querySelector("[data-type=children]");// replace by css class?
      }
      if(openedChildren){
        openedChildren.remove();
        elementClicked.textContent="→";
      }
      else {
        if(dataType == 'schema'){
          const schema = this.getSchema(dataName);
          const htmlFields = this._getHtmlFields(schema);
          node.appendChild(htmlFields);  
        }
        else if(dataType == 'field'){
          const field = this.getField(dataName);
          const htmlSchemas = this._getHtmlSchemas(field.type.types);
          node.appendChild(htmlSchemas);
        }
        else if(dataType == 'section' && dataName == 'schema'){
          const htmlSchemas = this._getAllHtmlSchemas();
          dataParent.appendChild(htmlSchemas);
        }
        else if(dataType == 'section' && dataName == 'history'){
          dataParent.appendChild(this._getHtmlHistoryEvents());
        }
        elementClicked.textContent="←";
      }
      elementClicked.classList.toggle('opened');
    }
    else {
      console.log('no data children');
    }
  }

  onclick(event) {
    // Click location to replace by actual buttons
    const elementClicked = event.path[0];
    console.log(elementClicked);
    const dataAction = elementClicked.getAttribute('data-action');
    if(dataAction == 'children'){
      this.showHideChildren(elementClicked);
    }
  }

  _setContentAndRender() {
    if(this.src) {
      console.log('content from url', this.src);
      fetch(this.src).then((response)=>{response.json().then((json)=>{
        this.specification = json;
        this._render();
      })});
    }
    else {
      console.log('inline content');
      this.specification = JSON.parse(this.innerText);
      this._render(); 
    }
  }

  _render() {
    const style = this.shadowRoot.querySelector('style');
    if(style === null){
      this.shadowRoot.appendChild(this._getCss());
    }
    const htmlSpecification = this.shadowRoot.querySelector('[data-type=specification]');
    if(htmlSpecification !== null){
      htmlSpecification.remove();
    }
    this.shadowRoot.appendChild(this._getHtmlSpecification());
  }

  // Web components functions

  connectedCallback() {
    console.log('connectedCallback');
    this.addEventListener("click", this.onclick);
    //this._setContentAndRender();    
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.onclick);
  }
  // The attributes of the web component
  // Hence <hello-world attribute1="" attribute2="">
  static get observedAttributes() {
    return[ 'src' ];
  }

  // Callback called when an attribute is set in tag or changed
  attributeChangedCallback(property, oldValue, newValue) {
    console.log('attributeChangedCallback', property, oldValue, newValue);
    //if(oldValue !== newValue) {
      //if(property === 'ranges'){
      //  this._setRanges(newValue);
      //}
      //else {
        this[property] = newValue;
      //}
    //}
    this._setContentAndRender(); 
  }

}

customElements.define('specification-viewer', SpecificationViewer);