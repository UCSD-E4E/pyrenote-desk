# Verify Page Guide


## Overview

This page allows you to select audio files from your disk and manually verify if their label is correct. Currently accepted file types are ***.mp3***, ***.wav***, and ***.json***
 

## Verification

All files are initially in the 'Unverified' state. Use the ***z***, ***x***, ***c*** keys to toggle between the 'Unverified', 'Valid', and 'Invalid' states respectively.

You can box select multiple at once by clicking and dragging.

## Saving

You can save your progress by clicking the "Save" icon to create a JSON file containing all verification states, your current page, and file paths to all the audio files (moving your files will cause unintended behavior and can break the save).

To bring back your progress, select your JSON in file selection.

## Detailed View

You can enable a detailed view of an individual audio file by selecting a spectrogram and pressing the ***o*** key. This view will have a higher resolution spectrogram as well as the ability to modify its species label. Press ***ESC*** to exit out of the detailed view.

## Labeling 

To modify the species label of selected spectrograms(s), press ***Shift***.

## All features and keybinds

|FEATURE		 							|DEFAULT KEYS
|-------------------------------------------|-------------------------------|
|Move selection	(all 4 directions) 			|`WASD` or `arrow keys`         |
|Move selection forward (next audio file)   |`tab` 				           	|
|Change verification state 					|`z`, `x`, `c`					|
|Play/pause selected 						|`Space` or `right click`		|
|Skip forward/backward in audio playback 	|`.` and `,` 					|
|Increase/decrease skip interval		 	|`l` and `k` 					|
|Increase/decrease audio playback rate		|`m` and `n` 					|
|Reset skip interval & playback rate to default |	`r`						|
|Increase/decrease columns					|`'` and `;`					|
|Increase/decrease columns					|`'` and `;`					|
|Remove selected files (careful!) 			|`Backspace`					|
|Next/previous page 						|`Enter` and `\` 				|
|Enter/exit detailed view					|`o` and `Esc`					|
|Edit species label of selected audio		|`Shift`						|

