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
					if (!res) return; // disabled
					var replacement = res.replacement;
					if (res.contentEditable) {
						var sel = document.getSelection();
						var selectedRange = sel.getRangeAt(0);
						var range = document.createRange();
						range.selectNodeContents(this);
						range.setStart(selectedRange.startContainer, 0);
						range.setEnd(selectedRange.startContainer, selectedRange.startOffset);
						var el = document.createElement("span");
						el.appendChild(range.cloneContents());
						var text = el.innerText;
						range.deleteContents();
						var insert = document.createTextNode(text.slice(0, pos-1).replace(new RegExp(res.word+"(\\w?\\W*$)"), replacement+"$1") + text.slice(pos-1));
						range.insertNode(insert);
						range.setStartAfter(insert);
						range.setEndAfter(insert);
						range.collapse(false);
						sel.removeAllRanges();
						sel.addRange(range);
					} else {
						var start = this.selectionStart,
							end = this.selectionEnd;
						this.value = this.value.slice(0, pos-1).replace(new RegExp(res.word+"(\\w?\\W*$)"), replacement+"$1") + this.value.slice(pos-1);
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