![icon with smiling ü](ext/icons/icon128.png?raw=true)

# Umlauter

Corrects common German transcriptions like frueher to use the proper Umlaut ü (früher). Available for [Firefox](https://addons.mozilla.org/en-US/firefox/addon/umlauter/) and coming soon for Chrome.

Installation requires access to websites to correct typing in input boxes. All data is processed locally and is not sent to remote servers!

## Why?

On computer systems that don't support them, German words like "Erklärung" are often written as "Erklaerung" to [avoid the use of diacritic letters](https://en.wikipedia.org/wiki/German_orthography#Umlaut_diacritic_usage). Though this is readable, it looks odd. An easy solution would be to replace all two letter combinations to their proper Umlaut-form and though this fixes 100% of potential words, there are too many false positives (for example the word "neue" would never be written "neü"). This project uses machine learning* to predict if a substitution should be made.

## Performance

In the current configuration trained on 372308 words and looking at 4 characters to the left and right, 90.6% Umlauts are inserted correctly and 0.3% are inserted incorrectly. It is possible to increase the number of correct insertions by adjusting the confidence threshold, but that increases the false positive rate and makes the program more annoying to use. A sample set of words in shown in the final performance evaluation:

```
Umlauts changed correctly:        0.9058
Non-umlauts changed incorrectly:  0.0026
F-1 score:                        0.9431

müsste (0.0474) Mühe (0.0474) zuerst (0.9859) neue (0.9999) Müller (0.0474) früher (0.1473) anhängen (0.4901) drangehängt (0.3098) Nürnberg (0.8122) abfüllen (0.0455) Fussball (1.0000) Brühe (0.0817) rührend (0.2050) Zuerich (0.9859) löten (0.0361) zögern (0.0347) anloeten (0.9985) ähnlich (1.0000) früher (0.1473) Kühe (0.0376) Erläuterungen (0.3591) erneuern (0.9998) genügend (0.0281) Züge (0.0398) Nussnacker (1.0000)
```

which looks good enough to me.

## Implementation

A Python program parses a corpus and generates frequency counts for letter combinations (like n-grams) which are used to statistically determine the likelihood of an Umlaut being needed. This data is encoded as a JSON file to be used in the future.

A Chrome/Firefox extension reads this JSON file and uses it to predict the need for Umlauts as the user types in input boxes, replacing as needed.

## Disclaimer

This is still in beta. There are some kinks with the text replacement on the browser-side. Please [create an issue](https://github.com/jaflo/umlauter/issues/new) if you spot any problems.

<small>* fun fact: using buzzwords makes your project sound 200% more impressive</small>
