
from bs4 import BeautifulSoup
import re
import markdown
import json 
import OpenApiSpecificationHistory

regex_header = re.compile(r'^h(\d)')
def get_header_level(element):
  level = -1
  if element.name != None:
    header = regex_header.search(element.name)
    if header != None:
      level = int(header.group(1))
  return level

def get_content_sub_type(soup):
  if soup.name == 'table':
    return 'table'
  elif soup.name == 'pre':
    return 'code'
  else:
    return 'text' 

def get_parent_node(new_node, current_parent_node): 
  if new_node.level > current_parent_node.level:
    return current_parent_node
  elif new_node.level == current_parent_node.level:
    return current_parent_node.parent 
  else: # new_header_node.level < current_parent_node.level:
    return get_parent_node(new_node, current_parent_node.parent)

class HeaderNode:
  def __init__(self, node):
    self.__init_level(node.soup)
    self.__init__anchor(node.soup)
    self.__init__id(node.soup)
  
  def __init_level(self, soup):
    self.level = get_header_level(soup)

  def __init__anchor(self, soup):
    anchor = soup.find('a')
    if anchor != None:
      self.anchor = anchor['name']
    else:
      self.anchor = None

  def __init__id(self, soup):
    self.id = soup['id']

  def to_dict(self):
    return {
      'level': self.level,
      'id': self.id,
      'anchor': self.anchor
    }

class CodeNode:

  def __init__(self, node):
    code_block = node.soup.find_all('code')[0];
    self.value = code_block
    regex_language = re.compile(r'language-(.*)')
    code_block_with_class = node.soup.find_all(class_=regex_language)
    if len(code_block_with_class) > 0:
      class_language = regex_language.search(code_block_with_class[0]['class'][0])
      self.language = class_language.group(1)
    else:
      self.language = None
  
  def to_dict(self):
    return {
      'language': self.language,
      'text': self.value.text
    }

class TableNodeLine:
  def __init__(self, line_soup, table):
    self.table = table
    self.__init__anchor(line_soup)
    self.__init__values(line_soup)

  def __init__anchor(self, soup):
    anchor = soup.find('a')
    self.anchor = None
    if anchor != None:
      if anchor.has_attr('name'):
        self.anchor = anchor['name']      

  def __init__values(self, soup):
    cells_html = soup.find_all('td')
    self.values = []
    for cell_html in cells_html:
      self.values.append(cell_html)

  def get_value_by_header(self, header_names):
    result = None
    for header_name in header_names:
      index = 0
      while index < len(self.table.headers): 
        if self.table.headers[index].text == header_name:
          result = self.values[index]
          break;
        else:
          index += 1
    return result

  def to_dict(self):
    values = []
    for value in self.values:
      values.append({
        'text': value.text,
        'html': value.decode_contents()
      })
    return {
      'anchor': self.anchor,
      'values': values
    }

class TableNode:
  def __init__(self, node):
    self.__init__headers(node.soup)
    self.__init__lines(node.soup)

  def __init__headers(self, soup):
    self.headers = []
    headers_html = soup.find_all('th')
    for header_html in headers_html:
      self.headers.append(header_html)

  def __init__lines(self, soup):
    self.lines = []
    lines_html = soup.find_all('tr')
    for line_html in lines_html:
      line = TableNodeLine(line_html, self)
      if(len(line.values) > 0): # workaround because th are also in tr
        self.lines.append(line)

  def to_dict(self):
    headers_dict = []
    for header in self.headers:
      headers_dict.append({
        'text': header.text,
        'html': header.decode_contents()
      })
    lines_dict = []
    for line in self.lines:
      lines_dict.append(line.to_dict())
    return {
      'headers': headers_dict,
      'lines': lines_dict
    }

