import { 
	App,
	MarkdownView, 
	Plugin, 
	Editor, 
	PluginSettingTab, 
	Setting 
} from 'obsidian';

interface QuickLatexSettings {
	moveIntoMath_toggle: boolean;
	autoCloseRound_toggle: boolean;
	autoCloseSquare_toggle: boolean;
	autoCloseCurly_toggle: boolean;
	addAlignBlock_toggle: boolean;
	addAlignBlock_parameter: string;
	addMatrixBlock_toggle: boolean;
	addMatrixBlock_parameter: string;
	autoFraction_toggle: boolean;
	autoLargeBracket_toggle: boolean;
	autoSumLimit_toggle: boolean;
	autoEncloseSup_toggle: boolean;
}

const DEFAULT_SETTINGS: QuickLatexSettings = {
	moveIntoMath_toggle: true,
	autoCloseRound_toggle: true,
	autoCloseSquare_toggle: true,
	autoCloseCurly_toggle: true,
	addAlignBlock_toggle: true,
	addAlignBlock_parameter: "align*",
	addMatrixBlock_toggle: true,
	addMatrixBlock_parameter: "pmatrix",
	autoFraction_toggle: true,
	autoLargeBracket_toggle: true,
	autoSumLimit_toggle: true,
	autoEncloseSup_toggle: true,
}

export default class QuickLatexPlugin extends Plugin {
	settings: QuickLatexSettings;

	async onload() {
		console.log('loading Quick-Latex plugin');

		await this.loadSettings();

		this.app.workspace.onLayoutReady(() => {
			this.registerCodeMirror((cm: CodeMirror.Editor) => {
				cm.on('keyup', this.handleKeyUp);
				cm.on('keydown', this.handleKeyDown);
			});

			this.addSettingTab(new QuickLatexSettingTab(this.app, this));
			
			this.addCommand({
				id: 'addAlignBlock',
				name: 'Add Align Block',
				hotkeys: [
					{
					modifiers: ['Alt','Shift'],
					key: 'A',
					},
				],
				editorCallback: (editor) => this.addAlignBlock(editor),
			});

			this.addCommand({
				id: 'addMatrixBlock',
				name: 'Add Matrix Block',
				hotkeys: [
					{
					modifiers: ['Alt','Shift'],
					key: 'M',
					},
				],
				editorCallback: (editor) => this.addMatrixBlock(editor),
			});
		});

		
	}

