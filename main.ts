import { Position } from 'codemirror';
import { App, MarkdownView, Editor, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface QuickLatexPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: QuickLatexPluginSettings = {
	mySetting: 'default'
}

export default class QuickLatexPlugin extends Plugin {
	public settings: QuickLatexPluginSettings;

	// cmEditors is used during unload to remove our event handlers.
	private cmEditors: CodeMirror.Editor[];

	async onload() {
		console.log('loading Quick-Latex plugin');

		await this.loadSettings();

		this.addSettingTab(new QuickLatexSettingTab(this.app, this));

		this.cmEditors = [];
		this.registerCodeMirror((cm) => {
			this.cmEditors.push(cm);
			cm.on('keydown', this.handleKeyPress);
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

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	};

	async saveSettings() {
		await this.saveData(this.settings);
	};
}

// let moveCursor = (line:number, ch:number): void => {
// 	private readonly editor: Editor;
  
// 	constructor(editor: Editor);
// 	constructor(obj: Editor) {
// 	  this.editor = obj;
// 	}

// 	const position = 

// }

class ObsidianTextEditor {
	private readonly editor: Editor;
  
	constructor(editor: Editor);
	constructor(obj: Editor) {
	  this.editor = obj;
	}
  
	public getCursorPosition = (): Point => {
	  const position = this.editor.getCursor();
	  console.debug(
		`getCursorPosition was called: line ${position.line}, ch ${position.ch}`,
	  );
	  return new Point(position.line, position.ch);
	};
  
	public setCursorPosition = (pos: Point): void => {
	  console.debug(
		`setCursorPosition was called: line ${pos.row}, ch ${pos.column}`,
	  );
	  this.editor.setCursor({ line: pos.row, ch: pos.column });
	};
}

declare class Point {
    /**
     * Row of the point.
     */
    readonly row: number;
    /**
     * Column of the point.
     */
    readonly column: number;
    /**
     * Creates a new `Point` object.
     *
     * @param row - Row of the point, starts from 0.
     * @param column - Column of the point, starts from 0.
     */
    constructor(row: number, column: number);
    /**
     * Checks if the point is equal to another point.
     */
    equals(point: Point): boolean;
}

class QuickLatexSettingTab extends PluginSettingTab {
	plugin: QuickLatexPlugin;

	constructor(app: App, plugin: QuickLatexPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
