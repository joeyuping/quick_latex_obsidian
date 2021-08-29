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
		})
	}

	public onunload(): void {
		console.log('unloading Quick-Latex plugin');

		this.cmEditors.forEach((cm) => {
			cm.off('keypress', this.handleKeyPress);
			cm.off('keyup',this.handleKeyUp)
		  });
	}

	private readonly handleKeyPress = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {
		if (['$',' '].contains(event.key)) {
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
						break;

					case ' ':
						if (this.withinMath(cm)) {
							const position = cm.getCursor();
							const current_line = cm.getLine(position.line);
							const last_subscript = current_line.lastIndexOf('_',position.ch);
							const last_superscript = current_line.lastIndexOf('^',position.ch);
							const last_sub_sup = Math.max(last_subscript, last_superscript);
							const last_divide = current_line.lastIndexOf('/',position.ch-1);

							if (last_sub_sup > last_divide) {
								this.sub_sup_bracketing(cm, event);
								break;
							} else {
								this.frac_replace(cm, event);
								break;
							}
						}
						break;
				};
			};
		};
	};

	private sub_sup_bracketing =(
		cm:CodeMirror.Editor, 
		event: KeyboardEvent
		): void => {
		let position = cm.getCursor();
		const current_line = cm.getLine(position.line);

		// subscript bracketing
		let last_subscript = current_line.lastIndexOf('_',position.ch);
		while (last_subscript != -1) {
			const letter_after_subscript = cm.getRange({line:position.line,ch:last_subscript+1},{line:position.line,ch:last_subscript+2});
			if (letter_after_subscript != '{') {
				const last_sup = current_line.indexOf('^',last_subscript)==-1?999:current_line.indexOf('^',last_subscript);
				const last_divide = current_line.indexOf('/',last_subscript)==-1?999:current_line.indexOf('/',last_subscript);
				const sub_close_index = Math.min(last_sup, last_divide, position.ch);
				cm.replaceRange('}',{line:position.line,ch:sub_close_index});
				cm.replaceRange('{',{line:position.line,ch:last_subscript+1});
				event.preventDefault();
				break;
			} else {
				last_subscript = current_line.lastIndexOf('_',last_subscript-1)
			}
		}

		// superscript bracketing
		position = cm.getCursor();
		let last_superscript = current_line.lastIndexOf('^',position.ch);
		while (last_superscript != -1) {
			const letter_after_superscript = cm.getRange({line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
			if (letter_after_superscript != '{') {
				const last_sub = current_line.indexOf('_',last_superscript)==-1?999:current_line.indexOf('_',last_superscript);
				const last_divide = current_line.indexOf('/',last_superscript)==-1?999:current_line.indexOf('/',last_superscript);
				const sup_close_index = Math.min(last_sub, last_divide, position.ch);
				cm.replaceRange('}',{line:position.line,ch:sup_close_index});
				cm.replaceRange('{',{line:position.line,ch:last_superscript+1});
				event.preventDefault();
				break;
			} else {
				last_superscript = current_line.lastIndexOf('^',last_superscript-1)
			}
		}
	}

	private readonly frac_replace = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	): void => {
		const position = cm.getCursor();
		const current_line = cm.getLine(position.line);
		const last_divide = current_line.lastIndexOf('/',position.ch-1);

		const stop_symbols = ['$','=',' ','>','<','^','_']
		const symbol_positions = stop_symbols.map(e => current_line.lastIndexOf(e, position.ch-1))
		let frac = Math.max(...symbol_positions)

		const symbol_before_last_divide = cm.getRange(
			{line:position.line,ch:last_divide-1},
			{line:position.line,ch:last_divide}
			)
		if (last_divide > frac) {
			if (symbol_before_last_divide==')') {
				frac = current_line.lastIndexOf('(', last_divide);
				cm.replaceRange('}',{line:position.line,ch:position.ch});
				cm.replaceRange('}{',{line:position.line,ch:last_divide-1},{line:position.line,ch:last_divide+1});
				cm.replaceRange('\\frac{',{line:position.line,ch:frac},{line:position.line,ch:frac+1});
				event.preventDefault();
			} else {
				cm.replaceRange('}',{line:position.line,ch:position.ch});
				cm.replaceRange('}{',{line:position.line,ch:last_divide},{line:position.line,ch:last_divide+1});
				cm.replaceRange('\\frac{',{line:position.line,ch:frac+1});
				event.preventDefault();
			};
		};
	}

	private readonly handleKeyUp = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {
		if (['{','['].contains(event.key)) {
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf.view instanceof MarkdownView) {
				if (this.withinMath(cm)) {
					const position = cm.getCursor();
					const t = cm.getRange({line:position.line,ch:position.ch-2},{line:position.line,ch:position.ch-1})
					switch (event.key) {
						case '{':		
							if (t != '{') {
								cm.replaceSelection('}','start')
							};
							break;
						case '[':		
							if (t != '[') {
								cm.replaceSelection(']','start')
							};
							break;
					};
				};
			};
		};
	};

	private readonly withinMath = (cm:CodeMirror.Editor): Boolean => {
		// check if cursor within $$
		const position = cm.getCursor();
		const current_line = cm.getLine(position.line);
		const last_dollar = current_line.lastIndexOf('$',position.ch-1);
		return last_dollar!=-1;
	}

}