	public onunload(): void {
		console.log('unloading Quick-Latex plugin');
		
		this.app.workspace.iterateCodeMirrors((cm) => {
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

		if (['$',' ','Enter','Tab'].contains(event.key)) {
			switch (event.key) {
				case '$':
					// perform moveIntoMath
					if (!this.settings.moveIntoMath_toggle) return;
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
					if (!this.settings.autoFraction_toggle &&
						!this.settings.autoLargeBracket_toggle &&
						!this.settings.autoEncloseSup_toggle) return;

					if (this.withinMath(cm, editor)) {

						const position = editor.getCursor();
						const current_line = editor.getLine(position.line);
						const last_dollar = current_line.lastIndexOf('$',position.ch-1);

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

						// retrieve the last divide symbol
						let last_divide = current_line.lastIndexOf('/',position.ch-1);
						while (editor.getRange({line:position.line,ch:last_divide-1},{line:position.line,ch:last_divide})=='\\') {
							last_divide = current_line.lastIndexOf('/',last_divide-1);
						}

						// perform autoEncloseSup
						if (this.settings.autoEncloseSup_toggle) {
							if (last_superscript > last_divide) {
								this.autoEncloseSup(editor, event, last_superscript);
								return;
							};
						};

						// perform autoFraction
						if (this.settings.autoFraction_toggle) {
							if (last_divide > last_dollar) {
								const brackets = [['(',')'],['{','}'],['[',']']];
								// if any brackets in denominator still unclosed, dont do autoFraction yet
								if (!brackets.some(e => this.unclosed_bracket(editor, e[0], e[1], position.ch, last_divide)[0])) {
									this.autoFraction(editor, event, last_superscript);
									return;
								};
							};
						};

						// perform autoLargeBracket
						if (this.settings.autoLargeBracket_toggle) {
							let symbol_before = editor.getRange({line:position.line,ch:position.ch-1},{line:position.line,ch:position.ch})
							if ( symbol_before == ')' || symbol_before == ']') {
								this.autoLargeBracket(editor, event);
								return;
							};
						}

					};
					break;

				case 'Enter':
					// perform Enter shortcut within matrix block
					if (this.settings.addMatrixBlock_toggle) {
						if (this.withinAnyBrackets_document(
							cm,
							editor,
							'\\begin{'+this.settings.addMatrixBlock_parameter,
							'\\end{'+this.settings.addMatrixBlock_parameter
							)){
							if(!event.shiftKey) {
								editor.replaceSelection(' \\\\ ')
								event.preventDefault();
							}; 
							return;
						} 
					}

					// perform Enter shortcut within align block
					if (this.settings.addAlignBlock_toggle) {
						if (this.withinAnyBrackets_document(
							cm,
							editor,
							'\\begin{'+this.settings.addAlignBlock_parameter,
							'\\end{'+this.settings.addAlignBlock_parameter)
							){
							if(!event.shiftKey) {
								editor.replaceSelection('\\\\\n&')
								event.preventDefault();
							}; 
							return;
						};
					}
					return;
		
				case 'Tab':
					// perform Tab shortcut within matrix block
					if (this.settings.addMatrixBlock_toggle) {
						if (this.withinAnyBrackets_document(
							cm,
							editor,
							'\\begin{'+this.settings.addMatrixBlock_parameter,
							'\\end{'+this.settings.addMatrixBlock_parameter
							)){
							editor.replaceSelection(' & ')
							event.preventDefault();
						};
						return;
					};					
			};
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
						if (!this.settings.autoCloseCurly_toggle) return;		
						if (!this.withinAnyBrackets_inline(editor,brackets)) {
							editor.replaceSelection('}')
							editor.setCursor(position)
						};
						return;
					case '[':	
						if (!this.settings.autoCloseSquare_toggle) return;	
						if (!this.withinAnyBrackets_inline(editor,brackets)) {
							editor.replaceSelection(']')
							editor.setCursor(position)
						};
						return;
					case '(':
						if (!this.settings.autoCloseRound_toggle) return;		
						if (!this.withinAnyBrackets_inline(editor,brackets)) {
							editor.replaceSelection(')')
							editor.setCursor(position)
						};
						return;
					case 'm':
						if (!this.settings.autoSumLimit_toggle) return;
						if (editor.getRange({line:position.line,ch:position.ch-3},{line:position.line,ch:position.ch-1})=='su') {
							editor.replaceSelection('\\limits')
							return;
						};
				};
			};
		};
	};

