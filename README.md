# WCL Web Component Library

## Features

  - Field/Record model
  - Data-aware components (visual and nonvisual components)
  - Browser-based visual controls library
  - Bidirectional binding to DOM elements
  - AJAX and memory data sources

## Example

```javascript
var ajax, mem, r1, c1;

ajax = wcl.AjaxDataSource({
	read:     { get:  "examples/person/read.json" },
	insert:   { post: "examples/person/insert.json" },
	update:   { post: "examples/person/update.json" },
	delete:   { post: "examples/person/delete.json" },
	find:     { post: "examples/person/find.json" },
	metadata: { post: "examples/person/metadata.json" }
});

mem = wcl.MemoryDataSource({ data: [
	{ id:1, name:"Person 1", phone:"+380501002011", email:"person1@domain.com" },
	{ id:2, name:"Person 2", phone:"+380501002022", email:"person2@domain.com" },
	{ id:3, name:"Person 3", phone:"+380501002033", email:"person3@domain.com" },
]});

mem.read({ name:"Person 2" }, function(err, data) {
	if (data) {
		r1 = wcl.Record({ data:data });
		// TODO: autocreate Record for data and hide it from applied developer

		c1 = document.getElementById('container');
		wcl.bind({ record:r1, container:c1 });
		
		r1.fields.name.value("Darth Lenin");
		if (r1.fields.name.value() == "Darth Lenin" ) console.log(r1.toString());
		
		setTimeout(function() {
			r1.beginUpdate();
			var newData = {
				id:"4",
				name:"Person 4",
				phone:"+380501002044",
				email:"person4@domain.com"
			};
			r1.assign(newData);
			r1.fields.name.value("Le Corbusier");
			r1.fields.name.value("Spinoza");
			r1.endUpdate();
		}, 2000);

		setTimeout(function() {
			ajax.read({ id:5 }, function(err, newData) {
				r1.assign(newData);
				r1.fields.phone.value("+0123456789");
				ajax.update(r1.toObject(), function(err) {
					console.log('Data saved');
				});
			});
		}, 4000);
	}
});

var cardsSource, cardsTable;

cardsSource = wcl.AjaxDataSource({ find: { post: "examples/cards/find.json" } });
cardsTable = wcl.Table({ source:cardsSource });
cardsTable.query({}, function() {
	console.dir(cardsTable.memory.data);
});
```

## Contributors

  - Timur Shemsedinov
  - Dmitriy Khmaladze

## License

Dual licensed under the MIT or RUMI licenses.

RUMI License: Everything that you want, you are already that.

Jalal ad-Din Muhammad Rumi
"Hush, Don't Say Anything to God: Passionate Poems of Rumi"
