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
				const position = cm.getCursor();
				switch (event.key) {
					case '$':
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
						const current_line = cm.getLine(position.line);
						const last_dollar = current_line.lastIndexOf('$',position.ch-1);
						new Notice(`last_dollar: ${last_dollar}`)
						if (last_dollar == -1){
							break;
						};
						const last_space = current_line.lastIndexOf(' ',position.ch);
						const frac = last_space>last_dollar?last_space:last_dollar;
						const last_divide = current_line.lastIndexOf('/',position.ch);
						new Notice(`last_space: ${last_space},last_divide: ${last_divide},frac: ${frac}`);
						if (last_divide > frac) {
							cm.replaceRange('}',{line:position.line,ch:position.ch});
							cm.replaceRange('}{',{line:position.line,ch:last_divide},{line:position.line,ch:last_divide+1});
							cm.replaceRange('\\frac{',{line:position.line,ch:frac+1});
							event.preventDefault();
						}
				};
			};
		};
	};

	private readonly handleKeyUp = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent,
	  ): void => {
		if (['{'].contains(event.key)) {
			const activeLeaf = this.app.workspace.activeLeaf;
			if (activeLeaf.view instanceof MarkdownView) {
				const position = cm.getCursor();	
				const t = cm.getRange({line:position.line,ch:position.ch-2},{line:position.line,ch:position.ch-1})
				if (t != '{') {
					cm.replaceSelection('}','start')
				}
			};
		};
	};
}