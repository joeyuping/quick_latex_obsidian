# Quick Latex for Obsidian

This is a very simple plugin to simplify latex math typing such as fraction and brackets, including:
* Typing two consecutive **\$\$** will automatically shift the cursor in between the **\$\$**.
* Typing **"{"**, **"["** and **"("** will automatically close with **"}"**,**"]"** or **")"**.
* Typing expressions after superscript **"^"** symbol follow by a **"space" key** will automatically surround the expressions with **"{}"**.
* Type **"/"** instead of **\frac{}{}**.  
  E.g Type **\$e/2\$** followed by a **"space" key** will automatically replace the expression with **\$\frac{e}{2}\$** and display $\frac{e}{2}$  
  **Tip** for longer denominator expression (especially when the denominator expression have white spaces which may trigger the frac-replace prematurely), try enclose the expression in round brackets **()**. The plugin will remove the outermost brackets in numerator and denominator. E.g.  1/**(** \lambda n **)**  ==>  $\frac{1}{\lambda n}$


**Note:**
* The repo depends on the latest Obsidian API (obsidian.d.ts) in Typescript Definition format, which is still in early alpha so might break anytime!
* This is my first Obsidian Plugin project, bugs might be present. Please use with caution.
* Currently do not support multiline latex

Future:
- [X] more robust checking whether cursor is within $$
- [ ] automatically add "\left" and "\right" to brackets when a white space is pressed within the brackets which contains \frac, \int, \sum...
- [ ] set custom shorthand for common symbols such as \sigma

### source code
see https://github.com/joeyuping/quick_latex_obsidian