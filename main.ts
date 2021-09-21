import * as CodeMirror from 'codemirror';
import { MarkdownView, Notice, Plugin } from 'obsidian';

export default class QuickLatexPlugin extends Plugin {

	// cmEditors is used during unload to remove our event handlers.
	private cmEditors: CodeMirror.Editor[];

	async onload() {
		console.log('loading Quick-Latex plugin');

		this.cmEditors = [];
		this.registerCodeMirror((cm) => {
			this.cmEditors.push(cm);
			cm.on('keypress', this.handleKeyPress);
			cm.on('keyup',this.handleKeyUp);
			cm.on('keydown',this.handleKeyDown);
		})
	}

	public onunload(): void {
		console.log('unloading Quick-Latex plugin');

		this.cmEditors.forEach((cm) => {
			cm.off('keypress', this.handleKeyPress);
			cm.off('keyup',this.handleKeyUp)
		  });
	}

	//triggering functions
	private readonly handleKeyDown = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {
		if (event.altKey){
			let position = cm.getCursor();
			switch (event.key) {
				case 'a':
					const selected_text = (cm.getSelection() != '') ? cm.getSelection()+'\n' : '';
					cm.replaceSelection('\\begin{align*}\n'+selected_text+'\n\\end{align*}','end');
					position = cm.getCursor();
					cm.setCursor({line:position.line-1,ch:0})
					event.preventDefault()
					break;
				
				case 'm':
					cm.replaceSelection('\\begin{pmatrix}\\end{pmatrix}','start');
					position = cm.getCursor();
					cm.setCursor({line:position.line,ch:position.ch+15})
					event.preventDefault()
					break;
			};
		};

		if (event.key=='Enter'){
			if (this.withinAnyBrackets_document(cm, '\\begin{align','\\end{align')){
				if(!event.shiftKey) {
					cm.replaceSelection('\\\\\n&')
					event.preventDefault();
				} else {
					return;
				};
				
			} else if (this.withinAnyBrackets_document(cm, '\\begin{pmatrix}','\\end{pmatrix}')){
				if(!event.shiftKey) {
					cm.replaceSelection(' \\\\ ','end')
					event.preventDefault();
				} else {
					return;
				};
			};
		};

		if (event.key=='Tab') {
			if (this.withinAnyBrackets_document(cm, '\\begin{pmatrix}','\\end{pmatrix}')){
				cm.replaceSelection(' & ','end')
				event.preventDefault();
			}
		};
	};
	
