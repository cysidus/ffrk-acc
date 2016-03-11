# FFRK Asset Cache Cleaner

This tool is used to clean the raw dump of Final Fantasy Record Keeper (FFRK) asset cache. For more information on how to dump the asset cache from your device/emulator, check this [Reddit post](https://www.reddit.com/r/FFRecordKeeper/comments/3r0mrx/how_to_extract_backgrounds_and_sprites_from_ffrk/).

The default cleaning process consists of:

 * Copying source files to a cleaner, flat structured directory
 * Renaming files to its base filename
 * Reformatting any SAJSON file to JSON and renaming it to end with `_sa.json`
 * Deobfuscating and beautifying JS, CSS, and JSON files

If the target file already exists, it won't overwrite unless the source file is more recently modified. Any folder, non-cache files, or `.ver` files will be ignored. You may change these in options.

**Currently this tool only supports global english cache.** Any file with undefined directory structure will be put in `Content/undefined` folder. You may use DeNA directory structure option to avoid this.

## Installation

Install as the NPM package `ffrk-acc`. Open the command-line and enter:

```
npm -g install ffrk-acc
```

## Usage

From the command-line, go to the asset cache directory and enter:

```
ffrk-acc [options]
```

These are the available options:

```text
  -h, --help         Output usage information
  -n, --non-cache    Clean non-cache files
  -v, --ver          Clean .ver files
  -d, --dir          Use DeNA directory structure
  -o, --overwrite    Overwrite all target files
```

A new folder called `Content` will be created inside, containing all of the cleaned asset files.
