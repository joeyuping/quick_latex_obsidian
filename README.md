# Quick Latex for Obsidian

This is a very simple plugin to simplify latex fraction and bracket typing, including:
* Type two consecutive **\$\$** will automatically shift the cursor inbetween the **\$\$**.
* Type **"{"** will automatically close with **"}"**.
* Type **"/"** instead of **\frac{}{}**.  
  E.g Type **\$e^2/2\$** followed by a **"space" key** will automatically replace the expression with **\$\frac{e^2}{2}\$** and display $\frac{e^2}{2}$

**Note:** The repo depends on the latest Obsidian API (obsidian.d.ts) in Typescript Definition format, which is still in early alpha so might break anytime!
**Note:** This is my first Obsidian Plugin project, bugs might be present. Please use with caution.

### Todo:  
- [ ] automatically surround subscript and superscript expressions with {}

### source code
see https://github.com/joeyuping/quick_latex_obsidian