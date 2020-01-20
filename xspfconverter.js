// xspfconverter - Convert URLs to XSPF playlist
//
// v1.4
//   - Code reconstruct
// v1.3
//   - Removed: VLC-specified tags in output XSPF file
//   - Removed: trackCounter in arrayToXSPF() (commented for possibly future use)
// v1.2
// (Last version output XSPF with VLC extension tags)
//   - Added: Escape most strings for XML-safe
//   - Added: URL object supports more media tages
// v1.1
//   - Added: aria2InputListToXSPF(), reads "out" option from Aria2 list & write to XSPF as titles
//   - Changed: arrayToXSPF() now supports more usages
//   - Changed: Better code format
// v1.0
//   - Created: Well... "version 1.0" sounds good, right?


'use strict';


function XSPFConverter() {

	// Name for downloaded file and its "setter" method
	var listname = "Playlist";
	this.listnameTo = function(newName) { listname = newName.replace(/[\t\n]/g, ''); }


	// Convert an array of URLs (or objects, details in README) to XSPF list
	this.arrayToXSPF = function (array, downAsFile = true) {
		var trackListInner = "";  // Inner text for <trackList>

		for (let arrayEle of array) {
			let url, mediaInfos = {};
			// Solve elements
			if (typeof arrayEle === "string") {
				url = arrayEle;
			}
			else if (typeof arrayEle === "object") {
				url = arrayEle.url;
				mediaInfos = {
					title: arrayEle.title || "",
					artist: arrayEle.artist || "",
					album: arrayEle.album || "",
				}
			}
			else { continue; }
			// append the new track element
			trackListInner += createTrack(url, mediaInfos);
		}

		// Build the list
		var xspfText = createList(trackListInner);
		// Call file download if required
		if (downAsFile) { downloadFile(xspfText, listname + ".xspf"); }

		return xspfText;
	}


	// Convert string to XSPF
	this.stringToXSPF = function (str, downAsFile = true, separator = "\n") {
		return this.arrayToXSPF(str.split(separator), downAsFile);
	}


	// Convert Aria2 input list (string) into XSPF
	this.aria2InputListToXSPF = function (listStr, downAsFile = true, separator = "\n") {
		const ariaOptFname = "out=";  // option name for filename
		const maxOptLineNum = 16;  // Max option lines we can accept

		var urlArray = [];
		var listLines = listStr.split(separator);

		// Index(i) may be modified if option lines are found during loop
		for (let i = 0; i < listLines.length; i++) {
			// Skip the line if it starts with "#"(comment) or " "(option), or just empty
			// Options checked when a URL is found
			if (/(?:^[ #]+)|(?:^$)/.test(listLines[i])) {
				continue;
			}
			else {
				let url = listLines[i];
				let filename = "";

				let lineNumSkipped = 0;  // Num of line skipped under current "i" line
				// Check for option lines until max reached or a non-option found
				//   (checkingLineNum is relative to index "i")
				for (let checkingLineNum = 1; checkingLineNum <= maxOptLineNum; checkingLineNum++) {
					let iChecked = checkingLineNum + i;  // Absolute line index

					// Prevents OOR
					if (iChecked >= listLines.length) { break; }

					// Comment or empty line
					else if (/(?:^#+)|(?:^$)/.test(listLines[iChecked])) { continue; }

					// Option line (start with space)
					else if (/^ +/.test(listLines[iChecked])) {
						let lineTrimmed = listLines[iChecked].trim();

						if (lineTrimmed.search(ariaOptFname) !== 0) {
							continue;  // Ignore other options
						} else {
							filename = lineTrimmed.replace(ariaOptFname, '');
							// Update ignored line number
							lineNumSkipped = checkingLineNum;
						}
					}

					// URL line
					else {
						// update checked line number (but leave this line for outer loop)
						lineNumSkipped = checkingLineNum - 1;
						break;
					}
				}

				// Push url object into array
				urlArray.push({url: url, title: filename});

				// Skip checked option lines
				i = i + lineNumSkipped;
			}
		}

		// Make the XSPF
		if (urlArray.length <= 0) {
			console.warn("aria2InputListToXSPF: Fail to find URL in given input list");
			return "";
		} else {
			return this.arrayToXSPF(urlArray, downAsFile);
		}
	}




	// Privates
	//   Escape characters for XML
	function xmlEscaped(string) {
		return string.toString().
			replace(/&/g, '&amp;').
			replace(/</g, '&lt;').
			replace(/>/g, '&gt;');
	}
	//   Create <track> element
	function createTrack(fileURL, { title = "", artist = "", album = "" } = {}) {
		if (fileURL === "") { return ""; }  // Return empty for no-url
		var innerLines = "";
		// Build up inner elements
		for (let element of [
			{
				tag: "location",
				value: fileURL
			},
			{
				tag: "title",
				value: title
			},
			{
				tag: "creator",
				value: artist
			},
			{
				tag: "album",
				value: album
			}
		]) {
			if (element.value) {
				innerLines += `\t\t\t<${element.tag}>${xmlEscaped(element.value)}</${element.tag}>\n`;
			}
		}

		return "\t\t<track>\n" + innerLines + "\t\t</track>\n";
	}
	//   Create XSPF list with given built STRING of tracks
	function createList (tracksStr) {
		return `<?xml version="1.0" encoding="UTF-8"?>\n` +
			`<playlist xmlns="http://xspf.org/ns/0/" version="1">\n` +
			`\t<title>${xmlEscaped(listname)}</title>\n` +
			"\t<trackList>\n" +
			tracksStr +
			"\t</trackList>\n" +
			"</playlist>\n";
	}
	//   Call XSPF file download with given content and filename
	function downloadFile(fileText, filename = "list.xspf") {
		let fileBlob = new Blob([fileText], {type : 'application/xspf+xml'});
		let fileBlobURL = URL.createObjectURL(fileBlob);

		let fileAnchor = document.createElement("a");
		fileAnchor.setAttribute("style", "display:none");
		fileAnchor.setAttribute("href", fileBlobURL);
		fileAnchor.setAttribute("download", filename);
		// Append, click & remove
		document.body.appendChild(fileAnchor);
		fileAnchor.click();
		fileAnchor.remove();
		window.URL.revokeObjectURL(fileBlobURL);
	}

}
