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
						const position1 = cm.getCursor();
						const t = cm.getRange({line:position1.line,ch:position1.ch-1},{line:position1.line,ch:position1.ch})
						const t2 = cm.getRange({line:position1.line,ch:position1.ch},{line:position1.line,ch:position1.ch+1})
						const t_2 = cm.getRange({line:position1.line,ch:position1.ch-2},{line:position1.line,ch:position1.ch})
						if (t == '$' && t2 != '$') {
							cm.setCursor({line: position1.line,ch:position1.ch-1})
						} else if (t_2 == '$$') {
							cm.setCursor({line: position1.line,ch:position1.ch-1})
						};
						break;

					case ' ':
						// check whether cursor is within $$ 
						if (!withinMath(cm)) {
							break;
						}

						//TODO - perform the operation closest to cursor first
						let position = cm.getCursor();
						const current_line = cm.getLine(position.line);

						// subscript bracketing
						const last_subscript = current_line.lastIndexOf('_',position.ch);
						if (last_subscript != -1) {
							const letter_after_subscript = cm.getRange({line:position.line,ch:last_subscript+1},{line:position.line,ch:last_subscript+2});
							if (letter_after_subscript != '{') {
								const last_sup = current_line.indexOf('^',last_subscript)==-1?999:current_line.indexOf('^',last_subscript);
								const last_divide = current_line.indexOf('/',last_subscript)==-1?999:current_line.indexOf('/',last_subscript);
								const sub_close_index = Math.min(last_sup, last_divide, position.ch);
								cm.replaceRange('}',{line:position.line,ch:sub_close_index});
								cm.replaceRange('{',{line:position.line,ch:last_subscript+1});
								event.preventDefault();
							}
						}

						// superscript bracketing
						position = cm.getCursor();
						const last_superscript = current_line.lastIndexOf('^',position.ch);
						if (last_superscript != -1) {
							const letter_after_superscript = cm.getRange({line:position.line,ch:last_superscript+1},{line:position.line,ch:last_superscript+2});
							if (letter_after_superscript != '{') {
								const last_sub = current_line.indexOf('_',last_superscript)==-1?999:current_line.indexOf('_',last_superscript);
								const last_divide = current_line.indexOf('/',last_superscript)==-1?999:current_line.indexOf('/',last_superscript);
								const sup_close_index = Math.min(last_sub, last_divide, position.ch);
								cm.replaceRange('}',{line:position.line,ch:sup_close_index});
								cm.replaceRange('{',{line:position.line,ch:last_superscript+1});
								event.preventDefault();
							}
						}

						// \frac replace
						position = cm.getCursor();
						const last_dollar = current_line.lastIndexOf('$',position.ch-1);
						const last_equal = current_line.lastIndexOf('=',position.ch-1);
						const last_space = current_line.lastIndexOf(' ',position.ch-2);
						const last_greaterthan = current_line.lastIndexOf('>',position.ch-1)
						const last_lesserthan = current_line.lastIndexOf('<',position.ch-1)
						const frac = Math.max(last_equal, last_space, last_greaterthan, last_lesserthan, last_dollar)
						const last_divide = current_line.lastIndexOf('/',position.ch-1);
						if (last_divide > frac) {
							cm.replaceRange('}',{line:position.line,ch:position.ch});
							cm.replaceRange('}{',{line:position.line,ch:last_divide},{line:position.line,ch:last_divide+1});
							cm.replaceRange('\\frac{',{line:position.line,ch:frac+1});
							event.preventDefault();
						};
						break;
				};
			};
		};
	};

	private readonly handleKeyUp = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {
		if (['{','['].contains(event.key)) {
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf.view instanceof MarkdownView) {
				if (withinMath(cm)) {
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
}

function withinMath(cm:CodeMirror.Editor) {
	// check if cursor within $$
	const position = cm.getCursor();
	const current_line = cm.getLine(position.line);
	const last_dollar = current_line.lastIndexOf('$',position.ch-1);
	return last_dollar!=-1;
}