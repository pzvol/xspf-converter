# XSPF Converter

A simple script for converting URLs to a XSPF playlist

---

## Usage

### 0 -

```html
<script src="xspfconverter.js"></script>
```

### 1 - Create an instance of the converter and change created playlist name

```javascript
var converter = new XSPFConverter;
converter.listnameTo("My List");  // Default is "Playlist"
```

### 2.1 - Convert a list string to a XSPF list, without triggering download

```javascript
var xspfString =
	converter.stringToXSPF(
		urlSeperatedByNewline,  // URL string
		false,                  // Whether download gets called
		"\n");                  // Separator between URLs
```

### 2.2 - Convert an array string to a XSPF list

```javascript
var xspfString =
	converter.arrayToXSPF(
		array,   // URL array
		false);  // Whether download gets called
```

Every element in the `array` could be either:
- string
	```javascript
	"http://example.com/url/to/file"
	```
- or object
	```javascript
	{
		url: "http://example.com/url/to/file",
		title: "custom_title_name",
		artist: "artist_name",
		album: "album_name"
	}
	```
	> properties *except* `url` are selectable

### 2.3 - Convert an Aria2 input file string
Works similar to `stringToXSPF`, but option line `out=filename` will be recognized as file title and write to XSPF `<title>` tag

```javascript
var xspfString =
	converter.aria2InputListToXSPF(
		aria2InputString,  // URL string
		false,             // Whether download gets called
		"\n");             // Line separator
```
