# Quick Latex for Obsidian

This is a very simple plugin to simplify latex math typing such as fraction and brackets, including:
* Typing two consecutive **\$\$** will automatically shift the cursor in between the **\$\$**.
* Typing **"{"**, **"["** and **"("** will automatically close with **"}"**,**"]"** or **")"**.
* Typing expressions after superscript **"^"** symbol follow by a **"space" key** will automatically surround the expressions with **"{}"**.
* Type **"/"** instead of **\frac{}{}**.  
  E.g Type **\$e/2\$** followed by a **"space" key** will automatically replace the expression with **\$\frac{e}{2}\$** and display $\frac{e}{2}$  
  **Note:** The plugin use "white space" as one of the symbol to recognize where to place the \frac keyword. Try to avoid putting spaces within your numerator or denominator expression, in order for the \frac keyword to be placed correctly.  
  **Tip:** type a "white space" before your fraction expression to make it easier for the plugin to recognize the start of numerator. e.g. type "( 1/2 )" instead of "(1/2)" for $(\frac{1}{2})$

**Note:**
* The repo depends on the latest Obsidian API (obsidian.d.ts) in Typescript Definition format, which is still in early alpha so might break anytime!
* This is my first Obsidian Plugin project, bugs might be present. Please use with caution.
* Currently do not support multiline latex

Future:
- [X] - more robust checking whether cursor is within $$
- [ ] - set custom shorthand for common symbols such as \sigma

### source code
see https://github.com/joeyuping/quick_latex_obsidian