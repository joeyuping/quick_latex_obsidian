# Quick Latex for Obsidian

## Description:
This simple plugin adds various shortcuts to speedup latex math typing.

## Functionalities:

**Note:** All functionalities below can be toggled within the plugin settings page.

### 1. Move cursor between \$\$ symbols
* Typing two consecutive **\$** will automatically shift the cursor in between the **\$\$** symbols.  

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_autoMoveintoMath.gif" width="500" />

### 2. Autoclose {}, [], () brackets
* Typing **"{"**, **"["** and **"("** will automatically close with **"}"**,**"]"** or **")"**.  

### 3. Auto append "\limits" after "\sum"
* Typing **"\sum"** will automatically append **"\limits"** to shorten the syntax for proper display of the limits for summation symbol.

### 4. Auto enlarge brackets that contains \sum, \int or \frac
* Place cursor right after a () or [] bracketed expression that contains either \sum, \int or \frac and press the space key, the outermost brackets will be appended with \left and \right in order to display larger brackets to enclose these big expressions. E.g. (\sum\limits_{i=1}^n x+1) => **\left**(\sum\limits_{i=1}^n x+1 **\right**)

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_autoEnlargeBracket.gif" width="500"/>

### 5. Auto enclose expression after superscipt with {}
* Typing expressions after superscript **"^"** symbol follow by a **"space" key** will automatically surround the expressions with **"{}"**.  

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_autoEncloseSup.gif" width="500"/>

### 6. Auto Fraction - Type "/" instead of \frac{}{}.
* Type **\$e/2\$** followed by a **"space" key** will automatically replace the expression with **\$\frac{e}{2}\$**.

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_autoFraction.gif" width="500"/>

* **Tip 1:** Enclose your fraction expression within round brackets () will help the system identify the boundaries of your fraction.  

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_autoFraction1%20-%20enclose%20with%20round%20bracket.gif" width="500"/>   

* **Tip 2:** Put a **space** infront of fraction to denote the start of the fraction. Especially useful for series of fractions!  

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_autoFraction2%20-%20space.gif" width="500"/>  

* **Tip 3:** For longer numerator or denominator expressions (especially when the expressions have white spaces which may trigger the frac-replace prematurely), enclose the expressions in round brackets **()**.  

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_autoFraction3%20-%20numeratordenominator.gif" width="500"/>


* **Tip 4:** The plugin will remove the outermost brackets in numerator and denominator.  




### 7. Shortcut for Align Block
* use "Alt+Shift+A" (Mac: "Option+Shift+A") shortcut key to quickly insert **\begin{align\*} \end{align\*}** block  

* **Tip 1:** If you have already typed some expressions and want to add the \begin{align\*} and \end{align\*} to the front and back, you can first select the texts then press "Alt+Shift+A" (Mac: "Option+Shift+A").  

* **Tip 2: Quick next line syntax within align block**  
    * pressing **"enter"** within an align block will automatically insert **\\\\** to the end of the line, go to next line and add the **"&"** symbol.  
    * press **"shift+enter"** to go to next line **without** adding these symbols.

* **Tip 3: Changing parameter**
    * the default parameter "align*" can be changed in the plugin settings.

* **Tip 4: Edit Short Cut**  
    * You may edit the shortcut keys in **Settings -> Hotkeys**  

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_alignblock.gif" width="500"/>

### 8. Shortcut for Matrix Block
* use "Alt+Shift+M" (Mac: "Option+Shift+M") shortcut key to quickly insert **\begin{pmatrix} \end{pmatrix}** block  

* **Tip 1: quick next item and next line syntax within matrix block**  
    * pressing **"tab"** within a matrix block will automatically insert **" & "**.
    * pressing **"enter"** within a matrix block will automatically insert **" \\\\ "**.
    * press **"shift+enter"** to go to next line **without** adding these symbols.  

* **Tip 2: Changing parameter**
    * the default parameter "pmatrix" can be changed in the plugin settings. e.g. matrix, bmatrix, Bmatrix, vmatrix, Vmatrix

* **Tip 3: Edit Short Cut**
    * You may edit the shortcut keys in **Settings -> Hotkeys**  

<img src="https://github.com/joeyuping/quick_latex_obsidian/blob/master/demo%20gif/g_matrixblock.gif" width="500"/>

---
## Note:
* The repo depends on the latest Obsidian API (obsidian.d.ts) in Typescript Definition format, which is still in early alpha so might break anytime!
* This is my first Obsidian Plugin project, bugs might be present. Please use with caution.

---
## Future:
- [ ] set custom shorthand for common symbols such as \sigma, \lambda

---
## source code:
see https://github.com/joeyuping/quick_latex_obsidian
