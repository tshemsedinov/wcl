# WCL Web Component Library

## Features

  - Memory model: DataSource -> DataSet -> Record -> Field
  - Data-aware components (visual and nonvisual components)
  - Browser-based visual controls library
  - Bidirectional binding Field <-> DOM element
  - AJAX data source and memory data source
  - Flexible AjaxAPI class to connect servers
  - Introspective method creation for AjaxAPI

## Example

```javascript
cardsSource = wcl.AjaxDataSource({ find: { post: "examples/cards/find.json" } });
cardsPerson = wcl.DataSet({ source:cardsSource });
cardsPerson.query({}, function() {
	//console.dir(cardsPerson.memory.data);
	wcl.autoInitialization();
	setTimeout(function() {
		cardsPerson.record.beginUpdate();
		cardsPerson.next();
		var newData = {
			id:"4",
			name:"Person 4",
			phone:"+380501002044",
			email:"person4@domain.com"
		};
		cardsPerson.record.assign(newData);
		cardsPerson.record.fields.name.value("Darth Lenin");
		if (cardsPerson.record.fields.name.value() == "Darth Lenin" ) {
			console.log(cardsPerson.record.toString());
			cardsPerson.record.fields.name.value("Le Corbusier");
		}
		cardsPerson.record.fields.name.value("Spinoza");
		cardsPerson.record.endUpdate();
	}, 2000);
});

// DataSource tests -----------------------------

mem = wcl.MemoryDataSource({ data: [
	{ id:1, name:"Person 1", phone:"+380501002011", email:"person1@domain.com" },
	{ id:2, name:"Person 2", phone:"+380501002022", email:"person2@domain.com" },
	{ id:3, name:"Person 3", phone:"+380501002033", email:"person3@domain.com" },
]});

mem.read({ name:"Person 2" }, function(err, data) {
	// TODO: find why callback executes twice (with data and without data)
	if (data) console.log('mem.read works: '+JSON.stringify(data));
});

var ajax = wcl.AjaxDataSource({
	read:     { get:  "examples/person/read.json" },
	insert:   { post: "examples/person/insert.json" },
	update:   { post: "examples/person/update.json" },
	delete:   { post: "examples/person/delete.json" },
	find:     { post: "examples/person/find.json" },
	metadata: { post: "examples/person/metadata.json" }
});

setTimeout(function() {
	ajax.read({ id:5 }, function(err, data) {
		data.phone ="+0123456789";
		ajax.update(data, function(err) {
			console.log('Data saved');
		});
	});
}, 4000);

// API introspection example -----------------------------

ajax2 = wcl.AjaxDataSource({
	introspect: { post: "examples/person/introspect.json" }
});

ajax2.introspect({}, function() {
	ajax2.read({ id:5 }, function(err, newData) {
		console.log('Introspection works');
	});
});
```

## Contributors

  - Timur Shemsedinov
  - Dmitriy Khmaladze

## License

Dual licensed under the MIT or RUMI licenses.

Copyright (c) 2014 MetaSystems &lt;timur.shemsedinov@gmail.com&gt;
Based on architectural solutions of MetaSystems 2006-2013 and ITAdapter 2002-2010

RUMI License: Everything that you want, you are already that.

Jalal ad-Din Muhammad Rumi
"Hush, Don't Say Anything to God: Passionate Poems of Rumi"
