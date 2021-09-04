# Quick Latex for Obsidian

## Description:
This is a very simple plugin to simplify latex math typing such as fraction and brackets.

## Functionalities:

**1. Move cursor in Between \$\$**
* Typing two consecutive **\$\$** will automatically shift the cursor in between the **\$\$**.  

**2. Autoclose {}, [], () brackets**
* Typing **"{"**, **"["** and **"("** will automatically close with **"}"**,**"]"** or **")"**.  

**3. Auto append "\limits" after "\sum"**  
* Typing **"\sum"** will automatically append **\limits** to shorten the syntax for proper display of the limits for summation symbol.

**4. Auto enlarge brackets that contains \sum, \int or \frac**  
* Place cursor right after a () or [] bracketed expression that contains either \sum, \int or \frac and press the space key, the outermost brackets will be appended with \left and \right in order to display larger brackets to enclose these big expressions. E.g. (\sum\limits_{i=1}^n x+1) => **\left**(\sum\limits_{i=1}^n x+1 **\right**) : $(\sum\limits_{i=1}^n x+1)$ => $\left(\sum\limits_{i=1}^n x+1\right)$

**3. Auto enclose expression after superscipt with {}**
* Typing expressions after superscript **"^"** symbol follow by a **"space" key** will automatically surround the expressions with **"{}"**.  

**4. Type "/" instead of \frac{}{}.**  
* Type **\$e/2\$** followed by a **"space" key** will automatically replace the expression with **\$\frac{e}{2}\$** and display $\frac{e}{2}$  
**Tip 1:** for longer numerator or denominator expressions (especially when the expressions have white spaces which may trigger the frac-replace prematurely), enclose the expression in round brackets **()**.   
**Tip 2:** The plugin will remove the outermost brackets in numerator and denominator.  
E.g.  Typing 1/**(** \lambda n **)** followed by space key gives $\frac{1}{\lambda n}$ instead of $\frac{1}{(\lambda n)}$


**Note:**
* The repo depends on the latest Obsidian API (obsidian.d.ts) in Typescript Definition format, which is still in early alpha so might break anytime!
* This is my first Obsidian Plugin project, bugs might be present. Please use with caution.

Future:
- [X] more robust checking whether cursor is within $$
- [X] automatically add "\left" and "\right" to brackets which contains \frac, \int, \sum... when a "space" key is pressed within the brackets.
- [ ] set custom shorthand for common symbols such as \sigma
- [ ] add a settings page to allow toggling the various functions

### source code
see https://github.com/joeyuping/quick_latex_obsidian