class Node:
  def __init__(self, soup=None, current_parent_node=None):
    self.soup = soup
    self.children = []
    self.set_type_and_level(current_parent_node)
    self.set_parent_node(current_parent_node)
  
  def add_child(self, node):
    self.children.append(node)

  def set_type_and_level(self, current_parent_node):
    self.sub_type = None
    self.level = None
    self.code = None
    if current_parent_node == None:
      self.type = 'root'
      self.level = 0
    else:
      header_level = get_header_level(self.soup)
      if header_level > 0:
        self.type = 'header'
        self.level = header_level
        self.header = HeaderNode(self)
      else:
        self.type = 'content'
        self.sub_type = get_content_sub_type(self.soup)
        if self.sub_type == 'code':
          self.code = CodeNode(self)
        elif self.sub_type == 'table':
          self.table = TableNode(self)

  def set_parent_node(self, current_parent_node):
    if current_parent_node != None:
      if self.type != 'header': # for now 'content
        self.parent = current_parent_node
      else:
        self.parent = get_parent_node(self, current_parent_node)
      self.parent.add_child(self)

  def compare_regex_or_text(self, source_text_or_regex, target):
    result = False
    #print('compare_regex_or_text', str(source_text_or_regex), target)
    if type(source_text_or_regex) is str:
      #print('text')
      result = source_text_or_regex == target
    else:
      #print('regex')
      result =  source_text_or_regex.search(target) != None
    #print('compare_regex_or_text result', result)
    return result

  def get_node(self, text, type=None, level=None):
    #print('search', text, type, level)
    found_flag = True
    if type != None and found_flag == True:
      found_flag = type == self.type
    if level != None and found_flag == True:
      found_flag = level == self.level
    if text != None and found_flag == True:
      found_flag = self.compare_regex_or_text(text, self.get_text())
    #print('result', found_flag, self.get_text()[0:20], self.type, self.level)
    if found_flag == True:
      #print('result', found_flag, self.get_text()[0:20], self.type, self.level)
      return self
    else:
      for child in self.children:
        found = child.get_node(text, type, level)
        if found != None:
          return found;
    return None

  def get_text(self):
    return self.soup.text
  
  def get_html(self):
    return self.soup.decode_contents()

  def to_dict(self):
    dict_children = []
    for child in self.children:
      dict_children.append(child.to_dict())
    if self.soup != None:
      text = self.soup.text
    else:
      text = None
    dict_node = {
      'type': self.type,
      'subType': self.sub_type,
      'level': self.level,
      'text': text,
      'html': str(self.soup),
      'children': dict_children
    }
    if self.type == 'header':
      dict_node['header'] = self.header.to_dict()
    elif self.type == 'content':
      if self.sub_type == 'code':
        dict_node['code'] = self.code.to_dict()
      elif self.sub_type == 'table':
        dict_node['table'] = self.table.to_dict()
    
    return dict_node


class FieldType:
  def __init__(self, soup):
    self.soup = soup
    self.__init__list_and_types()

  def __init__list_and_types(self):
    type_regex = re.compile(r'^((?P<map>Map\[)(?P<key>[a-zA-Z\s]+),)?(?P<array>\[)?(?P<types>[a-zA-Z\*\|\s]+)(?:\])?.*$') 
    #.* at the end because of typo in v3.1 on webhooks property Map[string, Path Item Object | Reference Object] ]
    type_search = type_regex.search(self.soup.text)
    
    self.map_key = None
    self.list_type = None
    if type_search.group('map'):
      self.list_type = 'map'
      self.map_key = type_search.group('key')
    elif type_search.group('array'):
      self.list_type = 'array'

    types = type_search.group('types').split('|')
    self.types = []
    for t in types:
      # In swagger 2 some Any are marked as *
      if t == '*':
        t = 'Any'
      self.types.append(t.strip())
  
  def to_dict(self):
    return {
      'listType': self.list_type, 
      'mapKeyType': self.map_key,
      'types': self.types
    }

class SchemaField:
  def __init__(self, table_node_line, name_type, specification):
    self.specification = specification
    self.id = table_node_line.anchor
    self.name_type = name_type
    self.name = table_node_line.get_value_by_header(['Field Name', 'Field Pattern'])
    self.type = FieldType(table_node_line.get_value_by_header(['Type']))
    self.applies_to = table_node_line.get_value_by_header(['Validity','Applies To'])
    self.description = table_node_line.get_value_by_header(['Description'])
    self.__init__required()
    self.__init_rich_text()
    self.__init_urls()

  def __init_urls(self):
    self.urls = Urls()
    self.urls.add_url(self.specification.urls.get_url('markdown').url+'#'+self.id, 'markdown')

  def __init__required(self):
    #if self.specification.is_version('2'):
    #  required_keyword = '<strong>Required.</strong>' # swagger 2 <strong>Required.</strong> v3 <strong>REQUIRED</strong> 
    #else:
    #  required_keyword = '<strong>REQUIRED</strong>.'
    #description_html_lower = self.description.text.lower()
    self.required = self.description.text.lower().startswith('required')

  def __init_rich_text(self):
    # v2 GFM syntax can be used for rich text representation.
    # v3 CommonMark syntax MAY be used for rich text representation.
    rich_text_regex = re.compile(r'\.\s*(?P<format>.*)\s+syntax.*rich\stext\srepresentation\.\s*')
    rich_text_search = rich_text_regex.search(self.description.text)
    if rich_text_search:
      self.rich_text = rich_text_search.group('format')
    else:
      self.rich_text = None

  def get_description_text(self):
    clean_description = self.description.text
    clean_description = re.sub(r'^required\.\s*', '', clean_description, flags=re.IGNORECASE)
    clean_description = re.sub(r'(\.).*syntax.*rich\stext\srepresentation\.\s*', '\g<1>', clean_description)
    return clean_description

  def to_dict(self):
    applies_to = None
    if self.applies_to != None:
      applies_to = self.applies_to.text
    return {
      'name': self.name.text,
      'nameType': self.name_type,
      'required': self.required,
      'id': self.id,
      'type': self.type.to_dict(),
      'appliesTo': applies_to,
      'richText': self.rich_text,
      'urls': self.urls.to_dict(),
      'description': self.get_description_text()
    }

