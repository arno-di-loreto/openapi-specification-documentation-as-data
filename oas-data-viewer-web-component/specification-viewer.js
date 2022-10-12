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
      --space: 0px;
      --text-font-family: monaco, Consolas, 'Lucida Console', monospace;
    }

    /* tree, nodes, node */
        
    .nodes {
      padding-left: 0px;
      margin: 0;
      padding: 0;
    }

    .tree {
      margin-right: 20px;
      display: inline-flex;
      font-family: var(--text-font-family);
    }

    .nodes .closed {
      visibility:hidden;
      display: none;
    }
    
    .nodes, .node {
      list-style: none;
    }
    
    .node {
      display: flex;
    }
    
    .node:first-child {
      margin-top: 2rem;
    }
        
    .node > div:first-of-type {
      border: var( --connector-size) solid var( --connector-color);
      border-radius: .4em;
      padding: 0.5rem;
      margin-top: 0.5rem;
      max-width: 600px;
      z-index:1;
    }
        
    
    /* Connectors */
    
    .tree .node:before {
      background: var( --connector-color);
      content: "";
      width: 20px;
      height: var( --connector-size);
      top: 25px;
      margin:0;
      left:0;
      position: relative;
    }
    
    .tree > .node:before {
      content: none;
    }
    
    /* OpenAPI documentation */
    
    .tree .property {
      color: green;
    }
    
    .tree .type {
      color: darkgrey;
    }

    .tree .type-oas {
      color: orange;
    }

    .tree .syntax {
      color: blue;
    }

    .description {
      padding-top: 0.2rem;
      color: darkgrey;
      font-family: var(--text-font-family);
      font-size: 0.8rem;
      text-align: justify;
    }
    
    .tree .array-item {
      color: blue;
    }
    
    .tree h1 {
      font-family: var(--text-font-family);
      font-size: 1.2rem;
    }

    .tree .extensible {
      font-family: var(--text-font-family);
      font-size: 0.8rem;
      background-color: green;
      color: white;
      padding: 0.3rem;
      margin-left: 0.4rem;
      border-radius: 8px;
      vertical-align: middle;
      text-transform: uppercase;
    }

    /* field */

    .tree .required {
      font-family: var(--text-font-family);
      font-size: 0.8rem;
      color: red
    }

    .tree .pill-field {
      font-family: var(--text-font-family);
      font-size: 0.6rem;
      padding: 0.2rem;
      margin-left: 0.2rem;
      margin-right: 0.2rem;
      border-radius: 5px;
      vertical-align: middle;
      text-transform: uppercase;
    }

    .tree .pill-field-rich-text {
      background-color: brown;
      color: white;
    }

    .tree .pill-field-patterned {
      background-color: cadetblue;
      color: white;
    }

    .tree .pill-field-map {
      background-color: pink;
      color: black;
    }

    .tree .pill-field-array {
      background-color: yellow;
      color: black;
    }

    .tree .pill-field-ref {
      background-color: orange;
      color: black;
    }

    .tree .root {
      font-family: var(--text-font-family);
      font-size: 0.8rem;
      background-color: red;
      color: white;
      padding: 0.3rem;
      margin-left: 0.4rem;
      border-radius: 8px;
      vertical-align: middle;
      text-transform: uppercase;
    }

    .node-title {
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

    .hidden {
      display: none;
    }

    table {
      border-collapse: collapse;
      margin: 0;
      font-size: 0.7rem;
    }

    th,td {
      padding: 3px;;
    }

    td,th {
      border: solid;
      border-color: grey;
      border-width: thin;
      margin: 0;
    }

    /* content */
    .tree pre {
      white-space:pre-wrap;
      max-height: 150px;
      overflow:auto;
    }

    .description pre {
      background: black;
      color: white;
      padding: 5px;
    }

    .reference-links h2 {
      font-size: 0.9rem;
    }

    .reference-links a {
      font-size: 0.8rem;
    }

    `;

    return style;
  }

  ROOT=true

  getNodeContentDefaultVisibility(){
    //return " hidden"
    return ""
  }

  _createNodes(dataType, dataName, root){
    const nodes = document.createElement('ul')
    nodes.setAttribute('data-type', dataType);
    if(dataName){
      nodes.setAttribute('data-name', dataName);
    }

    if(root){
      nodes.classList.add('tree');
    }
    nodes.classList.add('nodes');

    return nodes
  }

  _createNode(){
    const node = document.createElement('li')
    node.classList.add('node');
    return node
  }

  _getHtmlReferenceLinks(data){
    const links = document.createElement('div');
    links.classList.add('reference-links')
    let list = '<h2>Reference Links</h2><ul>'
    let count = 0;
    data.urls.forEach(url => {
      if(url.type === 'reference'){
        list += `<li><a class="reference-link" href="${url.url}">${url.name}</li>`;
        count++;
      }
    })
    list+='</ul>'
    if(count > 0){
      links.innerHTML = list;
    }
    return links;
  }

  _getHtmlSpecification() {
    const htmlSpecificationTree = this._createNodes('specification', this.specification.version, this.ROOT);
    const url_md = this.specification.urls.find(url => url.name === 'markdown').url;
    const url_schema = this.specification.urls.find(url => url.name === 'schema').url;
    const htmlSpecificationIntro = this._createNode()
    htmlSpecificationIntro.innerHTML = `
      <div>
        <div class="node-title"><h1>${this.specification.name} ${this.specification.version} Specification</h1></div>
        <div class="node-content${this.getNodeContentDefaultVisibility()}">
          <div class="description">${this.specification.description}</div>
          <div class="links">
            <a href="${url_md}" target="MD_${this.specification.version}">Original Documentation&nbsp;🔗</a>
            <a href="${url_schema}" target="SCHEMA_${this.specification.version}">JSON Schema&nbsp;🔗</a>
          </div>
          ${this._getHtmlReferenceLinks(this.specification).outerHTML}
        </div>
      </div>
    `;

    const sections = this._createNodes();
    sections.appendChild(this._getHtmlHistorySection());
    sections.appendChild(this._getHtmlSchemaSection());
    sections.appendChild(this._getHtmlConceptsSection());
    htmlSpecificationIntro.appendChild(sections);
    htmlSpecificationTree.appendChild(htmlSpecificationIntro)
    return htmlSpecificationTree;
  }

  _getHtmlHistoryEvents(){
    const events = this._createNodes();
    events.setAttribute('data-type', 'children');
    const li = this._createNode();
    li.setAttribute('data-type', 'events');
    events.appendChild(li);
    let lines = '';
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
        <div class="node-title"><h1>Events</h1></div>
        <div class="node-content${this.getNodeContentDefaultVisibility()}">
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

  _getHtmlConcept(concept){
    const url_md = concept.urls.find(url => url.name === 'markdown').url;
    const htmlConcept = this._createNode();
    htmlConcept.setAttribute('data-type', 'specification');
    htmlConcept.setAttribute('data-name', concept.name);
    htmlConcept.innerHTML = `
        <div>
          <div class="node-title">
            <h1>${concept.name}</h1>
          </div>
          <div class="node-content${this.getNodeContentDefaultVisibility()}">
            <div class="description">${concept.description}</div>
            <div class="links">
              <a href="${url_md}" target="MD_${this.specification.version}">Original Documentation&nbsp;🔗</a>
            </div>
            ${this._getHtmlReferenceLinks(concept).outerHTML}
          </div>
        </div>
    `;
    return htmlConcept;
  }

  _getHtmlConcepts() {
    const concepts = this._createNodes();
    concepts.setAttribute('data-type', 'children');
    this.specification.concepts.forEach(concept => {
      concepts.appendChild(this._getHtmlConcept(concept));
    });
    return concepts;
  }

  _getHtmlSection(dataName, title, children){
    const section = this._createNode();
    section.setAttribute('data-type', 'section');
    section.setAttribute('data-name', dataName);
    let navigationChildren = ''
    if(children.length > 0){
      navigationChildren = `
        <span class="nav-button-children nav-button-children-section" data-action="children">→</span>
      `
    }
    section.innerHTML = `
        <div>
          <div class="node-title">
            <h1>${title}</h1>
            <div class="navigation">
            ${navigationChildren}
            </div>
          </div>
        </div>
    `;
    return section;
  }

  _getHtmlHistorySection() {
    return this._getHtmlSection('history', 'History', this.specification.history);
  }

  _getHtmlConceptsSection() {
    return this._getHtmlSection('concepts', 'Concepts', this.specification.concepts);
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
    const htmlSchema = this._createNode();
    htmlSchema.setAttribute('data-type','schema')
    htmlSchema.setAttribute('data-name',schema.name)
    let extensible = '';
    if(schema.isExtensible) {
      extensible = `<span class="extensible">Extensible</span>`
    }
    let root = '';
    if(schema.isRoot) {
      root = `<span class="root">Root</span>`
    }
    const url_md = schema.urls.find(url => url.name === 'markdown').url;
    htmlSchema.innerHTML = `
        <div>
          <div class="node-title">
            <h1>${schema.name}${root}${extensible}</h1>
            <div class="navigation">
              <span class="nav-button-children nav-button-children-schemas" data-action="children">→</span>
            </div>
          </div>
          <div class="node-content${this.getNodeContentDefaultVisibility()}">
            <div class="description">${schema.description}</div>
            <div class="links">
              <a href="${url_md}" target="MD_${this.specification.version}">Original Documentation&nbsp;🔗</a>
            </div>
            ${this._getHtmlReferenceLinks(schema).outerHTML}
          </div>
        </div>
    `;
    return htmlSchema;
  }

  _getHtmlSchemas(types) {
    const htmlSchemas = this._createNodes();
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
    const htmlFields = this._createNodes();
    htmlFields.setAttribute('data-type', 'children');
    schema.fields.forEach((field) => {
      const htmlField = this._createNode();
      htmlField.setAttribute('data-type', 'field')
      htmlField.setAttribute('data-name', `${schema.name};${field.name}`)
      //htmlField.setAttribute('data-children', ${dataChildren}"
      let required = '';
      if(field.isRequired){
        required = '<span class="required">*</span>';
      }
      let richText = '';
      if(field.richText){
        richText = '<span class="pill pill-field pill-field-rich-text">Rich Text</span>';
      }
      let patterned = '';
      if(field.nameType == 'patterned'){
        patterned = '<span class="pill pill-field pill-field-patterned">Patterned</span>';
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
      
      const url_md = field.urls.find(url => url.name === 'markdown').url;
      const fieldTypes = [];
      field.type.types.forEach(type => {
        let typeClass = 'type'
        if(type.includes('Object')){
          typeClass+='-oas'
        }
        let refPill = ''
        if(type === 'Reference Object'){
          refPill = '<span class="pill pill-field pill-field-ref">$ref</span>';
        }
        fieldTypes.push(`${refPill}<span class="${typeClass}">${type}</span>`);
      })
      let fieldType = fieldTypes.join(`<span class="syntax">&nbsp;or&nbsp;</span>`);
      if(field.type.parentType === 'array'){
        fieldType = `<span class="pill pill-field pill-field-array">Array</span><span class="syntax">[</span>${fieldType}<span class="syntax">]</span>`;
      }
      else if (field.type.parentType === 'map'){
        fieldType = `<span class="pill pill-field pill-field-map">Map</span><span class="syntax">{ * : </span>${fieldType}<span class="syntax">}</span>`;
      }
      htmlField.innerHTML = `
      <div>
        <div class="node-title">
          <code class="openapi">
            <span class="property">${field.name}${patterned}</span>${required}
            <span class="syntax">:<span>
            <span class="type">${fieldType}</span>${richText}
          </code>
          <div class="navigation">
            ${navigationChildren}
          </div>
        </div>
        <div class="node-content${this.getNodeContentDefaultVisibility()}">
          <div class="description">${field.description}</div>
          <div class="links">
            <a href="${url_md}" target="MD_${this.specification.version}">Original Documentation&nbsp;🔗</a>
          </div>
          ${this._getHtmlReferenceLinks(field).outerHTML}
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

  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  scrollToElement(element){
    if(!this.isInViewport(element)){
      console.log('not in viewport, scroll to', element)
      const verticalOffset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - verticalOffset;
      window.scrollTo({
        behavior: 'smooth',
        top: offsetPosition,
        left: element.getBoundingClientRect().left
      })  
    }
    else {
      console.log('already in viewport')
    }
  }

  showHideChildren(elementClicked) {
    const node = elementClicked.closest('.node');
    const dataType = node.getAttribute('data-type');
    const dataName = node.getAttribute('data-name');
    let openedChildren = node.querySelector('.nodes');
    if(openedChildren){
      console.log('closing')
      openedChildren.remove();
      this.scrollToElement(node);
      elementClicked.textContent="→";

    }
    else {
      let nodes;
      if(dataType == 'schema'){
        const schema = this.getSchema(dataName);
        nodes = this._getHtmlFields(schema);
      }
      else if(dataType == 'field'){
        const field = this.getField(dataName);
        nodes = this._getHtmlSchemas(field.type.types);
      }
      else if(dataType == 'section' && dataName == 'schema'){
        nodes = this._getAllHtmlSchemas();
      }
      else if(dataType == 'section' && dataName == 'history'){
        nodes = this._getHtmlHistoryEvents()
      }
      else if(dataType == 'section' && dataName == 'concepts'){
        nodes = this._getHtmlConcepts()
      }
      else {
        console.log('unexpected dataType and dataName', dataType, dataName)
      }
      if(nodes){
        node.appendChild(nodes);
        this.scrollToElement(nodes)  
      }
      elementClicked.textContent="←";
    }
    elementClicked.classList.toggle('opened');
  }

  onclick(event) {
    const elementClicked = event.composedPath()[0];
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