	private readonly handleKeyUp = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {

		if (['{','[','(','m'].contains(event.key)) {
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf.view instanceof MarkdownView) {
				if (this.withinMath(cm)) {
					const position = cm.getCursor();
					const brackets = [['(',')'],['{','}'],['[',']']];
					switch (event.key) {
						case '{':		
							if (!this.withinAnyBrackets_inline(cm,brackets)) {
								cm.replaceSelection('}','start')
							};
							return;
						case '[':		
							if (!this.withinAnyBrackets_inline(cm,brackets)) {
								cm.replaceSelection(']','start')
							};
							return;
						case '(':		
							if (!this.withinAnyBrackets_inline(cm,brackets)) {
								cm.replaceSelection(')','start')
							};
							return;
						case 'm':
							if (cm.getRange({line:position.line,ch:position.ch-3},{line:position.line,ch:position.ch-1})=='su') {
								cm.replaceSelection('\\limits','end')
								return;
							} else {
								return;
							}
					};
				};
			};
		};
	};

	private readonly handleKeyPress = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {

		if (['$',' ','Enter'].contains(event.key)) {
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf.view instanceof MarkdownView) {
				
				switch (event.key) {
					case '$':
						const position = cm.getCursor();
						const t = cm.getRange({line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch})
						const t2 = cm.getRange({line:position.line,ch:position.ch},{line:position.line,ch:position.ch+1})
						const t_2 = cm.getRange({line:position.line,ch:position.ch-2},{line:position.line,ch:position.ch})
						if (t == '$' && t2 != '$') {
							cm.setCursor({line: position.line,ch:position.ch-1})
						} else if (t_2 == '$$') {
							cm.setCursor({line: position.line,ch:position.ch-1})
						};
						return;

					case ' ':
						if (this.withinMath(cm)) {

							const position = cm.getCursor();
							const current_line = cm.getLine(position.line);

							// retrieve the last unbracketed superscript
							let last_superscript = current_line.lastIndexOf('^',position.ch);
							while (last_superscript != -1) {
								const letter_after_superscript = cm.getRange({line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
								if (letter_after_superscript == '{') {
									last_superscript = current_line.lastIndexOf('^', last_superscript-1);
								} else {
									break;
								}
							}

							const last_dollar = current_line.lastIndexOf('$',position.ch-1);
							const last_divide = current_line.lastIndexOf('/',position.ch-1);
							if (last_superscript > last_divide) {
								this.supBracketing(cm, event, last_superscript);
								return;
							};

							if (last_divide > last_dollar) {
								const brackets = [['(',')'],['{','}'],['[',']']];
								// if any brackets in denominator still unclosed, dont do fracReplace yet
								if (!brackets.some(e => this.unclosed_bracket(cm, e[0], e[1], position.ch, last_divide)[0])) {
									this.fracReplace(cm, event, last_superscript);
								};
							};
							
							let symbol_before = cm.getRange({line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch})
							if ( symbol_before == ')' || symbol_before == ']') {
								this.autoLargeBracket(cm, event);
								return;
							};
						};

				};
			};
		};
					
	};

	//main functions
	private readonly supBracketing =(
		cm:CodeMirror.Editor, 
		event: KeyboardEvent,
		last_superscript: number
		): void => {
		// superscript bracketing
		const position = cm.getCursor();
		const current_line = cm.getLine(position.line)
		const letter_before_cursor = cm.getRange(
			{line:position.line,ch:position.ch-1},
			{line:position.line,ch:position.ch}
			)

		if (last_superscript != -1) {
			const letter_after_superscript = cm.getRange({line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
			if (letter_after_superscript == '(' && letter_before_cursor == ')') {
				cm.replaceRange('}',{line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch});
				cm.replaceRange('{',{line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
				event.preventDefault();
				return;
			} else {
				const last_divide = current_line.indexOf('/',last_superscript)==-1?999:current_line.indexOf('/',last_superscript);
				const sup_close_index = Math.min(last_divide, position.ch);
				cm.replaceRange('}',{line:position.line,ch:sup_close_index});
				cm.replaceRange('{',{line:position.line,ch:last_superscript+1});
				event.preventDefault();
				return;
			}
		} else {
			return
		}
	};

	private readonly fracReplace = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
		last_superscript: number
	): void => {
		const position = cm.getCursor();
		const current_line = cm.getLine(position.line);
		const last_divide = current_line.lastIndexOf('/',position.ch-1);

		// if there are any brackets unclosed before divide symbol, \frac should be placed after the symbol
		const brackets = [['(',')'],['{','}'],['[',']']];
		let stop_brackets = []
		for (let i = 0; i < brackets.length; i++) {
			stop_brackets.push(...this.unclosed_bracket(cm, brackets[i][0], brackets[i][1], last_divide, 0)[1])
		}

		const stop_symbols = ['$','=','>','<',','] // space not included?
		const symbol_positions = stop_symbols.map(e => current_line.lastIndexOf(e, last_divide))
		let frac = Math.max(last_superscript, ...symbol_positions,...stop_brackets)

		// if numerator is enclosed by (), place frac in front of () and remove ()
		let numerator:string;
		if (cm.getRange({line:position.line,ch:last_divide-1},{line:position.line,ch:last_divide}) == ')') {
			const open_bracket = this.unclosed_bracket(cm,'(',')',last_divide-1,frac)
			numerator = cm.getRange({line:position.line,ch:open_bracket[1][open_bracket[1].length-1]},{line:position.line,ch:last_divide});
			frac = open_bracket[1][open_bracket[1].length-1]-1;
		} else {
			numerator = cm.getRange({line:position.line,ch:frac+1},{line:position.line,ch:last_divide});
		}
		let numerator_remove_bracket = 0
		while (numerator[0] == ' ') {
			frac += 1;
			numerator = cm.getRange({line:position.line,ch:frac+1},{line:position.line,ch:last_divide});
		}
		if (numerator[0] == '(' && 
			numerator[numerator.length-1] == ')' && 
			numerator.indexOf('(',1) <= numerator.indexOf(')',1) 
			) {
			numerator_remove_bracket = 1
		}

		// if denominator is enclosed by (), remove ()
		const denominator = cm.getRange({line:position.line,ch:last_divide+1},{line:position.line,ch:position.ch})
		let denominator_remove_bracket = 0
		if (denominator[0] == '(' && 
			denominator[denominator.length-1] == ')' &&
			denominator.indexOf('(',1) <= denominator.indexOf(')',1)
			) {
			denominator_remove_bracket = 1
		}

		cm.replaceRange('}',{line:position.line,ch:position.ch-denominator_remove_bracket},{line:position.line,ch:position.ch});
		cm.replaceRange('}{',{line:position.line,ch:last_divide-numerator_remove_bracket},{line:position.line,ch:last_divide+1+denominator_remove_bracket});
		cm.replaceRange('\\frac{',{line:position.line,ch:frac+1},{line:position.line,ch:frac+1+numerator_remove_bracket});
		event.preventDefault();
	};

	private readonly autoLargeBracket = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	):void => {
		const position = cm.getCursor();
		const current_line = cm.getLine(position.line);
		const brackets = [['[',']'],['(',')']];
		let left_array:number[] = [];
		let right_array:number[] = []
		for (let i = 0 ; i < brackets.length ; i++) {
			left_array.push(...this.unclosed_bracket(cm, brackets[i][0], brackets[i][1], position.ch-1, 0)[1])
			right_array.push(...this.unclosed_bracket(cm, brackets[i][0], brackets[i][1], current_line.length, position.ch-1, false)[1])
		}
		if (left_array.length > 0 || right_array.length > 0) {
			const large_operators = ['\\sum','\\int','\\frac'];
			if (
				large_operators.some(e => current_line.lastIndexOf(e,position.ch-1)>left_array[0])==true
			){
				for (let k = right_array.length-1 ; k > -1 ; k--) {
					// check if unclosed brackets already appended with \right 
					let check_right = cm.getRange({line:position.line,ch:right_array[k]-6},{line:position.line,ch:right_array[k]});
					if (check_right != '\\right') {
						cm.replaceRange('\\right',{line:position.line,ch:right_array[k]});
					} else {
						return;
					};
				};	

				for (let j = left_array.length-1 ; j > -1 ; j--) {
					// check if unclosed brackets already appended with \left
					let check_left = cm.getRange({line:position.line,ch:left_array[j]-5},{line:position.line,ch:left_array[j]});
					if (check_left != '\\left') {
						cm.replaceRange('\\left',{line:position.line,ch:left_array[j]});
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
		cm: CodeMirror.Editor,
		open_symbol: string,
		close_symbol: string,
		before: number,
		after: number,
		unclosed_open_symbol: boolean=true //false for unclosed_close_symbol
	): [boolean, number[]] => {
		// determine if there are unclosed bracket within the same line before the reference positionu
		const position = cm.getCursor();
		const text = cm.getRange({line:position.line,ch:after},{line:position.line,ch:before});
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

	private readonly withinMath = (cm:CodeMirror.Editor): Boolean => {
		// check if cursor within $$
		const position = cm.getCursor()
		const current_line = cm.getLine(position.line);
		let cursor_index = position.ch
		let from = 0;
		let found = current_line.indexOf('$', from);
		while (found != -1 && found < cursor_index) {
			let next_char = cm.getRange({line:position.line,ch:found+1},{line:position.line,ch:found+2})
			let prev_char = cm.getRange({line:position.line,ch:found-1},{line:position.line,ch:found})
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

		const document_text = cm.getValue();
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
		cm:CodeMirror.Editor,
		brackets: string[][]
		): Boolean => {
		const position = cm.getCursor()
		const current_line = cm.getLine(position.line);
		return brackets.some(e => this.unclosed_bracket(cm, e[0], e[1], position.ch, 0)[0] && 
		this.unclosed_bracket(cm, e[0], e[1], current_line.length, position.ch, false)[0]) 
	};

	private readonly withinAnyBrackets_document = (
		cm:CodeMirror.Editor,
		open_symbol: string,
		close_symbol: string
		): Boolean => {
			const document_text = cm.getValue();
			const position = cm.getCursor()
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