class SchemaFields:
  def __init__(self, fields_node, name_type, specification):
    self.node = fields_node
    self.fields = []
    if fields_node != None:
      for child in self.node.children:
        if child.type == 'content' and child.sub_type == 'table':
          for line in child.table.lines:
            self.fields.append(SchemaField(line, name_type, specification))

  def append_fields(self, schema_fields):
    self.fields = self.fields + schema_fields.fields

  def get_field(self, name):
    found_field = None
    for field in self.fields:
      if field.name.text == name:
        found_field = field
        break
    return found_field

  def to_dict(self):
    fields_dict = []
    for field in self.fields:
      fields_dict.append(field.to_dict())
    return fields_dict

class OpenApiSpecificationSchema:
  def __init__(self, schema_node, specification):
    self.specification = specification
    self.name = schema_node.get_text()
    self.node = schema_node
    self.__init_is_extensible()
    self.__init_fields()
    self.__init_description()
    self.__init_is_root()
    self.__init_urls()

  def __init_urls(self):
    self.urls = Urls()
    self.urls.add_url(self.specification.urls.get_url('markdown').url+'#'+self.node.header.anchor, 'markdown')

  def __init_description(self):
    self.descriptions = []
    for child in self.node.children:
      if child.type == 'content':
        self.descriptions.append(child)
      else: # will break on first header after intro
        break

  def __init_is_root(self):
    self.is_root = self.get_description().__contains__('This is the root')

  def get_description(self):
    result = ''
    for description in self.descriptions:
      result += description.get_html()
    return result

  def __init_fields(self):
    print('=======>Schema ', self.name)
    fixed_fields_node = self.node.get_node('Fixed Fields', 'header')
    fixed_fields = SchemaFields(fixed_fields_node, 'fixed', self.specification)
    patterned_fields_node = self.node.get_node('Patterned Fields', 'header')
    patterned_fields = SchemaFields(patterned_fields_node, 'patterned', self.specification)
    # in v2 ^x- are inconsistently in Patterned Objects and Patterned Field
    patterned_objects_node = self.node.get_node('Patterned Objects', 'header')
    patterned_objects = SchemaFields(patterned_objects_node, 'patterned', self.specification)

    self.fields = fixed_fields
    self.fields.append_fields(patterned_fields)
    self.fields.append_fields(patterned_objects)

    # also in v2/v3 extension are not described as objects -> to add manually
    # in v3 ^x- are not explicitly described -> To add manually
    if self.specification.is_version('3'):
      specification_extensions_node = self.specification.document_tree.get_node('Specification Extensions', 'header')
      extension_fields = SchemaFields(specification_extensions_node, 'patterned', self.specification)
      self.fields.append_fields(extension_fields)

  def __init_is_extensible(self):
    self.is_extensible = False
    for child in self.node.children:
      if self.specification.is_version('3'):
        # OpenAPI 3, 3.1
        v3_extensible_content = self.node.get_node('This object MAY be extended with Specification Extensions.', 'content')
        self.is_extensible = (v3_extensible_content != None)
      else:
        # Swagger 2
        # Look for a ^x- field
        patterned_fields_node = self.node.get_node('Patterned Fields', 'header')
        patterned_fields = SchemaFields(patterned_fields_node, 'patterned', self.specification)
        # in v2 ^x- are inconsistently in Patterned Objects and Patterned Field
        patterned_objects_node = self.node.get_node('Patterned Objects', 'header')
        patterned_objects = SchemaFields(patterned_objects_node, 'patterned', self.specification)
        patterned_fields.append_fields(patterned_objects)
        extension_field = patterned_fields.get_field('^x-')
        self.is_extensible = (extension_field != None)

  def to_dict(self):
    return {
      'name': self.name,
      'extensible': self.is_extensible,
      'root': self.is_root,
      'urls': self.urls.to_dict(),
      'description': self.get_description(),
      'fields': self.fields.to_dict(),
      #'node': self.node.to_dict()
    }


class Url:
  def __init__(self, url, type):
    self.url = url
    self.type = type
  
  def to_dict(self):
    return {
      'url': self.url,
      'type': self.type
    }

