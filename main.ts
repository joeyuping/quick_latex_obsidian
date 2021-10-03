import { MarkdownView, Plugin, Editor} from 'obsidian';

export default class QuickLatexPlugin extends Plugin {
	
	async onload() {
		console.log('loading Quick-Latex plugin');

		this.app.workspace.onLayoutReady(() => {
			this.registerCodeMirror((cm: CodeMirror.Editor) => {
				cm.on('keypress', this.handleKeyPress);
				cm.on('keyup', this.handleKeyUp);
				cm.on('keydown', this.handleKeyDown);
			});
		});

	}

	public onunload(): void {
		console.log('unloading Quick-Latex plugin');
		
		this.app.workspace.iterateCodeMirrors((cm) => {
			cm.off('keypress', this.handleKeyPress);
			cm.off('keyup',this.handleKeyUp);
			cm.off('keydown',this.handleKeyDown);
		  });
	}

	//triggering functions
	private readonly handleKeyDown = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {

		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return;

		const editor = view.editor;
		if (event.altKey){
			let position = editor.getCursor();
			switch (event.key) {
				case 'a':
					const selected_text = editor.getSelection()
					editor.replaceSelection('\\begin{align*}\n'+selected_text+'\n\\end{align*}');
					position = editor.getCursor();
					editor.setCursor({line:position.line-1,ch:editor.getLine(position.line-1).length})
					event.preventDefault()
					break;
				
				case 'm':
					editor.replaceSelection('\\begin{pmatrix}\\end{pmatrix}');
					position = editor.getCursor();
					editor.setCursor({line:position.line,ch:position.ch-13})
					event.preventDefault()
					break;
			};
		};

		if (event.key=='Enter'){
			if (this.withinAnyBrackets_document(cm, editor, '\\begin{pmatrix}','\\end{pmatrix}')){
				if(!event.shiftKey) {
					editor.replaceSelection(' \\\\ ')
					event.preventDefault();
				} else {
					return;
				};
			} else if (this.withinAnyBrackets_document(cm, editor, '\\begin{align','\\end{align')){
				if(!event.shiftKey) {
					editor.replaceSelection('\\\\\n&')
					event.preventDefault();
				} else {
					return;
				};
			};
		};

		if (event.key=='Tab') {
			if (this.withinAnyBrackets_document(cm, editor, '\\begin{pmatrix}','\\end{pmatrix}')){
				editor.replaceSelection(' & ')
				event.preventDefault();
			}
		};
	};
	
	private readonly handleKeyUp = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {

		if (['{','[','(','m'].contains(event.key)) {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;

			const editor = view.editor;
			if (this.withinMath(cm, editor)) {
				const position = editor.getCursor();
				const brackets = [['(',')'],['{','}'],['[',']']];
				switch (event.key) {
					case '{':		
						if (!this.withinAnyBrackets_inline(editor,brackets)) {
							editor.replaceSelection('}')
							editor.setCursor(position)
						};
						return;
					case '[':		
						if (!this.withinAnyBrackets_inline(editor,brackets)) {
							editor.replaceSelection(']')
							editor.setCursor(position)
						};
						return;
					case '(':		
						if (!this.withinAnyBrackets_inline(editor,brackets)) {
							editor.replaceSelection(')')
							editor.setCursor(position)
						};
						return;
					case 'm':
						if (editor.getRange({line:position.line,ch:position.ch-3},{line:position.line,ch:position.ch-1})=='su') {
							editor.replaceSelection('\\limits')
							return;
						} else {
							return;
						}
				};
			};
		};
	};

