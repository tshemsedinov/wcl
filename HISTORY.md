0.0.6 / 2014-05-11
==================

  * Added Record.modified and DataSet.modified
  * Added Record.commit() and DataSet.rollback()
  * Added Record.deltaObject() and Record.deltaString()
  * Moved beginUpdate/endUpdate from Record to DataSet

0.0.5 / 2014-05-07
==================

  * Fixed bug in wcl.AjaxAPI introspection
  * Added wcl.autoInitialization - autobinding all wcl controls on the page
  * Added wcl.components.FieldControl - parent class for all data-aware controls
  * Added wcl.components.Container, refactored code and changed examples corresponding to new concepts
  * Make all containers visible from global and hide controls from global, so controls can be accessed: containerName.controlName

0.0.4 / 2014-05-06
==================

  * Added wcl.DataSet as multiple record holder
  * Make all controls visible in window global context by name specified in data-wcl="{ name:'name' }"
  * Added examples for AjaxAPI introspection

0.0.3 / 2014-05-05
==================

  * Added wcl.AjaxAPI(methods) where mathods: { method: { get/post:url }, ... }
  * Added introspection autoloading methods in wcl.AjaxAPI from server
  * Changed "new" instantiation method to "factory" for classes Record, Field, Table, MemoryDataSource, AjaxDataSource

0.0.2 / 2014-05-04
==================

  * Added global.js and corresponding code refactoring
  * Added Table class
  * Some minor fixes

0.0.1 / 2014-05-03
==================

  * Field/Record model
  * Data-aware components (visual and nonvisual components)
  * Browser-based visual controls library
  * Bidirectional binding to DOM elements
  * AJAX and memory data sources