class Urls:
  def __init__(self):
      self.urls = []
  
  def add_url(self, url, type):
    self.urls.append(Url(url, type))

  def get_url(self, type):
    result = None
    for url in self.urls:
      if url.type == type:
        result = url
        break
    return result

  def to_dict(self):
    urls_dict = []
    for url in self.urls:
      urls_dict.append(url.to_dict())
    return urls_dict

class OpenApiSpecification:
  def __init__(self, document_tree):
    self.document_tree = document_tree
    self.__init__version()
    self.__init_urls()
    self.__init__description()
    self.__init__schemas()
    self.__init__history()

  def __init__version(self):
    title_regex = re.compile(r'Version (.*)')
    version_header_soup = self.document_tree.soup.find('h4')
    version_header = title_regex.search(version_header_soup.text)
    self.version = version_header.group(1)
    print('****** VERSION *****', self.version)

  def __init_urls(self):
    self.urls = Urls()
    # move hardcorded url somewhere
    template_md = 'https://github.com/OAI/OpenAPI-Specification/blob/main/versions/$VERSION.md'
    template_schema = 'https://github.com/OAI/OpenAPI-Specification/blob/main/schemas/v$VERSION_MINOR/schema.json'
    self.urls.add_url(self.get_url_with_version(template_md), 'markdown')
    self.urls.add_url(self.get_url_with_version(template_schema),'schema')

  def __init__schemas(self):
    schemas_node = self.document_tree.get_node('Schema', 'header', 3)
    self.schemas = []
    for schema_node in schemas_node.children:
      if schema_node.type == 'header':
        self.schemas.append(OpenApiSpecificationSchema(schema_node, self))

  def __init__description(self):
    self.description = []
    if self.is_version('3'):
      introduction = self.document_tree.get_node('Introduction', 'header', 2)
    else:
      introduction = self.document_tree.get_node('Introductions', 'header', 2)
    self.description = introduction.children

  def __init__history(self):
    self.history = OpenApiSpecificationHistory.History(self.document_tree)

  def get_description(self):
    description_html = ''
    for description in self.description:
      description_html += description.get_html()
    return description_html

  def is_version(self, version):
    return self.version.startswith(version)

  def get_version(self, type=None):
    if type == 'major':
      numbers = self.version.split('.')
      return numbers[0]
    elif type == 'minor':
      numbers = self.version.split('.')
      return str(numbers[0])+'.'+str(numbers[1])
    else:
      return self.version

  def get_url_with_version(self, url_template):
    version_minor = '$VERSION_MINOR'
    version = '$VERSION'
    if version_minor in url_template:
      return url_template.replace(version_minor, self.get_version('minor'))
    elif version in url_template:
      return url_template.replace(version, self.get_version())

  def to_dict(self):
    schemas_dict = []
    for schema in self.schemas:
      schemas_dict.append(schema.to_dict())
    return {
      'version': self.version,
      'description': self.get_description(),
      #'node': self.document_tree.to_dict(),
      'urls': self.urls.to_dict(),
      'history': self.history.to_dict(),
      'schemas': schemas_dict
    }

def is_not_excluded_soup(soup):
  return soup.text != '\n'

def generate_tree(soup):
  root_node = Node(soup)
  current_soup = soup.find_all('h1')[0]
  current_parent_node = root_node
  while current_soup != None:
    if is_not_excluded_soup(current_soup):
      new_node = Node(current_soup, current_parent_node)
      if new_node.type == 'header':
        current_parent_node = new_node
      else:
        current_parent_node = new_node.parent
    current_soup = current_soup.next_sibling
  return root_node

def load_markdown_as_html(file):
  # Loading markdown (GFM flavor) and converting it to HTML
  specification_location = file
  markdown_file = open(specification_location)
  markdown_content = markdown_file.read();
  md = markdown.Markdown(extensions=['tables',  'fenced_code', 'toc'])
  html = md.convert(markdown_content)
  return html

versions = [
  '2.0', 
  '3.0.3',
  '3.1.0'
]
source = '../specifications'
target = './specifications-data'

for version in versions:
  html = load_markdown_as_html(source + '/'+ version + '.md')
  soup = BeautifulSoup(html, 'html.parser')
  tree_node = generate_tree(soup)
  tree_dict = tree_node.to_dict()
  openapi = OpenApiSpecification(tree_node)
  openapi_dict = openapi.to_dict()
  full_dict = {
    'data': openapi_dict,
    'source': tree_dict
  }
  result_dict = openapi_dict
  result_json = json.dumps(result_dict, indent = 4) 
  f = open(target+'/'+version+'.json','w')
  f.write(result_json)
  f.close()