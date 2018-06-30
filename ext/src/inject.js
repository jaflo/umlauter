(function() {
	window.addEventListener("keypress", captureEvent, true);
	window.addEventListener("keyup", captureEvent, true);

	function captureEvent(e) {
		if (e.target &&
			e.target.matches("input, textarea, [contenteditable]") &&
			!e.target.classList.contains("CodeMirror-code") // too buggy
		) {
			check.bind(e.target)();
		}
	}

	function check() {
		var text = this.value || this.textContent,
			pos = this.selectionStart,
			contentEditable = this.contentEditable == "true";
		if (contentEditable) {
			this.focus();
			var origRange = document.getSelection().getRangeAt(0);
			var range = origRange.cloneRange();
			range.selectNodeContents(this);
			range.setEnd(origRange.endContainer, origRange.endOffset);
			pos = range.toString().length;
		}
		var left = text.slice(0, pos).search(/\w+$/),
			right = 0,
			word;
		if (right < 0) word = text.slice(left);
		else word = text.slice(left, right + pos);
		if (word.replace(/\W+/, "") == "" && this.dataset.lastTextLength != text.length) {
			if (this.dataset.lastWord && this.dataset.lastWord.replace(/\W/g, "")) {
				chrome.runtime.sendMessage({
					word: this.dataset.lastWord,
					contentEditable: contentEditable
				}, function(res) {
					if (!res || res.word == res.replacement) return; // disabled or no replacement
					if (res.contentEditable) {
						var sel = document.getSelection();
						sel.modify("extend", "backward", "word");
						var el = document.createElement("span");
						el.appendChild(sel.getRangeAt(0).cloneContents());
						document.execCommand("insertText", false, el.innerText.replace(new RegExp(res.word+"(\\w?\\W*$)"), res.replacement+"$1"));
					} else {
						var start = this.selectionStart,
							end = this.selectionEnd;
						this.value = this.value.slice(0, pos-1).replace(new RegExp(res.word+"(\\w?\\W*$)"), res.replacement+"$1") + this.value.slice(pos-1);
						var diff = res.replacement.length - res.word.length;
						this.selectionStart = start+diff;
						this.selectionEnd = end+diff;
					}
				}.bind(this));
			}
			this.dataset.lastTextLength = text.length;
		}
		this.dataset.lastWord = word;
	}
})();