	//main functions
	private readonly autoEncloseSup =(
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

	private readonly autoFraction = (
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

		let frac = 0

		// if numerator is enclosed by (), place frac in front of () and remove ()
		let numerator_remove_bracket = 0
		if (editor.getRange({line:position.line,ch:last_divide-1},{line:position.line,ch:last_divide}) == ')') {
			const numerator_open_bracket = this.unclosed_bracket(editor,'(',')',last_divide-1, 0)[1].slice(-1)[0]
			frac = numerator_open_bracket-1;
			numerator_remove_bracket = 1
		} else {
			const stop_symbols = ['$','=','>','<',',','/',' ']
			const symbol_positions = stop_symbols.map(e => current_line.lastIndexOf(e, last_divide-1))
			frac = Math.max(last_superscript, ...symbol_positions,...stop_brackets)
		};
		
		// if denominator is enclosed by (), remove ()
		const denominator = editor.getRange(
			{line:position.line,ch:last_divide+1},
			{line:position.line,ch:position.ch}
			);
		let denominator_remove_bracket = 0;
		if (denominator.slice(-1)[0] == ')') {
			const denominator_open_bracket = this.unclosed_bracket(editor,'(',')',position.ch-1,0)[1].slice(-1)[0]
			if (denominator_open_bracket == last_divide+1){
				denominator_remove_bracket = 1;
			};
		};

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
	
	private addAlignBlock(editor: Editor) {
		const selected_text = editor.getSelection()
		editor.replaceSelection('\\begin{align*}\n'+selected_text+'\n\\end{align*}');
		const position = editor.getCursor();
		editor.setCursor({line:position.line-1,ch:editor.getLine(position.line-1).length})
	}

	private addMatrixBlock(editor: Editor) {
		editor.replaceSelection('\\begin{pmatrix}\\end{pmatrix}');
		const position = editor.getCursor();
		editor.setCursor({line:position.line,ch:position.ch-13})
	}

	//utility functions
	private readonly unclosed_bracket = (
		editor: Editor,
		open_symbol: string,
		close_symbol: string,
		before: number,
		after: number,
		unclosed_open_symbol: boolean=true //false for unclosed_close_symbol
	): [boolean, number[]] => {
		// determine if there are unclosed bracket within the range specified by before and after
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

	// Settings load and save
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

};


class QuickLatexSettingTab extends PluginSettingTab {
	plugin: QuickLatexPlugin;

	constructor(app: App, plugin: QuickLatexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	public display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Quick Latex for Obsidian - Settings'});

		new Setting(containerEl)
			.setName('Move cursor between $$ symbols')
			.setDesc('Typing two consecutive $ symbols will automatically shift the cursor in between the $$ symbols')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.moveIntoMath_toggle)
					.onChange(async (value) => {
						this.plugin.settings.moveIntoMath_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Autoclose {} curly brackets')
			.setDesc('Typing "{" will automatically close with "}"')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.autoCloseCurly_toggle)
					.onChange(async (value) => {
						this.plugin.settings.autoCloseCurly_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));
		
		new Setting(containerEl)
			.setName('Autoclose [] square brackets')
			.setDesc('Typing "[" will automatically close with "]"')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.autoCloseSquare_toggle)
					.onChange(async (value) => {
						this.plugin.settings.autoCloseSquare_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));
		
		new Setting(containerEl)
			.setName('Autoclose () round brackets')
			.setDesc('Typing "(" will automatically close with ")"')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.autoCloseRound_toggle)
					.onChange(async (value) => {
						this.plugin.settings.autoCloseRound_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Auto append "\\limits" after "\\sum"')
			.setDesc('Typing "\\sum" will automatically append "\\limits" to shorten the syntax'+
					' for proper display of the limits for summation symbol.')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.autoSumLimit_toggle)
					.onChange(async (value) => {
						this.plugin.settings.autoSumLimit_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Auto enlarge brackets that contains \\sum, \\int or \\frac')
			.setDesc('Place cursor right after a () or [] bracketed expression that contains either '+
					'\\sum, \\int or \\frac and press the space key, the outermost brackets will be'+
					'appended with \\left and \\right in order to display larger brackets to enclose these big expressions.')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.autoLargeBracket_toggle)
					.onChange(async (value) => {
						this.plugin.settings.autoLargeBracket_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Auto enclose expression after superscipt with {}')
			.setDesc('Typing expressions after superscript "^" symbol follow by a "space" key '+
					'will automatically surround the expressions with "{}"')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.autoEncloseSup_toggle)
					.onChange(async (value) => {
						this.plugin.settings.autoEncloseSup_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Type "/" instead of \\frac{}{}')
			.setDesc('Use "/" symbol for quickly typing fractions. eg. type "1/2" followed by a "space" key'+
					' instead of \\frac{1}{2}')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.autoFraction_toggle)
					.onChange(async (value) => {
						this.plugin.settings.autoFraction_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Shortcut for Align Block')
			.setDesc('Use shortcut key to quickly insert \\begin{align*} \\end{align*} block. '+
			 		'Default: "Alt+Shift+A" (Mac: "Option+Shift+A")')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.addAlignBlock_toggle)
					.onChange(async (value) => {
						this.plugin.settings.addAlignBlock_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Align Block Parameter')
			.setDesc('Set the text parameter in \\begin{parameter} and \\end{parameter}.')
			.addText((text) => text
					.setPlaceholder('default: align*')
					.setValue(this.plugin.settings.addAlignBlock_parameter)
					.onChange(async (value) => {
						this.plugin.settings.addAlignBlock_parameter = value;
						await this.plugin.saveData(this.plugin.settings);
					}));
		
		new Setting(containerEl)
			.setName('Shortcut for Matrix Block')
			.setDesc('Use shortcut key to quickly  insert \\begin{pmatrix} \\end{pmatrix} block. '+
					'Default: "Alt+Shift+M" (Mac: "Option+Shift+M")')
			.addToggle((toggle) => toggle
					.setValue(this.plugin.settings.addMatrixBlock_toggle)
					.onChange(async (value) => {
						this.plugin.settings.addMatrixBlock_toggle = value;
						await this.plugin.saveData(this.plugin.settings);
						this.display();
					}));

		new Setting(containerEl)
			.setName('Matrix Block Parameter')
			.setDesc('Set the text parameter in \\begin{parameter} and \\end{parameter}.')
			.addText((text) => text
					.setPlaceholder('default: pmatrix')
					.setValue(this.plugin.settings.addMatrixBlock_parameter)
					.onChange(async (value) => {
						this.plugin.settings.addMatrixBlock_parameter = value;
						await this.plugin.saveData(this.plugin.settings);
					}));
	}
}