	private readonly handleKeyPress = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {

		if (['$',' '].contains(event.key)) {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view) return;

			const editor = view.editor;
			switch (event.key) {
				case '$':
					const position = editor.getCursor();
					const t = editor.getRange({line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch})
					const t2 = editor.getRange({line:position.line,ch:position.ch},{line:position.line,ch:position.ch+1})
					const t_2 = editor.getRange({line:position.line,ch:position.ch-2},{line:position.line,ch:position.ch})
					if (t == '$' && t2 != '$') {
						editor.setCursor({line: position.line,ch:position.ch-1})
					} else if (t_2 == '$$') {
						editor.setCursor({line: position.line,ch:position.ch-1})
					};
					return;

				case ' ':
					if (this.withinMath(cm, editor)) {

						const position = editor.getCursor();
						const current_line = editor.getLine(position.line);

						// retrieve the last unbracketed superscript
						let last_superscript = current_line.lastIndexOf('^',position.ch);
						while (last_superscript != -1) {
							const letter_after_superscript = editor.getRange({line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
							if (letter_after_superscript == '{') {
								last_superscript = current_line.lastIndexOf('^', last_superscript-1);
							} else {
								break;
							}
						}

						const last_dollar = current_line.lastIndexOf('$',position.ch-1);
						let last_divide = current_line.lastIndexOf('/',position.ch-1);
						while (editor.getRange({line:position.line,ch:last_divide-1},{line:position.line,ch:last_divide})=='\\') {
							last_divide = current_line.lastIndexOf('/',last_divide-1);
						}
						if (last_superscript > last_divide) {
							this.supBracketing(editor, event, last_superscript);
							return;
						};

						if (last_divide > last_dollar) {
							const brackets = [['(',')'],['{','}'],['[',']']];
							// if any brackets in denominator still unclosed, dont do fracReplace yet
							if (!brackets.some(e => this.unclosed_bracket(editor, e[0], e[1], position.ch, last_divide)[0])) {
								this.fracReplace(editor, event, last_superscript);
							};
						};
						
						let symbol_before = editor.getRange({line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch})
						if ( symbol_before == ')' || symbol_before == ']') {
							this.autoLargeBracket(editor, event);
							return;
						};
					};

			};
		};
					
	};

	//main functions
	private readonly supBracketing =(
		editor:Editor, 
		event: KeyboardEvent,
		last_superscript: number
		): void => {
		// superscript bracketing
		const position = editor.getCursor();
		const current_line = editor.getLine(position.line)
		const letter_before_cursor = editor.getRange(
			{line:position.line,ch:position.ch-1},
			{line:position.line,ch:position.ch}
			)

		if (last_superscript != -1) {
			const letter_after_superscript = editor.getRange({line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
			if (letter_after_superscript == '(' && letter_before_cursor == ')') {
				editor.replaceRange('}',{line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch});
				editor.replaceRange('{',{line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
				event.preventDefault();
				return;
			} else {
				const last_divide = current_line.indexOf('/',last_superscript)==-1?999:current_line.indexOf('/',last_superscript);
				const sup_close_index = Math.min(last_divide, position.ch);
				editor.replaceRange('}',{line:position.line,ch:sup_close_index});
				editor.replaceRange('{',{line:position.line,ch:last_superscript+1});
				event.preventDefault();
				return;
			}
		} else {
			return
		}
	};

	private readonly fracReplace = (
		editor: Editor,
		event: KeyboardEvent,
		last_superscript: number
	): void => {
		const position = editor.getCursor();
		const current_line = editor.getLine(position.line);
		let last_divide = current_line.lastIndexOf('/',position.ch-1);
		while (editor.getRange({line:position.line,ch:last_divide-1},{line:position.line,ch:last_divide})=='\\') {
			last_divide = current_line.lastIndexOf('/',last_divide-1);
		}
		

		// if cursor is preceeded by a close bracket, and the corresponding open bracket is found before "/", remove the brackets and enclose whole expression using \frac
		const letter_before_cursor = editor.getRange(
			{line:position.line,ch:position.ch-1},
			{line:position.line,ch:position.ch}
			)

		// if there are any brackets unclosed before divide symbol, include the open brackets into stop_symbols
		const brackets = [['(',')'],['{','}'],['[',']']];
		let stop_brackets = []
		for (let i = 0; i < brackets.length; i++) {
			if (letter_before_cursor == brackets[i][1]) {
				const open_brackets = this.unclosed_bracket(editor, brackets[i][0], brackets[i][1], position.ch-1, 0)[1]
				const pos_of_the_open_bracket = open_brackets[open_brackets.length-1]
				if (pos_of_the_open_bracket < last_divide){
					editor.replaceRange('}',{line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch});
					editor.replaceRange('}{',{line:position.line,ch:last_divide},{line:position.line,ch:last_divide+1});
					editor.replaceRange('\\frac{',{line:position.line,ch:pos_of_the_open_bracket},{line:position.line,ch:pos_of_the_open_bracket+1});
					event.preventDefault();
					return;
				} 
			}
			stop_brackets.push(...this.unclosed_bracket(editor, brackets[i][0], brackets[i][1], last_divide, 0)[1])
		}

		const stop_symbols = ['$','=','>','<',',','/'] // space not included?
		const symbol_positions = stop_symbols.map(e => current_line.lastIndexOf(e, last_divide-1))
		let frac = Math.max(last_superscript, ...symbol_positions,...stop_brackets)

		// if numerator is enclosed by (), place frac in front of () and remove ()
		let numerator:string;
		if (editor.getRange({line:position.line,ch:last_divide-1},{line:position.line,ch:last_divide}) == ')') {
			const open_bracket = this.unclosed_bracket(editor,'(',')',last_divide-1,frac)
			numerator = editor.getRange({line:position.line,ch:open_bracket[1][open_bracket[1].length-1]},{line:position.line,ch:last_divide});
			frac = open_bracket[1][open_bracket[1].length-1]-1;
		} else {
			numerator = editor.getRange({line:position.line,ch:frac+1},{line:position.line,ch:last_divide});
		}
		let numerator_remove_bracket = 0
		while (numerator[0] == ' ') {
			frac += 1;
			numerator = editor.getRange({line:position.line,ch:frac+1},{line:position.line,ch:last_divide});
		}
		if (numerator[0] == '(' && 
			numerator[numerator.length-1] == ')' && 
			numerator.indexOf('(',1) <= numerator.indexOf(')',1) 
			) {
			numerator_remove_bracket = 1
		}

		// if denominator is enclosed by (), remove ()
		const denominator = editor.getRange({line:position.line,ch:last_divide+1},{line:position.line,ch:position.ch})
		let denominator_remove_bracket = 0
		if (denominator[0] == '(' && 
			denominator[denominator.length-1] == ')' &&
			denominator.indexOf('(',1) <= denominator.indexOf(')',1)
			) {
			denominator_remove_bracket = 1
		}

		// perform \frac replace
		editor.replaceRange('}',{line:position.line,ch:position.ch-denominator_remove_bracket},{line:position.line,ch:position.ch});
		editor.replaceRange('}{',{line:position.line,ch:last_divide-numerator_remove_bracket},{line:position.line,ch:last_divide+1+denominator_remove_bracket});
		editor.replaceRange('\\frac{',{line:position.line,ch:frac+1},{line:position.line,ch:frac+1+numerator_remove_bracket});
		event.preventDefault();
	};

	private readonly autoLargeBracket = (
		editor: Editor,
		event: KeyboardEvent,
	):void => {
		const position = editor.getCursor();
		const current_line = editor.getLine(position.line);
		const brackets = [['[',']'],['(',')']];
		let left_array:number[] = [];
		let right_array:number[] = []
		for (let i = 0 ; i < brackets.length ; i++) {
			left_array.push(...this.unclosed_bracket(editor, brackets[i][0], brackets[i][1], position.ch-1, 0)[1])
			right_array.push(...this.unclosed_bracket(editor, brackets[i][0], brackets[i][1], current_line.length, position.ch-1, false)[1])
		}
		if (left_array.length > 0 || right_array.length > 0) {
			const large_operators = ['\\sum','\\int','\\frac'];
			if (
				large_operators.some(e => current_line.lastIndexOf(e,position.ch-1)>left_array[0])==true
			){
				for (let k = right_array.length-1 ; k > -1 ; k--) {
					// check if unclosed brackets already appended with \right 
					let check_right = editor.getRange({line:position.line,ch:right_array[k]-6},{line:position.line,ch:right_array[k]});
					if (check_right != '\\right') {
						editor.replaceRange('\\right',{line:position.line,ch:right_array[k]});
					} else {
						return;
					};
				};	

				for (let j = left_array.length-1 ; j > -1 ; j--) {
					// check if unclosed brackets already appended with \left
					let check_left = editor.getRange({line:position.line,ch:left_array[j]-5},{line:position.line,ch:left_array[j]});
					if (check_left != '\\left') {
						editor.replaceRange('\\left',{line:position.line,ch:left_array[j]});
					} else {
						return;
					};
				};
				event.preventDefault();
			};
		};
	};
	
	//utility functions
	private readonly unclosed_bracket = (
		editor: Editor,
		open_symbol: string,
		close_symbol: string,
		before: number,
		after: number,
		unclosed_open_symbol: boolean=true //false for unclosed_close_symbol
	): [boolean, number[]] => {
		// determine if there are unclosed bracket within the same line before the reference positionu
		const position = editor.getCursor();
		const text = editor.getRange({line:position.line,ch:after},{line:position.line,ch:before});
		let open_array:number[] = []
		let close_array:number[] = []
		for (let i = 0 ; i < text.length ; i++) {
			switch (text[i]) {
				case open_symbol:
					if (close_array.length > 0) {
						close_array.pop()
					} else {
						open_array.push(after + i);
					}
					break;
				case close_symbol:
					if (open_array.length > 0) {
						open_array.pop()
					} else {
						close_array.push(after + i);
					}
					break;				
			}
		} 
		if (unclosed_open_symbol) {
			return [open_array.length>0, open_array];
		} else {
			return [close_array.length>0, close_array];
		}
		
	};

	private readonly withinMath = (
		cm:CodeMirror.Editor,
		editor:Editor
	): Boolean => {
		// check if cursor within $$
		const position = editor.getCursor()
		const current_line = editor.getLine(position.line);
		let cursor_index = position.ch
		let from = 0;
		let found = current_line.indexOf('$', from);
		while (found != -1 && found < cursor_index) {
			let next_char = editor.getRange({line:position.line,ch:found+1},{line:position.line,ch:found+2})
			let prev_char = editor.getRange({line:position.line,ch:found-1},{line:position.line,ch:found})
			if (next_char == '$' || prev_char == '$' || next_char == ' ') {
				from = found + 1;
				found = current_line.indexOf('$', from);
				continue;
			} else {
				from = found + 1;
				let next_found = current_line.indexOf('$', from);
				if (next_found == -1) {
					return false;
				} else if (cursor_index > found && cursor_index <= next_found) {
					return true;
				} else {
					from = next_found + 1;
					found = current_line.indexOf('$', from);
					continue;
				}
			}
		}

		const document_text = editor.getValue();
		cursor_index = cm.indexFromPos(position);
		from = 0;
		found = document_text.indexOf('$$', from);
		let count = 0;
		while (found != -1 && found < cursor_index) {
			count += 1;
			from = found + 1;
			found = document_text.indexOf('$$', from);
		}
		return count % 2 == 1;
	};

	private readonly withinAnyBrackets_inline = (
		editor:Editor,
		brackets: string[][]
		): Boolean => {
		const position = editor.getCursor()
		const current_line = editor.getLine(position.line);
		return brackets.some(e => this.unclosed_bracket(editor, e[0], e[1], position.ch, 0)[0] && 
		this.unclosed_bracket(editor, e[0], e[1], current_line.length, position.ch, false)[0]) 
	};

	private readonly withinAnyBrackets_document = (
		cm:CodeMirror.Editor,
		editor:Editor,
		open_symbol: string,
		close_symbol: string
		): Boolean => {
			const document_text = editor.getValue();
			const position = editor.getCursor()
			let cursor_index = cm.indexFromPos(position);
			
			// count open symbols
			let from = 0;
			let found = document_text.indexOf(open_symbol, from);
			let count = 0;
			while (found != -1 && found < cursor_index) {
				count += 1;
				from = found + 1;
				found = document_text.indexOf(open_symbol, from);
			}
			const open_symbol_counts = count

			// count close symbols
			from = 0;
			found = document_text.indexOf(close_symbol, from);
			count = 0;
			while (found != -1 && found < cursor_index) {
				count += 1;
				from = found + 1;
				found = document_text.indexOf(close_symbol, from);
			}
			const close_symbol_counts = count

			return open_symbol_counts > close_symbol_counts;
	};

};

