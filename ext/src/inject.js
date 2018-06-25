(function() {
	document.addEventListener("keypress", captureEvent);
	document.addEventListener("keyup", captureEvent);

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
					if (!res) return; // disabled
					var replacement = res.replacement;
					if (res.contentEditable) {
						var sel = document.getSelection();
						var selectedRange = sel.getRangeAt(0);
						sel.collapseToStart();
						sel.modify("move", "backward", "word");
						sel.modify("extend", "forward", "word");
						var range = sel.getRangeAt(0);
						range.deleteContents();
						var insert = document.createTextNode(replacement+word);
						range.insertNode(insert);
						selectedRange.setStartAfter(insert);
						selectedRange.collapse(false);
						sel.removeAllRanges();
						sel.addRange(selectedRange);
					} else {
						if (!word) this.dataset.lastWord = this.dataset.lastWord.slice(0, -1);
						var start = this.selectionStart,
							end = this.selectionEnd;
						this.value = text.slice(0, pos-1).replace(new RegExp(res.word+"(\\w?\\W*$)"), replacement+"$1") + text.slice(pos-1);
						var diff = replacement.length - res.word.length;
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